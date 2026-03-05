# Field Props Redesign: 코어 컴포넌트 + 래퍼 기반 저장/검증 분리

> 2026-03-06 | feat/108-block-field-unification | 기존 설계 문서의 amendment

## 1. 배경

기존 설계에서 코어 필드 컴포넌트는 `FieldComponentProps<T>` (value/onChange) 계약을 사용한다.
실제 사용 패턴을 보면 부모가 `onChange`를 받아서 하는 일이 **거의 바로 저장**이다:

```typescript
// EventDetailView - 부모가 하는 일이 거의 없음
const handleImageChange = (value: ImageFieldValue) => {
    onSave('posterUrl', value.url); // 그냥 전달만
};
```

이 프로젝트에서 각 필드는 **독립 저장 단위**이고, 크로스 필드 검증이나 폼 일괄 저장이 없다.
그러나 Create Form은 RHF 기반 일괄 Submit + Zod 검증을 사용한다.

**두 가지 모드를 모두 지원**해야 하므로, 코어 컴포넌트는 순수 UI로 유지하고
저장/검증 전략은 래퍼가 담당하는 구조로 전환한다.

## 2. 핵심 결정

### 코어 컴포넌트: value/onChange 유지

```typescript
interface FieldComponentProps<T> {
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
}
```

코어 컴포넌트는 **순수 UI**. 저장 방식, 검증, 모드(Edit/Create)를 모른다.
`onChange`는 "값이 바뀌었다"는 신호일 뿐, 저장을 의미하지 않는다.

### 저장/검증 책임은 래퍼에서

| 모드   | 래퍼               | 역할                            |
| ------ | ------------------ | ------------------------------- |
| Edit   | `EditFieldWrapper` | 검증(Zod) + 저장 전략(훅 주입)  |
| Create | RHF `FormField`    | 검증(Zod) + Submit 시 일괄 저장 |

코어 컴포넌트 입장에서 둘 다 동일: `value` 받고, `onChange` 호출.

## 3. EditFieldWrapper 설계

### 설정 기반 훅 주입

저장 전략을 문자열(`'debounce'`, `'immediate'`)로 선언하지 않고,
**훅 자체를 config에서 주입**한다.

```typescript
// 저장 훅 인터페이스 (공통)
interface SaveSyncReturn<T> {
    localValue: T;
    setLocalValue: (value: T) => void;
    saveStatus: SaveStatus;
}

type UseSaveHook<T> = (value: T, onSave: (value: T) => void) => SaveSyncReturn<T>;
```

```typescript
// 저장 훅 구현체
function useImmediateSave<T>(value: T, onSave: (v: T) => void): SaveSyncReturn<T> {
    return { localValue: value, setLocalValue: onSave, saveStatus: 'idle' };
}

function useDebouncedSave<T>(value: T, onSave: (v: T) => void): SaveSyncReturn<T> {
    return useFieldSync({ value, onSave, debounceMs: 800 });
}
```

### Config에서 훅 주입

```typescript
// config/entryBlockTemplate.ts
const EVENT_BLOCK_TEMPLATE: BlockTemplate[] = [
    {
        type: 'image',
        fieldKey: 'posterUrl',
        required: true,
        props: { aspectRatio: 'portrait' },
        schema: imageFieldSchema,
        useSave: useImmediateSave,
    },
    {
        type: 'text',
        fieldKey: 'description',
        required: false,
        schema: descriptionSchema,
        useSave: useDebouncedSave,
    },
];
```

### EditFieldWrapper 구현

```typescript
function EditFieldWrapper<T>({ config, value, onSave, children }) {
    // config가 준 훅을 그대로 실행 — 분기 없음
    const { localValue, setLocalValue, saveStatus } = config.useSave(value, (v) => {
        // Zod 검증 후 저장
        if (config.schema) {
            const result = config.schema.safeParse(v);
            if (!result.success) return;
        }
        onSave(v);
    });

    return children({ value: localValue, onChange: setLocalValue, saveStatus });
}
```

### 사용 예시

