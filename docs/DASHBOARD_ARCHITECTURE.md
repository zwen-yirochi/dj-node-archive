# Dashboard Architecture

> DJ Node Archive 대시보드의 컴포넌트 구조, 상태 관리, Config 시스템, Mutation 전략을 기술한다.

**Stack:** Next.js 16 (App Router) · TypeScript · Supabase · TanStack Query 5 · Zustand 5 · dnd-kit · Zod · React Hook Form 7

---

## 1. 4-Layer Architecture

모든 기능은 Client → Route → Handler → Database 4계층을 따른다.

```
┌──────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                     │
│  ┌──────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ Components        │  │ Hooks (TQ)     │  │ Store (Zustand)  │  │
│  │ TreeSidebar       │  │ useEntries     │  │ dashboardStore   │  │
│  │ ContentPanel      │  │ useEntryDetail │  │ (ContentView,    │  │
│  │ PreviewPanel      │  │ useUserQuery   │  │  sidebar)        │  │
│  │ shared-fields/    │  │ usePageMeta    │  │                  │  │
│  └────────┬──────────┘  └──────┬─────────┘  └──────────────────┘  │
│           │  fetch()           │                                   │
├───────────┼────────────────────┼───────────────────────────────────┤
│  ROUTE LAYER                   │                                   │
│  app/api/**/route.ts           │                                   │
│  withAuth → handler 위임 (1-3줄)                                   │
├────────────────────────────────┼───────────────────────────────────┤
│  HANDLER LAYER                 │                                   │
│  lib/api/handlers/*.handlers.ts                                    │
│  Parse → Validate → Verify → Logic → Transform → DB → Response    │
├──────────────────────────────────────────────────────────────────  │
│  DATABASE LAYER                                                    │
│  lib/db/queries/*.queries.ts                                       │
│  Supabase 쿼리 → Result<T> 반환                                   │
└───────────────────────────────────────────────────────────────────┘
```

| 레이어       | 파일 위치                          | 책임                                         | 금지                     |
| ------------ | ---------------------------------- | -------------------------------------------- | ------------------------ |
| **Client**   | `hooks/`, `stores/`, `components/` | UI 렌더링, 낙관적 업데이트, 사용자 인터랙션  | DB 직접 접근             |
| **Route**    | `app/api/**/route.ts`              | 인증(withAuth), 핸들러 위임                  | 비즈니스 로직            |
| **Handler**  | `lib/api/handlers/`                | 파싱, 검증, 소유권 확인, 비즈니스 로직, 응답 | DB 직접 호출 외의 인프라 |
| **Database** | `lib/db/queries/`                  | 쿼리 실행, `Result<T>` 반환                  | 비즈니스 로직, HTTP 응답 |

---

## 2. 컴포넌트 구조

### 2.1 3-Column 레이아웃

```
┌──────────┬─────────────────────────────┬────────────┐
│          │                             │            │
│  Tree    │       ContentPanel          │  Preview   │
│  Sidebar │                             │  Panel     │
│          │  ┌───────────────────────┐  │            │
│  Bio ◀──│──│ BioDesignPanel        │  │  iframe    │
│  Page    │  │ PageListView          │  │  /{user}   │
│    └ View│  │ CreateEntryPanel      │  │            │
│  ─────── │  │ EntryDetailView       │  │            │
│  Events  │  │   ├ EventDetailView   │  │            │
│  Mixsets │  │   ├ MixsetDetailView  │  │            │
│  Links   │  │   ├ LinkDetailView    │  │            │
│  Custom  │  │   └ CustomEntryEditor │  │            │
│          │  └───────────────────────┘  │            │
│ Account  │  ← contentView.kind로 전환  │            │
└──────────┴─────────────────────────────┴────────────┘
```

### 2.2 렌더링 전략

