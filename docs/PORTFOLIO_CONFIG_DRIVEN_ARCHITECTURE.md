# Config-Driven Dashboard Architecture

## 이력서

### DJ Node Archive — Config-Driven Dashboard Architecture

> Next.js 16 · TypeScript · Supabase · TanStack Query · Zustand

**엔트리 타입별 비즈니스 로직 분기를 설정 객체 주입으로 통합**

- 4종 엔트리(Event/Mixset/Link/Custom)마다 생성 폼 구조, 검증 규칙, 메뉴 구성, 프리뷰 연동 조건이 모두 다른 요구사항을 `Record<EntryType, Config>` 레지스트리 패턴으로 해결
- 새 타입 추가 시 TypeScript 컴파일 에러로 모든 config 누락을 강제 감지, 무결성 테스트로 런타임까지 검증

**2단계 Zod 스키마 검증 시스템 설계**

- Draft(생성 허용) / Publish(공개 허용) 이중 스키마를 `ENTRY_SCHEMAS[type]`에 선언하고, `useCreateEntryForm` 팩토리 훅이 사용자의 publish/private 선택에 따라 스키마를 동적 전환
- `canCreate()`, `canAddToView()`, `getMissingFieldLabels()` 등 검증 헬퍼를 config에서 파생하여 트리·에디터·드래그 드롭 등 5개 이상 컴포넌트에서 일관된 검증 제공

**선언적 메뉴 시스템 + 확인 전략 분리**

- 타입별 메뉴 아이템 배열과 삭제 확인 전략(simple / type-to-confirm)을 `MenuConfig`로 선언하고, `resolveMenuItems(config, handlers)` 리졸버가 런타임에 핸들러를 바인딩
- 에디터·트리·페이지 리스트 3곳의 메뉴가 동일 config 시스템을 공유하면서 컨텍스트별로 다른 메뉴 구성 제공

**Optimistic Mutation 팩토리로 8개 뮤테이션 패턴 통합**

- `OptimisticMutationConfig<T>`에 낙관적 업데이트 로직, 프리뷰 리프레시 조건(`boolean | (params) => boolean`), 프리뷰 타겟을 선언
- 팩토리가 캐시 스냅샷 → 낙관적 적용 → 에러 롤백 → 무효화 → 프리뷰 리프레시 전체 플로우를 자동 처리

---

## 포트폴리오

### 설정 기반 아키텍처로 엔트리 타입 분기 문제 해결하기

#### 문제

DJ 아카이브 대시보드는 Event, Mixset, Link, Custom 4종의 엔트리 타입을 다룬다. 각 타입마다 요구사항이 전부 다르다.

- **생성 폼**: Event는 날짜·베뉴·라인업 필드가 있고 import/create 워크플로 분기가 있다. Link는 URL 하나면 된다. Custom은 폼 없이 즉시 생성된다.
- **검증 규칙**: Event는 포스터·날짜·베뉴가 있어야 공개 가능하지만, 제목만으로 저장은 가능해야 한다. 타입마다 draft/publish 기준이 다르다.
- **메뉴 구성**: Event 삭제는 제목을 직접 입력하는 type-to-confirm이 필요하고, 나머지는 단순 확인이면 된다. 이미지 편집 메뉴는 Event·Mixset에만 있다.
- **프리뷰 연동**: 필드 수정 시 프리뷰를 갱신해야 하는데, 어떤 필드가 프리뷰에 영향을 주는지가 타입마다 다르다.

초기에는 컴포넌트 안에서 `if (type === 'event')` 분기로 처리했는데, 타입이 추가될수록 분기가 곳곳에 흩어지고 누락이 생겼다.

#### 설계

**핵심 원칙: 분기를 코드가 아닌 설정에 담는다.**

```
config/
├── entryConfig.ts        ← 타입 소스 오브 트루스 (badge, label)
├── entryFieldConfig.ts   ← 필드 메타 + 2단계 Zod 스키마
├── entryFormConfig.ts    ← 생성 폼 (defaultValues, toEntry, publishable)
├── fieldBlockConfig.ts   ← 디테일 뷰 필드↔컴포넌트 매핑
├── menuConfig.ts         ← 메뉴 아이템 + 확인 전략
├── customBlockConfig.ts  ← 커스텀 블록 타입 (icon, schema, defaultData)
└── __tests__/            ← config 무결성 테스트
```