```typescript
// Edit — 이미지 (즉시 저장)
<EditFieldWrapper config={imageBlockConfig} value={posterUrl} onSave={save}>
    {({ value, onChange }) => <ImageField value={value} onChange={onChange} />}
</EditFieldWrapper>

// Edit — 텍스트 (디바운스)
<EditFieldWrapper config={descBlockConfig} value={description} onSave={save}>
    {({ value, onChange }) => <TextField value={value} onChange={onChange} />}
</EditFieldWrapper>

// Create — RHF가 래퍼 역할
<FormField
    control={control}
    name="posterUrl"
    render={({ field }) => <ImageField value={field.value} onChange={field.onChange} />}
/>
```

## 4. 컴포넌트 계층 구조

### Custom 블록 Edit

```
SortableBlock       (dnd-kit 좌표 + style)
  └─ BlockWrapper   (시각 크롬: 드래그핸들, 삭제, 라벨)
       └─ EditFieldWrapper  (검증 + 저장 전략)
            └─ ImageField   (순수 UI)
```

- `BlockWrapper`: Custom 블록 전용. 드래그/삭제 UI만 담당.
- `EditFieldWrapper`: Edit 모드 전용. 검증 + 저장 로직 담당.
- 두 래퍼는 관심사가 다르므로 합치지 않는다.

### Event Edit

```
EditFieldWrapper  (검증 + 저장 전략)
  └─ ImageField   (순수 UI)
```

BlockWrapper 불필요 (Event는 고정 순서, 드래그/삭제 없음).

### Create Form

```
RHF FormField     (검증 + Submit 시 저장)
  └─ ImageField   (순수 UI)
```

EditFieldWrapper 불필요 (RHF가 같은 역할).

## 5. ImageField 멀티 이미지 대응

ImageField는 단일 -> 멀티 이미지로 진화할 예정이다.

```typescript
interface ImageFieldProps extends FieldComponentProps<ImageFieldValue[]> {
    maxCount?: number;
    aspectRatio?: ImageAspectRatio;
    sortable?: boolean;
}
```

- 코어 컴포넌트는 `value/onChange` 유지 — 내부에서 추가/삭제/정렬 후 `onChange(배열)` 호출
- EditFieldWrapper에서 `useImmediateSave` 주입 — 디바운스 불필요
- 업로드 상태 등 복잡한 내부 상태는 ImageField가 캡슐화

## 6. 주의 사항

### 훅 주입과 React 규칙

config에 훅을 넣으면 동일 컴포넌트에서 config가 런타임에 바뀔 경우 훅 규칙 위반.
이 config는 **정적 상수**이므로 문제없다. 동적으로 config를 바꾸는 패턴은 금지.

### 검증 로직 공유

Edit(EditFieldWrapper)와 Create(RHF)에서 같은 Zod schema를 공유해야 한다.
검증 규칙이 바뀌면 한 곳만 수정하도록 schema를 공유 모듈로 관리.

## 7. 영향 범위

| 파일                                 | 변경 내용                              |
| ------------------------------------ | -------------------------------------- |
| `shared-fields/types.ts`             | `FieldComponentProps` 유지 (변경 없음) |
| `shared-fields/ImageField.tsx`       | 순수 UI 유지 (변경 없음)               |
| `config/entryBlockTemplate.ts`       | `useSave`, `schema` 필드 추가          |
| `custom-blocks/EditFieldWrapper.tsx` | **신규** — 검증 + 저장 래퍼            |
| `hooks/use-field-sync.ts`            | 유지 (useDebouncedSave에서 래핑)       |
| `hooks/use-immediate-save.ts`        | **신규** — 즉시 저장 훅                |
| `detail-views/EventDetailView.tsx`   | EditFieldWrapper 사용으로 전환         |
| `custom-blocks/ImageSection.tsx`     | EditFieldWrapper 사용으로 전환         |

## 8. 검증 체크리스트

- [ ] `FieldComponentProps`의 `value/onChange` 유지 확인
- [ ] EditFieldWrapper가 config.useSave를 통해 저장 전략 실행
- [ ] EditFieldWrapper가 config.schema를 통해 Zod 검증 실행
- [ ] Create Form에서 동일 코어 컴포넌트가 RHF FormField과 동작
- [ ] 동일 Zod schema가 Edit/Create 양쪽에서 공유됨
- [ ] 타입 체크 통과: `tsc --noEmit --pretty`
- [ ] 빌드 통과: `next build`
- [ ] 기존 동작 유지 (이미지 URL 입력 -> 저장 -> 프리뷰 반영)