```
layout.tsx
├── QueryProvider
│   └── ErrorBoundaryWithQueryReset          ← 레이아웃 레벨 (전체 crash 보호)
│       └── Suspense fallback={<Skeleton />}
│           └── page.tsx (Server Component)
│               ├── StoreInitializer         ← SSR data → TQ 캐시 hydration
│               ├── TreeSidebar
│               ├── ContentPanel
│               │   └── detail 분기에만:
│               │       ErrorBoundary + Suspense  ← 패널 레벨 (fetch 실패 격리)
│               │           └── EntryDetailView
│               └── PreviewPanel
```

### 2.3 SSR → Client Hydration

```
Server (page.tsx)                          Client
─────────────────                          ──────
getUser()                                     │
    ↓                                         │
getEditorDataByAuthUserId()                   │
    ↓                                         │
EditorData { user, contentEntries, pageId }   │
    ↓                                         │
<StoreInitializer initialData={...} />   ─────┤
    │                                         │
    ├── useEntries(initialData.contentEntries) ──→ ['entries'] 캐시 seed
    ├── useUserQuery(initialData.user)         ──→ ['user'] 캐시 seed
    ├── usePageMeta(initialData.pageMeta)      ──→ ['page'] 캐시 seed
    └── dashboardStore.reset()                 ──→ UI 상태 초기화
```

### 2.4 ContentPanel 라우팅

ContentPanel은 `contentView.kind`에 따라 단일 패널을 렌더링한다:

```typescript
switch (view.kind) {
    case 'bio':         return <BioDesignPanel />;
    case 'page':        return <PageListView />;
    case 'page-detail':
    case 'detail':      return <EntryDetailView entryId={view.entryId} />;
    case 'create':      return <CreateEntryPanel type={view.entryType} />;
}
```

`BioDesignPanel`, `CreateEntryPanel`, `EntryDetailView`는 `next/dynamic`으로 코드 스플릿.

### 2.5 컴포넌트별 데이터 소스

| 컴포넌트              | TanStack Query                    | Zustand           | 로컬 상태                 |
| --------------------- | --------------------------------- | ----------------- | ------------------------- |
| **TreeSidebar**       | `useEntries()`, `useUserQuery()`  | contentView, 섹션 | DnD 상태                  |
| **PageListView**      | `useEntries()`                    | —                 | DnD 상태                  |
| **BioDesignPanel**    | `useUserQuery()`, `usePageMeta()` | —                 | —                         |
| **CreateEntryPanel**  | —                                 | pageId            | 폼 상태 (RHF)             |
| **EntryDetailView**   | `useEntryDetail(id)`              | —                 | —                         |
| **CustomEntryEditor** | `useEntryDetail(id)`              | —                 | blocks (DnD 중 로컬 관리) |
| **PreviewPanel**      | `useUserQuery()`                  | —                 | iframe ref                |

---

## 3. 상태 관리

### 3.1 분리 원칙

```
TanStack Query: 서버와 동기화되는 데이터 (entries, user, page)
Zustand:        순수 UI 상태 (어떤 화면인지, 섹션 접힘 여부)
```

### 3.2 TanStack Query — 3-도메인 캐시

```
┌─────────────────────────────────────────────────────┐
│  TanStack Query                                      │
│                                                      │
│  ['entries']  →  ContentEntry[]                      │
│      │            staleTime: 60s                     │
│      │            subscribers: TreeSidebar,           │
│      │                         PageListView,         │
│      │                         EntryDetailView       │
│      │                                               │
│      └── ['entries', id]  →  ContentEntry            │
│              initialData: entries 캐시에서 find       │
│              staleTime: 60s                          │
│                                                      │
│  ['user']  →  User                                   │
│      staleTime: 5min                                 │
│      subscribers: BioDesignPanel, PreviewPanel        │
│                                                      │
│  ['page']  →  PageMeta (pageId + pageSettings)       │
│      staleTime: 60s                                  │
│      subscribers: BioDesignPanel, PreviewPanel        │
└─────────────────────────────────────────────────────┘
```

**분리 이유:** entry 수정 시 user/page 구독 컴포넌트의 불필요 리렌더 방지, 독립 invalidation.

**useEntryDetail 파생 패턴:**