모든 config가 `Record<EntryType, ...>` 타입이라서, 새 타입을 `EntryType` 유니온에 추가하면 config를 채우지 않은 곳에서 즉시 컴파일 에러가 발생한다.

#### 생성 폼 — 팩토리 훅에 config 주입

```typescript
// config: 타입별로 다른 부분만 선언
const EVENT_FORM_CONFIG = {
  type: 'event',
  publishable: true,
  defaultValues: { title: '', date: '', venue: '', ... },
  toEntry: (formData) => ({ ...createEmptyEntry('event'), ...formData }),
};

// 팩토리: 공통 로직은 한 곳에
function useCreateEntryForm(config) {
  const schema = ENTRY_SCHEMAS[config.type][publishOption]; // draft or publish
  return useForm({ resolver: zodResolver(schema), defaultValues: config.defaultValues });
}
```

각 폼 컴포넌트는 config 객체를 팩토리에 넘기기만 하면 검증·제출·에러 매핑이 자동으로 동작한다. Custom은 `FORM_CONFIGS.custom = null`로 폼 자체를 건너뛴다.

#### 검증 — 이중 스키마로 draft/publish 분리

```typescript
ENTRY_SCHEMAS = {
  event:  { create: draftEventSchema, view: publishEventSchema },
  mixset: { create: draftMixsetSchema, view: publishMixsetSchema },
  ...
};
```

`canCreate(entry)`는 draft 스키마로, `canAddToView(entry)`는 publish 스키마로 검증한다. 트리 아이템의 상태 아이콘, 에디터의 경고 메시지, 드래그 드롭 게이트 등 5곳 이상에서 동일한 `canAddToView()`를 호출하므로 검증 기준이 한 곳에서 관리된다.

#### 메뉴 — 선언과 실행 분리

```typescript
// 선언: 무엇이 있고, 어떤 확인이 필요한지
EDITOR_MENU_CONFIG = {
    event: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE_TYPE_TO_CONFIRM],
    link: [EDIT_TITLE, SEPARATOR, DELETE_SIMPLE],
};

// 실행: 컴포넌트가 핸들러만 제공
const items = resolveMenuItems(config[entry.type], {
    'edit-title': () => openTitleModal(),
    delete: () => removeEntry(entry.id),
});
```

메뉴 아이템의 `confirm` 속성에 따라 `useConfirmAction` 훅이 자동으로 확인 모달을 끼워넣는다. 컴포넌트는 확인 전략을 몰라도 된다.

#### 뮤테이션 — 프리뷰 연동 조건을 config로

```typescript
const update = useMutation(
    makeOptimisticMutation({
        mutationFn: ({ entry }) => updateEntry(entry),
        optimisticUpdate: ({ entry }, entries) =>
            entries.map((e) => (e.id === entry.id ? entry : e)),
        triggersPreview: ({ entry, changedFields }) => hasPreviewField(entry.type, changedFields),
    })
);
```

`hasPreviewField`는 `FIELD_CONFIG[type]`에서 해당 필드의 `triggersPreview: true` 여부를 조회한다. 제목을 바꾸면 프리뷰가 갱신되고, 내부 메모를 바꾸면 갱신되지 않는 식의 세밀한 제어가 config 한 줄로 결정된다.

#### 배운 점

**설정 객체는 요구사항 문서다.** `EDITOR_MENU_CONFIG`를 보면 "Event 삭제는 type-to-confirm, Link는 simple"이라는 기획 의도가 코드 자체로 읽힌다. 분기문 속에 묻힌 요구사항보다 유지보수가 쉽다.

**타입 시스템이 config의 완전성을 보장한다.** `Record<EntryType, ...>`를 쓰면 새 타입 추가 시 "어디를 고쳐야 하는지" 컴파일러가 알려준다. 여기에 무결성 테스트를 더해 런타임 정합성까지 검증했다.

**팩토리 + config 조합은 DRY와 유연성을 동시에 달성한다.** `useCreateEntryForm` 팩토리는 공통 로직(폼 초기화, 스키마 전환, 제출 처리)을 한 곳에 두고, 타입별 차이(필드 구조, 변환 함수, publish 가능 여부)는 config로 주입받는다. 새 타입을 추가할 때 팩토리를 수정할 필요가 없다.