```typescript
export function useEntryDetail(id: string) {
    const queryClient = useQueryClient();
    return useSuspenseQuery({
        queryKey: entryKeys.detail(id),
        queryFn: () => fetchEntryDetail(id),
        initialData: () => {
            const entries = queryClient.getQueryData<ContentEntry[]>(entryKeys.all);
            return entries?.find((e) => e.id === id);
        },
        initialDataUpdatedAt: () => {
            return queryClient.getQueryState(entryKeys.all)?.dataUpdatedAt;
        },
    });
}
```

리스트 캐시에서 `initialData`를 파생하여 추가 네트워크 요청 없이 즉시 렌더링. `initialDataUpdatedAt`으로 신선도를 상속해 staleTime 이후에는 detail API로 갱신.

### 3.3 Zustand — ContentView Discriminated Union

```typescript
type ContentView =
    | { kind: 'bio' }
    | { kind: 'page' }
    | { kind: 'page-detail'; entryId: string }
    | { kind: 'create'; entryType: EntryType }
    | { kind: 'detail'; entryId: string };
```

이전에 `activePanel` + `selectedEntryId` + `createPanelType` 3개 필드로 관리하던 것을 discriminated union으로 통합. 불가능한 상태 조합을 타입 레벨에서 제거.

---

## 4. Optimistic Mutation 시스템

### 4.1 팩토리 패턴

모든 entry mutation은 동일한 5단계 라이프사이클을 따른다:

```
cancel → snapshot → optimistic update → [success/error] → invalidate
```

이 보일러플레이트를 `makeOptimisticMutation` 팩토리로 추출:

```typescript
interface OptimisticMutationConfig<TParams> {
    mutationFn: (params: TParams, entries: ContentEntry[] | undefined) => Promise<unknown>;
    optimisticUpdate: (params: TParams, entries: ContentEntry[]) => ContentEntry[];
    triggersPreview?: boolean | ((params: TParams, snapshot: ContentEntry[]) => boolean);
    previewTarget?: PreviewTarget | ((params: TParams, snapshot: ContentEntry[]) => PreviewTarget);
}
```

**실행 순서:**

```
onMutate:
  1. cancelQueries(['entries'])        — 진행 중인 fetch 취소
  2. 현재 캐시 스냅샷 저장             — snapshotRef.current에 백업
  3. optimisticUpdate 적용             — UI 즉시 반영
  4. detail 캐시도 동기화              — ['entries', id] 캐시 업데이트

mutationFn:
  5. API 호출                          — snapshotRef에서 현재 상태 참조 가능

onSuccess:
  6. triggersPreview 조건 평가         — boolean 또는 함수
  7. previewTarget 결정                — 'userpage' | 'entry-detail'
  8. triggerPreviewRefresh(target)     — iframe 새로고침

onError:
  9. 스냅샷 롤백                       — 리스트 + detail 캐시 복구

onSettled:
  10. invalidateQueries(['entries'])   — 서버 상태와 재동기화
```

### 4.2 9개 Entry Mutations

```typescript
const m = <T>(config) =>
    makeOptimisticMutation(queryClient, snapshotRef, { ...config, onPreviewTrigger });
```

| Mutation            | optimisticUpdate                        | triggersPreview                        |
| ------------------- | --------------------------------------- | -------------------------------------- |
| `create`            | `[...entries, entry]`                   | always                                 |
| `update`            | `.map(e => e.id === id ? entry : e)`    | `hasPreviewField(type, changedFields)` |
| `updateField`       | `.map(e => {...e, [fieldKey]: value})`  | `hasPreviewField(type, [fieldKey])`    |
| `remove`            | `.filter(e => e.id !== id)`             | `wasVisibleEntry(snapshot, id)`        |
| `addToDisplay`      | displayOrder 계산 후 `.map`             | always                                 |
| `removeFromDisplay` | `.map(e => {...e, displayOrder: null})` | always                                 |
| `toggleVisibility`  | `.map(e => {...e, isVisible: !...})`    | always                                 |
| `reorder`           | positionMap으로 `.map`                  | never                                  |
| `reorderDisplay`    | orderMap으로 `.map`                     | always                                 |

### 4.3 Preview Action 시스템

```
mutation onSuccess
  └─ triggersPreview 평가
     │
     ├─ previewTarget 결정
     │   ├─ 'userpage'      → /{username} 프리뷰 새로고침
     │   └─ 'entry-detail'  → /{username}/{entryId} 프리뷰 새로고침
     │
     └─ dispatchPreviewAction({ type: 'refresh', target })
        └─ PreviewPanel의 등록된 handler가 postMessage로 iframe reload
```

Preview refresh는 "이벤트"이지 "상태"가 아니므로, Zustand `previewVersion` 카운터 대신 콜백 ref + postMessage 패턴을 사용. `hasDetailPage`가 있는 엔트리 타입(event, mixset, custom)은 detail 프리뷰를, 없는 타입(link)은 userpage 프리뷰를 타겟팅.

### 4.4 Preview Trigger 조건 (필드 단위)

| 타입   | triggersPreview: true                 | triggersPreview: false |
| ------ | ------------------------------------- | ---------------------- |
| event  | title, date, venue, imageUrls, lineup | description            |
| mixset | title, imageUrls, url                 | tracklist, description |
| link   | title, url, imageUrls, icon           | description            |
| custom | title, blocks                         | —                      |

---

## 5. Config-Driven 시스템

### 5.1 설계 원칙

**분기를 코드가 아닌 설정에 담는다.**

모든 config가 `Record<EntryType, ...>` 타입이라서, 새 타입을 `EntryType` 유니온에 추가하면 config를 채우지 않은 곳에서 즉시 컴파일 에러가 발생한다.

```
config/
├── entry/
│   ├── entry-types.ts        ← 타입 소스 오브 트루스 (badge, label, hasDetailPage)
│   ├── entry-fields.ts       ← 필드 메타데이터 + 프리뷰 트리거 판정
│   ├── entry-validation.ts   ← 2단계 Zod 스키마 레지스트리
│   ├── entry-forms.ts        ← 생성 폼 config (defaultValues, toEntry)
│   └── field-sync.ts         ← 필드별 저장 전략 (immediate/debounce)
├── ui/
│   ├── menu.ts               ← 메뉴 아이템 + 확인 전략
│   └── sidebar.ts            ← 사이드바 섹션 구성
└── __tests__/
    └── config-integrity.test.ts  ← 모든 config의 무결성 검증
```

### 5.2 EntryType — 타입 소스 오브 트루스

```typescript
export const ENTRY_TYPE_CONFIG = {
    event: { badgeType: 'EVT', label: 'Event', hasDetailPage: true },
    mixset: { badgeType: 'MIX', label: 'Mixset', hasDetailPage: true },
    link: { badgeType: 'LNK', label: 'Link', hasDetailPage: false },
    custom: { badgeType: 'BLK', label: 'Custom', hasDetailPage: true },
} as const;

export type EntryType = keyof typeof ENTRY_TYPE_CONFIG;
```

`EntryType`이 config 객체의 키에서 파생 → 타입 추가 시 config에 행을 추가하면 타입 시스템이 모든 소비처에서 에러를 발생시킨다.

### 5.3 2단계 Zod 스키마 — Draft / Publish 분리

```typescript
const ENTRY_SCHEMAS: Record<EntryType, { create: ZodSchema; view: ZodSchema }> = {
    event: { create: draftEventSchema, view: publishEventSchema },
    mixset: { create: draftMixsetSchema, view: publishMixsetSchema },
    link: { create: draftLinkSchema, view: publishLinkSchema },
    custom: { create: draftCustomSchema, view: publishCustomSchema },
};
```

| Tier     | 용도                  | 예시 (event)                           |
| -------- | --------------------- | -------------------------------------- |
| `create` | 엔트리 생성 최소 조건 | title만 있으면 생성 가능               |
| `view`   | 공개 페이지 표시 조건 | title + date + venue + lineup + images |

동일한 `safeParse` 인터페이스로 `canCreate()`, `canAddToView()`, `getMissingFieldLabels()` 판정을 5개 이상 컴포넌트에서 일관되게 제공:

- TreeItem 상태 아이콘 (warning / normal / inView)
- 드래그 드롭 게이트 (Page 섹션에 추가 가능 여부)
- 에디터 경고 메시지
- 삭제 시 프리뷰 갱신 조건

### 5.4 메뉴 시스템 — 선언과 실행 분리

```typescript
// 선언: 무엇이 있고, 어떤 확인이 필요한지
const EDITOR_MENU_CONFIG: Record<EntryType, MenuConfig> = {
    event: [DELETE_TYPE_TO_CONFIRM], // 제목 입력 확인
    mixset: [DELETE_SIMPLE], // 단순 확인
    link: [DELETE_SIMPLE],
    custom: [DELETE_SIMPLE],
};

// 실행: 컴포넌트가 핸들러만 제공
const items = resolveMenuItems(config[entry.type], {
    delete: () => removeEntry(entry.id),
});
```

`ConfirmStrategy`로 확인 전략(simple / type-to-confirm)을 선언하고, `useConfirmAction` 훅이 자동으로 확인 모달을 끼워넣는다. 컴포넌트는 확인 전략을 알 필요 없이 동작한다.

---

## 6. Shared Field + SyncedField 시스템

### 6.1 아키텍처

```
                    ┌──────────────────────┐
                    │  SyncedField         │
                    │  config 기반 저장 전략 │
                    └──────────┬───────────┘
                               │ cloneElement로 value/onChange 주입
                 ┌─────────────┼─────────────┐
                 │             │             │
           ┌─────┴─────┐ ┌────┴────┐ ┌──────┴──────┐
           │ TextField  │ │DateField│ │ ImageField  │ ...
           └───────────┘ └─────────┘ └─────────────┘
```

모든 필드 컴포넌트는 `value` + `onChange` 인터페이스를 공유하고, `SyncedField`가 저장 전략을 투명하게 처리한다:

```typescript
<SyncedField config={TEXT_FIELD_CONFIG} value={entry.title} onSave={handleSave}>
    <TextField label="Title" />
</SyncedField>
```

### 6.2 저장 전략 분기

| 전략          | config                | 동작                              | 대상 필드                 |
| ------------- | --------------------- | --------------------------------- | ------------------------- |
| **Immediate** | `{ immediate: true }` | 변경 즉시 onSave (schema 검증 후) | date, icon, image, lineup |
| **Debounced** | `{ debounceMs: 800 }` | 로컬 상태 + 디바운스 후 onSave    | title, description, venue |
| **Debounced** | `{ debounceMs: 500 }` | URL 입력에 최적화된 짧은 디바운스 | url                       |

### 6.3 useFieldSync 훅

```typescript
function useFieldSync<T>({ value, onSave, debounceMs, isEqual }) {
    const [localValue, setLocalState] = useState(value);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

    // 외부 값 동기화 — 디바운스 대기 중이 아니면 서버 값으로 업데이트
    useEffect(() => {
        if (!timeoutRef.current && !isEqual(latestLocalRef.current, value)) {
            setLocalState(value);
        }
    }, [value]);

    const setLocalValue = (newValue) => {
        setLocalState(newValue);              // 즉시 UI 반영
        setSaveStatus('saving');
        debounce(debounceMs) → {
            onSave(newValue);                 // 서버 동기화
            setSaveStatus('saved');
            2초 후 → setSaveStatus('idle');
        };
    };

    return { localValue, setLocalValue, saveStatus };
}
```

**핵심:** 로컬 값과 서버 값의 동기화 충돌을 해결. 디바운스 대기 중에는 외부 값 변경을 무시하고, 대기가 끝난 후에만 서버 값으로 동기화.

### 6.4 SaveIndicator

`SaveIndicator`가 `saveStatus`에 따라 시각적 피드백 제공:

- `idle`: 빈 공간
- `saving`: 스피너
- `saved`: 체크마크 (2초 후 idle로 복귀)
- `error`: 경고 아이콘

---

## 7. Custom Block 시스템

### 7.1 블록 타입

Custom 엔트리는 블록 배열로 구성된다:

| 블록 타입  | 데이터                | 사용하는 Shared Field  |
| ---------- | --------------------- | ---------------------- |
| `header`   | title, subtitle       | TextField              |
| `richtext` | content               | TextField (textarea)   |
| `image`    | url, alt, caption     | ImageField + TextField |
| `embed`    | url, provider         | EmbedField             |
| `keyvalue` | items: {key, value}[] | KeyValueField          |

### 7.2 CustomEntryEditor 구조

```
CustomEntryEditor
├─ SortableContext (dnd-kit)
│  └─ SortableBlock[] (드래그 핸들 + 삭제)
│     └─ BlockWrapper
│        └─ BLOCK_RENDERERS[block.type]
│           └─ SyncedField + SharedField 조합
└─ BlockToolbar ("Add block" 드롭다운)
```

`BLOCK_RENDERERS`가 블록 타입 → React 컴포넌트를 매핑하고, 각 렌더러가 `SyncedField`로 저장 전략을 주입받아 일관된 저장/피드백 동작을 제공.

---

## 8. 폼 아키텍처

### 8.1 Create vs Edit 전략 분리

|                   | Create (RHF + zodResolver)         | Edit (SyncedField + useFieldSync) |
| ----------------- | ---------------------------------- | --------------------------------- |
| **검증 시점**     | 제출 시 (onTouched mode)           | 저장 시 (schema safeParse)        |
| **저장 방식**     | 명시적 submit                      | 자동 저장 (필드별 전략)           |
| **대표 컴포넌트** | CreateEventForm                    | EventDetailView + SharedFields    |
| **이유**          | 여러 필드를 한 번에 → 폼 상태 관리 | 필드 단위 수정 → 즉시 반영 UX     |

### 8.2 Create: 팩토리 훅

```typescript
function useCreateEntryForm<T>(config: CreateEntryFormConfig<T>) {
    const schema = ENTRY_SCHEMAS[config.type][publishOption];
    const form = useForm({ resolver: zodResolver(schema), defaultValues: config.defaultValues });
    const canCreate = draftSchema.safeParse(watch()).success;
    // ...
}
```

Config 객체를 팩토리에 넘기면 검증·제출·에러 매핑이 자동으로 동작. Custom은 폼 없이 `CustomAutoCreate`로 즉시 생성 후 에디터로 이동.

---

## 9. DnD 시스템

### 9.1 TreeSidebar — 3가지 드래그 시나리오

| 소스 → 타겟               | 동작          | Mutation         |
| ------------------------- | ------------- | ---------------- |
| 섹션 엔트리 → ViewSection | 페이지에 추가 | `addToDisplay`   |
| ViewSection 내부          | 순서 변경     | `reorderDisplay` |
| 섹션 내부                 | 순서 변경     | `reorder`        |

`canAddToView()` 검증으로 미완성 엔트리의 드롭을 차단.

### 9.2 CustomEntryEditor — 블록 정렬

dnd-kit의 `SortableContext` + `verticalListSortingStrategy`로 블록 순서 변경. 드래그 종료 시 `arrayMove` → `handleBlocksSave` → `updateField` mutation.

---

## 10. 인증 & 소유권

### 10.1 withAuth 미들웨어

```typescript
export function withAuth(handler) {
    return async (request, context) => {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return unauthorizedResponse();
        return handler(request, { user, supabase, params: await context.params });
    };
}
```

### 10.2 소유권 검증 체인

```
Entry 소유권: entry.page_id → pages.user_id → users.auth_user_id === request.user.id
Page 소유권:  pages.user_id → users.auth_user_id === request.user.id
User 소유권:  findUserByAuthId(auth_user_id).id === params.id
```

---

## 11. 에러 처리

### 11.1 DB 레이어 → Result\<T\>

```typescript
type Result<T> = { success: true; data: T } | { success: false; error: AppError };
```

모든 DB 함수가 `Result<T>`를 반환하여 에러를 명시적으로 전파. `try-catch`가 아닌 패턴 매칭으로 처리:

```typescript
const result = await createEntry(data);
if (!isSuccess(result)) return internalErrorResponse(result.error.message);
return successResponse(result.data, 201);
```

### 11.2 Client 레이어 → ErrorBoundary + 롤백

- `ErrorBoundaryWithQueryReset`: "다시 시도" 클릭 시 TQ 캐시 리셋 → 실제 refetch
- Mutation 실패: `onError` → 스냅샷 롤백, `onSettled` → `invalidateQueries` (서버 재동기화)

---

## 12. 파일 구조

```
src/app/dashboard/
├── page.tsx                              # Server Component — SSR 데이터 fetch
├── layout.tsx                            # QueryProvider + ErrorBoundary + Suspense
│
├── components/
│   ├── StoreInitializer.tsx              # EditorData → 3-도메인 분배
│   ├── ErrorBoundary.tsx                 # QueryErrorResetBoundary 래퍼
│   ├── Skeleton.tsx                      # 3-column 로딩 스켈레톤
│   ├── PreviewPanel.tsx                  # iframe 프리뷰 + postMessage
│   ├── TreeSidebar/
│   │   ├── index.tsx                     # DndContext + 3-시나리오 드래그
│   │   ├── TreeItem.tsx                  # Sortable 엔트리 아이템
│   │   ├── SectionItem.tsx              # 접을 수 있는 섹션 헤더
│   │   ├── ViewSection.tsx              # 드롭존 + displayed entries
│   │   └── AccountSection.tsx           # 하단 유저 정보
│   └── ContentPanel/
│       ├── index.tsx                     # contentView.kind switch 라우터
│       ├── shared-fields/                # 공유 필드 컴포넌트
│       │   ├── SyncedField.tsx          # Config 기반 저장 전략 래퍼
│       │   ├── SaveIndicator.tsx        # 저장 상태 시각 피드백
│       │   ├── TextField.tsx            # 텍스트 입력
│       │   ├── DateField.tsx            # 날짜 선택기
│       │   ├── ImageField.tsx           # 다중 이미지 업로드
│       │   ├── EmbedField.tsx           # URL 임베드 (YouTube, SoundCloud)
│       │   ├── IconField.tsx            # 아이콘 선택기 (react-icons)
│       │   ├── LineupField.tsx          # 아티스트 레퍼런스
│       │   ├── VenueField.tsx           # 베뉴 검색
│       │   ├── LinkField.tsx            # URL 입력
│       │   ├── KeyValueField.tsx        # 키-값 쌍 에디터
│       │   └── SearchableTagField.tsx   # 태그 검색 선택
│       ├── detail-views/
│       │   ├── EntryDetailView.tsx      # 에디터 셸 (타입별 분기)
│       │   ├── EventDetailView.tsx      # 이벤트 에디터
│       │   ├── MixsetDetailView.tsx     # 믹스셋 에디터
│       │   ├── LinkDetailView.tsx       # 링크 에디터
│       │   ├── CustomEntryEditor.tsx    # 블록 기반 에디터 + DnD
│       │   ├── BlockWrapper.tsx         # 블록 드래그 핸들 + 삭제
│       │   └── custom-block.config.ts   # 블록 타입 정의 + 스키마
│       ├── create-forms/
│       │   ├── CreateEntryPanel.tsx     # 엔트리 타입 선택 → 폼 렌더링
│       │   ├── CreateEventForm.tsx      # RHF 이벤트 생성 폼
│       │   ├── CreateMixsetForm.tsx     # RHF 믹스셋 생성 폼
│       │   ├── CreateLinkForm.tsx       # RHF 링크 생성 폼
│       │   └── CustomAutoCreate.tsx     # 즉시 생성 → 에디터 이동
│       ├── BioDesignPanel.tsx           # 프로필 에디터
│       └── PageListView.tsx             # 페이지 엔트리 관리 + DnD
│
├── hooks/
│   ├── use-editor-data.ts               # Query keys + useEntries, useUserQuery, useEntryDetail
│   ├── use-mutations.ts                 # 9개 entry mutation (optimistic)
│   ├── use-user.ts                      # useUser + useUserMutations
│   ├── use-page.ts                      # usePageMeta + usePageMutations
│   ├── optimistic-mutation.ts           # makeOptimisticMutation 팩토리
│   ├── use-field-sync.ts               # 디바운스 + 로컬 상태 관리
│   ├── use-preview-actions.ts           # 프리뷰 새로고침/네비게이트
│   ├── use-create-entry-form.ts         # 생성 폼 팩토리 훅
│   ├── use-confirm-action.ts            # 확인 모달 훅
│   ├── use-array-field.ts              # 배열 필드 CRUD
│   └── entries.api.ts                   # 순수 fetch 함수 + reorder 헬퍼
│
├── config/
│   ├── entry/
│   │   ├── entry-types.ts               # EntryType 정의 (소스 오브 트루스)
│   │   ├── entry-fields.ts              # 필드 메타 + 프리뷰 트리거
│   │   ├── entry-validation.ts          # 2단계 Zod 스키마 + 검증 헬퍼
│   │   ├── entry-forms.ts              # 생성 폼 config
│   │   └── field-sync.ts               # 필드별 저장 전략
│   ├── ui/
│   │   ├── menu.ts                      # 메뉴 아이템 + 확인 전략 + 리졸버
│   │   └── sidebar.ts                   # 사이드바 섹션 구성
│   └── __tests__/
│       └── config-integrity.test.ts     # 무결성 테스트
│
└── stores/
    └── dashboardStore.ts                # ContentView + sidebar
```

---

## 13. 데이터 흐름 요약

### 13.1 Entry 생성

```
User clicks "Create Event"
  → setView({ kind: 'create', entryType: 'event' })
  → CreateEventForm (RHF + zodResolver)
  → createMutation.mutate({ pageId, entry, publishOption })
      → onMutate: [...entries, entry]        (optimistic)
      → mutationFn: POST /api/entries
      → onSuccess: triggerPreviewRefresh()
      → onSettled: invalidateQueries
  → setView({ kind: 'detail', entryId })
```

### 13.2 Entry 필드 수정 (SyncedField)

```
User edits title in EventDetailView
  → SyncedField receives input
  → useFieldSync: setLocalValue → UI 즉시 반영
  → 800ms debounce
  → onSave(newTitle)
  → handleFieldSave('title', newTitle)
  → updateField.mutate({ entryId, fieldKey: 'title', value: newTitle })
      → onMutate: entries.map(e => {...e, title: newTitle})  (optimistic)
      → mutationFn: PATCH /api/entries/:id
      → onSuccess: hasPreviewField('event', ['title']) → true → refresh
      → onSettled: invalidateQueries
```

### 13.3 Custom Block 수정

```
User edits block content
  → BLOCK_RENDERERS[block.type] → SyncedField → SharedField
  → handleBlockSave(blockId, blockData)
  → blocks 배열 업데이트
  → updateField.mutate({ entryId, fieldKey: 'blocks', value: newBlocks })
      → onMutate: entries.map(e => {...e, blocks: newBlocks})
      → onSuccess: FIELD_CONFIG.custom.blocks.triggersPreview → true → refresh
```

### 13.4 DnD: 사이드바 → 페이지 추가

```
TreeSidebar DndContext.onDragEnd
  ├─ canAddToView(entry) 검증 (Zod safeParse)
  │  └─ 실패 → 드롭 무시
  └─ addToDisplay.mutate(entryId)
     → onMutate: displayOrder 계산 + optimistic 적용
     → triggerPreviewRefresh('userpage')
```
