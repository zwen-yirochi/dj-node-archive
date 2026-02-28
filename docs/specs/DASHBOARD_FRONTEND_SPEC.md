# Dashboard Frontend Tech Spec

> 2026-03-01 기준. 대시보드 프론트엔드의 상태 관리, 컴포넌트 아키텍처, Config 시스템, 폼 패턴, 뮤테이션 전략을 기술한다.
> 백엔드(Route/Handler/Database) 레이어는 `DASHBOARD_TECH_SPEC.md`를 참조.

---

## 1. 개요

Dashboard는 DJ/아티스트가 퍼블릭 페이지를 편집하는 SPA 워크스페이스다.
3-column 레이아웃에서 엔트리(event·mixset·link)를 CRUD하고, DnD로 페이지 구성을 관리한다.

**프론트엔드 핵심 원칙:**

- 서버 상태(entries, user)는 TanStack Query 독립 캐시로 관리
- UI 상태(contentView, sidebar, pageId)는 Zustand 단일 스토어
- 모든 entry mutation은 팩토리 함수를 통해 optimistic update 보일러플레이트 제거
- Config 객체로 타입별 차이를 선언적으로 표현 (조건 분기 최소화)
- Create 폼은 RHF + zodResolver, Edit 폼은 useState + debounce로 전략 분리

---

## 2. 렌더링 전략

### 2.1 SSR → Client Hydration 흐름

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
    └── setPageId(initialData.pageId)          ──→ Zustand store
```

`page.tsx`는 서버 컴포넌트로 `EditorData`를 한 번에 fetch하고, `StoreInitializer`가 3개 도메인으로 분배한다.

### 2.2 StoreInitializer

```typescript
// 렌더링 출력 없는 headless 초기화 컴포넌트
export default function StoreInitializer({ initialData }: { initialData: EditorData }) {
    const initialized = useRef(false);

    // TanStack Query: initialData를 분리된 캐시에 주입
    useEntries(initialData.contentEntries);
    useUserQuery(initialData.user);

    // Zustand: pageId 설정 (세션 내 불변)
    useLayoutEffect(() => {
        if (!initialized.current) {
            useDashboardStore.getState().reset();
            useDashboardStore.getState().setPageId(initialData.pageId);
            initialized.current = true;
        }
    }, [initialData]);

    return null;
}
```

`useLayoutEffect` + `initialized` ref로 Strict Mode 더블 실행 방지.

### 2.3 Suspense / ErrorBoundary 경계

```
layout.tsx
├── QueryProvider
│   └── ErrorBoundaryWithQueryReset     ← 레이아웃 레벨 (전체 crash 보호)
│       └── Suspense fallback={<Skeleton />}
│           └── page.tsx (server component)
│               ├── StoreInitializer
│               ├── TreeSidebar
│               ├── ContentPanel
│               │   └── detail/page-detail 분기에만:
│               │       ErrorBoundaryWithQueryReset  ← 패널 레벨 (detail fetch 실패 격리)
│               │           └── Suspense fallback={<DetailSkeleton />}
│               │               └── EntryDetailView (useSuspenseQuery)
│               └── PreviewPanel
```

**ErrorBoundaryWithQueryReset**: `QueryErrorResetBoundary` + `react-error-boundary` 조합.
"다시 시도" 클릭 시 TQ 캐시 리셋 → 실제 refetch 발생.

**Suspense 위치 결정 기준:**

- 레이아웃 레벨: 초기 SSR 데이터 로딩 (`useEntries`, `useUserQuery`는 `initialData`가 있으므로 실제 suspend 안 함)
- 패널 레벨: `useEntryDetail`은 캐시 miss 시 개별 API 호출 → 실제 suspend 가능

---

## 3. 상태 관리 아키텍처

### 3.1 3-도메인 캐시 분리

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
│              initialData: entries에서 find            │
│              staleTime: 60s                          │
│              subscribers: EntryDetailView            │
│                                                      │
│  ['user']  →  User                                   │
│      staleTime: 5min                                 │
│      subscribers: BioDesignPanel,                    │
│                   PreviewPanel,                      │
│                   AccountSection                     │
│                                                      │
├─────────────────────────────────────────────────────┤
│  Zustand (dashboardStore)                            │
│                                                      │
│  contentView  →  ContentView (discriminated union)   │
│  sidebarSections  →  섹션별 collapsed 상태           │
│  pageId  →  string | null (세션 내 불변)             │
└─────────────────────────────────────────────────────┘
```

**분리 이유:**

- entry 수정 시 user 구독 컴포넌트(BioDesignPanel, PreviewPanel) 불필요 리렌더 방지
- user/entries 독립 invalidation
- optimistic mutation이 `ContentEntry[]`만 다루면 되어 spread 단순화

### 3.2 Query Hooks

```typescript
// hooks/use-editor-data.ts

export const userKeys  = { all: ['user'] as const };
export const entryKeys = {
    all:    ['entries'] as const,
    detail: (id: string) => ['entries', id] as const,
};

// 모든 쿼리 훅은 useSuspenseQuery — 데이터 존재를 타입 레벨에서 보장
export function useEntries(initialEntries?: ContentEntry[])      { ... }
export function useUserQuery(initialUser?: User)                 { ... }
export function useEntryDetail(id: string)                       { ... }
```

| 훅               | 캐시 키           | staleTime | initialData 소스              |
| ---------------- | ----------------- | --------- | ----------------------------- |
| `useEntries`     | `['entries']`     | 60s       | SSR (StoreInitializer)        |
| `useUserQuery`   | `['user']`        | 5min      | SSR (StoreInitializer)        |
| `useEntryDetail` | `['entries', id]` | 60s       | `['entries']` 캐시에서 `find` |

`useEntryDetail`은 리스트 캐시에서 `initialData`를 파생하여 추가 네트워크 요청 없이 즉시 렌더링한다.
`initialDataUpdatedAt`으로 리스트 캐시의 신선도를 상속 → staleTime 이후에는 detail API로 갱신.

### 3.3 Zustand Store

```typescript
// stores/dashboardStore.ts

// Discriminated union — 5가지 뷰를 단일 필드로 표현
type ContentView =
    | { kind: 'bio' }
    | { kind: 'page' }
    | { kind: 'page-detail'; entryId: string }
    | { kind: 'create'; entryType: EntryType }
    | { kind: 'detail'; entryId: string };

interface DashboardStore {
    contentView: ContentView; // 현재 표시 중인 패널
    sidebarSections: SidebarSections; // 섹션별 collapsed 상태
    pageId: string | null; // SSR에서 한 번 설정, 이후 불변

    setView: (view: ContentView) => void;
    toggleSection: (section: SectionKey) => void;
    setPageId: (pageId: string | null) => void;
    reset: () => void;
}
```

**ContentView 설계 의도:**

- 이전: `activePanel` + `selectedEntryId` + `createPanelType` 3개 필드로 관리 → 불가능한 상태 조합 존재
- 현재: discriminated union으로 불가능한 상태를 타입 레벨에서 제거
- ContentPanel에서 `switch (view.kind)` 한 줄로 라우팅

**셀렉터 패턴:**

```typescript
// 함수 참조 안정성 보장 → 불필요한 리렌더 방지
export const selectContentView = (s: DashboardStore) => s.contentView;
export const selectSetView = (s: DashboardStore) => s.setView;
export const selectPageId = (s: DashboardStore) => s.pageId;
```

### 3.4 상태 도구 선택 기준

| 기준                   | TanStack Query | Zustand             | useState/useRef          |
| ---------------------- | -------------- | ------------------- | ------------------------ |
| **서버 동기화 필요**   | entries, user  | -                   | -                        |
| **컴포넌트 간 공유**   | -              | contentView, pageId | -                        |
| **단일 컴포넌트 로컬** | -              | -                   | editingField, localEntry |
| **비렌더링 값**        | -              | -                   | snapshotRef, timeoutRef  |

---

## 4. 뮤테이션 아키텍처

### 4.1 Optimistic Mutation Factory

모든 entry mutation은 동일한 5단계 라이프사이클을 따른다:

```
cancel → snapshot → optimistic update → [success/error] → invalidate
```

이 보일러플레이트를 `makeOptimisticMutation` 팩토리로 추출:

```typescript
// hooks/optimistic-mutation.ts

interface OptimisticMutationConfig<TParams> {
    mutationFn: (params: TParams, entries: ContentEntry[] | undefined) => Promise<unknown>;
    optimisticUpdate: (params: TParams, entries: ContentEntry[]) => ContentEntry[];
    triggersPreview?: boolean | ((params: TParams, snapshot: ContentEntry[]) => boolean);
    onPreviewTrigger?: () => void;
}

function makeOptimisticMutation<TParams>(
    queryClient, snapshotRef, config
): UseMutationOptions<...> {
    return {
        mutationFn: (params) => config.mutationFn(params, snapshotRef.current),
        onMutate: async (params) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const previous = queryClient.getQueryData(entryKeys.all);
            snapshotRef.current = previous;  // mutationFn에서 참조 가능
            if (previous) queryClient.setQueryData(entryKeys.all, config.optimisticUpdate(params, previous));
            return { previous };
        },
        onSuccess: (_data, params) => {
            // triggersPreview 조건 평가 → 콜백 호출
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous) queryClient.setQueryData(entryKeys.all, ctx.previous);
        },
        onSettled: () => {
            snapshotRef.current = undefined;
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    };
}
```

**snapshotRef 패턴:**
TanStack Query 실행 순서는 `onMutate → mutationFn`. `onMutate`에서 캡처한 스냅샷을 `snapshotRef.current`에 저장 → `mutationFn`의 두 번째 인자로 전달. `addToDisplay`처럼 현재 entries 상태가 필요한 mutation에서 활용.

### 4.2 8개 Entry Mutations

```typescript
// hooks/use-mutations.ts → useEntryMutations()

const m = <T>(config) =>
    makeOptimisticMutation(queryClient, snapshotRef, { ...config, onPreviewTrigger });
```

| Mutation            | mutationFn                                  | optimisticUpdate                             | triggersPreview                        |
| ------------------- | ------------------------------------------- | -------------------------------------------- | -------------------------------------- |
| `create`            | `createEntry(pageId, entry, publishOption)` | `[...entries, entry]`                        | `true`                                 |
| `update`            | `updateEntry(id, entry)`                    | `.map(e => e.id === id ? entry : e)`         | `hasPreviewField(type, changedFields)` |
| `remove`            | `deleteEntry(id)`                           | `.filter(e => e.id !== id)`                  | `wasVisibleEntry(snapshot, id)`        |
| `addToDisplay`      | `updateEntry(id, displayOrder, isVisible)`  | displayOrder 계산 후 `.map`                  | `true`                                 |
| `removeFromDisplay` | `updateEntry(id, displayOrder: null)`       | `.map(e => {...e, displayOrder: null})`      | `true`                                 |
| `toggleVisibility`  | `updateEntry(id, isVisible: !current)`      | `.map(e => {...e, isVisible: !e.isVisible})` | `true`                                 |
| `reorder`           | `reorderEntries(updates)`                   | positionMap으로 `.map`                       | `false`                                |
| `reorderDisplay`    | `reorderDisplayAPI(updates)`                | orderMap으로 `.map`                          | `true`                                 |

### 4.3 User Mutations

User mutation은 팩토리를 사용하지 않고 개별 `useMutation`으로 정의. (3개뿐이고 캐시 타입이 `User`로 다르기 때문)

```typescript
// hooks/use-user.ts → useUserMutations()
```

| Mutation        | 패턴                                                                            | 캐시 키    |
| --------------- | ------------------------------------------------------------------------------- | ---------- |
| `updateProfile` | optimistic (cancel → snapshot → update → rollback) + onSuccess 서버 값 덮어쓰기 | `['user']` |
| `uploadAvatar`  | onSuccess만 (서버 URL 반영)                                                     | `['user']` |
| `deleteAvatar`  | optimistic (avatarUrl → '')                                                     | `['user']` |

### 4.4 BioDesignPanel 디바운스 패턴

BioDesignPanel은 텍스트 입력에 대해 특수한 "cache-then-sync" 전략을 사용:

```
키 입력
  ↓
queryClient.setQueryData(['user'], { ...prev, [field]: value })   ← 즉시 캐시 반영
  ↓
debouncedSave(500ms)                                               ← 서버 동기화
  ↓
updateProfile.mutate({ userId, updates })
```

- 캐시 직접 쓰기로 UI 즉시 반영 (타이핑 지연 없음)
- 500ms 디바운스로 서버 요청 횟수 최소화

### 4.5 Preview Trigger 시스템

```
mutation onSuccess → triggersPreview 평가 → triggerPreviewRefresh()
                                                    ↓
                                              previewRefreshRef.current()
                                                    ↓
                                              PreviewPanel iframe reload
```

**Zustand 상태(`previewVersion`) 대신 콜백 ref를 선택한 이유:**

- preview refresh는 "이벤트"이지 "상태"가 아님
- 버전 카운터는 불필요한 리렌더를 유발
- 콜백 ref는 PreviewPanel이 마운트된 동안에만 동작 → 안전한 생명주기

**triggersPreview 조건 평가:**

| 타입                            | 평가 방식                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `true` (boolean)                | 항상 트리거                                                                                  |
| `false` / 미설정                | 트리거 안 함                                                                                 |
| `(params, snapshot) => boolean` | `update`: changedFields 중 `FIELD_CONFIG[type]`에서 `triggersPreview: true`인 필드 존재 여부 |
|                                 | `remove`: 삭제 대상이 display에 포함된 엔트리인지 (`canAddToView`)                           |

---

## 5. Config 시스템

### 5.1 Config 레지스트리 전체 맵

```
config/
├── entryConfig.ts       ← ENTRY_TYPE_CONFIG: badgeType, label, titlePlaceholder
├── entryFieldConfig.ts  ← FIELD_CONFIG + ENTRY_SCHEMAS + 완성도 헬퍼
├── entryFormConfig.ts   ← EVENT_FORM_CONFIG, MIXSET_FORM_CONFIG
├── menuConfig.ts        ← EDITOR_MENU_CONFIG + 선언적 액션 리졸버
└── workflowOptions.ts   ← EVENT_CREATE_OPTIONS, PUBLISH_OPTIONS
```

### 5.2 entryConfig — 타입별 UI 메타데이터

```typescript
export const ENTRY_TYPE_CONFIG = {
    event: { badgeType: 'EVT', label: 'Event', titlePlaceholder: 'Enter event title' },
    mixset: { badgeType: 'MIX', label: 'Mixset', titlePlaceholder: 'Enter mixset title' },
    link: { badgeType: 'LNK', label: 'Link', titlePlaceholder: 'Enter link title' },
};
export type EntryType = keyof typeof ENTRY_TYPE_CONFIG;
```

`EntryType`이 config 객체의 키에서 파생 → 타입 추가 시 config에 행을 추가하면 타입 시스템이 모든 소비처에서 에러를 발생시킨다.

### 5.3 entryFieldConfig — 필드 메타데이터 + 스키마 레지스트리

```typescript
// 필드별 메타데이터 — preview 트리거 판단에 사용
interface FieldConfig {
    key: string;
    label: string;
    triggersPreview: boolean; // update mutation의 조건 함수에서 참조
}

export const FIELD_CONFIG: Record<EntryType, FieldConfig[]> = {
    event: [
        { key: 'title', label: '제목', triggersPreview: true },
        { key: 'date', label: '날짜', triggersPreview: true },
        { key: 'venue', label: '장소', triggersPreview: true },
        { key: 'posterUrl', label: '포스터 이미지', triggersPreview: true },
        { key: 'lineup', label: '라인업', triggersPreview: true },
        { key: 'description', label: '설명', triggersPreview: false },
        { key: 'links', label: '링크', triggersPreview: false },
    ],
    // mixset, link도 동일 구조
};

// Dual-schema 레지스트리 — 생성(draft) vs 공개(view) 기준 분리
export const ENTRY_SCHEMAS: Record<EntryType, { create: ZodSchema; view: ZodSchema }> = {
    event: { create: draftEventSchema, view: publishEventSchema },
    mixset: { create: draftMixsetSchema, view: publishMixsetSchema },
    link: { create: draftLinkSchema, view: publishLinkSchema },
};
```

**Dual-schema 패턴의 의미:**

- `create` (draft): 최소 저장 기준 (e.g. title만 있으면 생성 가능)
- `view` (publish): 공개 페이지 표시 기준 (e.g. 모든 필수 필드 충족)
- 동일한 `safeParse` 인터페이스로 `canCreate()`, `canAddToView()` 판정

### 5.4 entryFormConfig — 폼 전용 설정

```typescript
interface CreateEntryFormConfig<T extends FieldValues> {
    type: EntryType;
    publishable?: boolean; // publish/private 토글 UI 활성화
    defaultValues: DefaultValues<T>;
    toEntry: (formData: T) => ContentEntry;
    errorFieldMap?: Record<string, Path<T>>; // 서버 에러 → 폼 필드 매핑
}
```

**폼 설정이 별도인 이유:**

- schemas, label, canCreate는 `entryFieldConfig`/`entryConfig`에서 파생 (중복 제거)
- 폼 전용 관심사만 정의: defaultValues, 데이터 변환, 에러 매핑

### 5.5 menuConfig — 선언적 액션 시스템

```typescript
// 선언적 액션 타입
type MenuAction = { type: 'set-editing-field'; field: 'title' | 'image' } | { type: 'delete' };

// 타입별 메뉴 구성
export const EDITOR_MENU_CONFIG: Record<EntryType, EditorMenuItemConfig[]> = {
    event: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE],
    mixset: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE],
    link: [EDIT_TITLE, SEPARATOR, DELETE],
};

// resolveMenuItems: config + context → 실행 가능한 메뉴 아이템
resolveMenuItems(EDITOR_MENU_CONFIG[type], { setEditingField, onDelete });
```

**선언/실행 분리:**

- Config: "무엇을 보여줄 것인가" (데이터)
- Resolver: "어떻게 실행할 것인가" (컨텍스트 바인딩)
- 컴포넌트: 리졸브된 결과만 소비

---

## 6. 폼 아키텍처

### 6.1 Create vs Edit 전략 분리

|                   | Create (RHF)                            | Edit (useState + debounce)    |
| ----------------- | --------------------------------------- | ----------------------------- |
| **도구**          | React Hook Form + zodResolver           | useState + useDebouncedSave   |
| **검증 시점**     | 제출 시 (onTouched mode)                | 없음 (서버 검증에 위임)       |
| **저장 방식**     | 명시적 submit                           | 자동 저장 (800ms debounce)    |
| **대표 컴포넌트** | CreateEventForm, CreateMixsetForm       | EntryDetailView + Editors     |
| **이유**          | 여러 필드를 한 번에 → 폼 상태 관리 필요 | 필드 단위 수정 → 즉시 반영 UX |

### 6.2 Create: Factory Hook 패턴

```typescript
// hooks/use-create-entry-form.ts

function useCreateEntryForm<T extends FieldValues>(config: CreateEntryFormConfig<T>) {
    // config에서 파생
    const { create: draftSchema, view: publishSchema } = ENTRY_SCHEMAS[config.type];
    const { label } = ENTRY_TYPE_CONFIG[config.type];

    // 동적 resolver — publishOption에 따라 draft/publish 스키마 전환
    const form = useForm<T>({
        resolver: hasPublishOption
            ? (values, context, options) => {
                  const schema =
                      publishOptionRef.current === 'publish' ? publishSchema : draftSchema;
                  return zodResolver(schema)(values, context, options);
              }
            : zodResolver(draftSchema),
        mode: 'onTouched',
    });

    // canCreate: draftSchema.safeParse → boolean (watch로 실시간 판정)
    const canCreate = draftSchema.safeParse(watch()).success;

    // onSubmit: pageId 확인 → toEntry → mutateAsync → toast → setView
    // 에러: errorFieldMap으로 서버 에러 → 폼 필드 매핑
}
```

**소비 측 코드:**

```typescript
// CreateEventForm.tsx
const { form, canCreate, handleSubmit, publishOption, handlePublishOptionChange, ... } =
    useCreateEntryForm(EVENT_FORM_CONFIG);

return (
    <Form {...form}>
        <FormField control={form.control} name="title" render={...} />
        <FormField control={form.control} name="posterUrl" render={...} />
        ...
        <Button disabled={!canCreate} onClick={handleSubmit}>Create</Button>
    </Form>
);
```

### 6.3 Edit: Debounced Save 패턴

```typescript
// EntryDetailView.tsx

function useDebouncedSave(onSave, delay = 800) {
    const pendingFieldsRef = useRef<Set<string>>(new Set());

    const debouncedSave = (entry, changedFields) => {
        for (const key of changedFields) pendingFieldsRef.current.add(key);
        clearTimeout → setTimeout → {
            const fields = [...pendingFieldsRef.current];  // 누적된 필드 전달
            pendingFieldsRef.current.clear();
            await onSave(entry, fields);
        };
    };
}
```

**changedFields 전달 이유:**

- `update` mutation의 `triggersPreview`가 변경된 필드에 따라 조건부 판단
- `description` 수정 → preview 안 함, `title` 수정 → preview 새로고침
- `pendingFieldsRef`로 디바운스 구간 내 변경된 필드를 누적

**외부 변경 동기화:**

```typescript
// invalidateQueries 후 서버 데이터가 도착했을 때
useEffect(() => {
    if (!isSaving && !hasPendingSave()) {
        setLocalEntry(entry); // 저장 중이 아닐 때만 외부 데이터 반영
    }
}, [entry, isSaving, hasPendingSave]);
```

### 6.4 Editor Registry

```typescript
const EDITOR_REGISTRY: Record<EntryType, ComponentType<EntryEditorProps>> = {
    event:  EventEditor,
    mixset: MixsetEditor,
    link:   LinkEditor,
};

// EntryDetailView에서 동적 렌더링
const Editor = EDITOR_REGISTRY[localEntry.type];
return <Editor entry={localEntry} onUpdate={handleUpdate} ... />;
```

모든 에디터는 `EntryEditorProps` 인터페이스를 구현:

```typescript
interface EntryEditorProps {
    entry: ContentEntry;
    onUpdate: (updates: Partial<ContentEntry>) => void;
    editingField: 'title' | 'image' | null;
    onEditingDone: () => void;
}
```

---

## 7. 컴포넌트 아키텍처

### 7.1 3-Column 레이아웃

```
┌──────────┬─────────────────────────────┬────────────┐
│          │                             │            │
│  Tree    │       ContentPanel          │  Preview   │
│  Sidebar │                             │  Panel     │
│          │  ┌───────────────────────┐  │            │
│  Bio ◀──│──│ BioDesignPanel        │  │  iframe    │
│  Page    │  │ PageListView          │  │  /[user]   │
│    └ View│  │ CreateEntryPanel      │  │            │
│  ───── │  │ EntryDetailView       │  │            │
│  Events  │  └───────────────────────┘  │            │
│  Mixsets │                             │            │
│  Links   │  ← contentView.kind로 전환  │            │
│          │                             │            │
│ Account  │                             │            │
└──────────┴─────────────────────────────┴────────────┘
```

### 7.2 ContentPanel 라우팅

ContentPanel은 `contentView.kind`에 따라 단일 패널을 렌더링:

```typescript
switch (view.kind) {
    case 'bio':         return <BioDesignPanel />;
    case 'page':        return <PageListView onSelectDetail={...} />;
    case 'page-detail':
    case 'detail':      return <ErrorBoundary><Suspense><EntryDetailView /></Suspense></ErrorBoundary>;
    case 'create':      return <CreateEntryPanel type={view.entryType} />;
}
```

**Dynamic Import 전략:**

- `BioDesignPanel`, `CreateEntryPanel`, `EntryDetailView`는 `next/dynamic`으로 코드 스플릿
- `PageListView`는 정적 import (기본 뷰이므로 즉시 렌더링 필요)
- 각 dynamic import에 타입별 스켈레톤 (`PanelSkeleton`, `EditorSkeleton`) 연결

### 7.3 컴포넌트별 데이터 소스

| 컴포넌트             | TanStack Query                              | Zustand                      | Props               |
| -------------------- | ------------------------------------------- | ---------------------------- | ------------------- |
| **TreeSidebar**      | `useEntries()`, `useUser()`                 | contentView, sidebarSections | -                   |
| **PageListView**     | `useEntries()`                              | -                            | `onSelectDetail`    |
| **BioDesignPanel**   | `useUser()`, `useUserMutations()`           | -                            | -                   |
| **CreateEntryPanel** | -                                           | -                            | `type: EntryType`   |
| **CreateEventForm**  | (via useCreateEntryForm)                    | pageId, setView              | -                   |
| **CreateMixsetForm** | (via useCreateEntryForm)                    | pageId, setView              | -                   |
| **EntryDetailView**  | `useEntryDetail(id)`, `useEntryMutations()` | -                            | `entryId`, `onBack` |
| **PreviewPanel**     | `useUser()`                                 | -                            | -                   |
| **AccountSection**   | -                                           | -                            | `username`          |

### 7.4 TreeSidebar DnD 아키텍처

TreeSidebar는 dnd-kit 기반으로 3가지 드래그 시나리오를 처리:

```
시나리오 1: 섹션 내 순서 변경
  entry(events) ──drag──→ entry(events)
  → computeReorderedPositions() → reorderEntriesMutation

시나리오 2: View 섹션에 추가
  entry(any) ──drag──→ view-drop-zone
  → canAddToView() 검증 → addToDisplayMutation

시나리오 3: View 섹션 내 순서 변경
  display-entry ──drag──→ display-entry
  → computeReorderedDisplay() → reorderDisplayMutation
```

**DragData 타입:** `{ type: 'entry' | 'display-entry', entry: ContentEntry }`
각 시나리오는 `handleDragEnd`에서 `activeData.type`과 `overData.type` 조합으로 분기.

**Reorder 헬퍼 (순수 함수):**

```typescript
// entries.api.ts — React 의존성 없음
computeReorderedPositions(entries, type, entryId, newIndex)  → { id, position }[]
computeReorderedDisplay(entries, entryId, newIndex)          → { id, displayOrder }[]
```

---

## 8. QueryProvider 설정

```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5분
            gcTime: 10 * 60 * 1000, // 10분
        },
    },
});
```

| 설정             | 값    | 의미                                      |
| ---------------- | ----- | ----------------------------------------- |
| 기본 `staleTime` | 5min  | 쿼리별 오버라이드: entries 60s, user 5min |
| 기본 `gcTime`    | 10min | 비활성 캐시 10분 유지                     |

`staleTime` 오버라이드 전략:

- entries (60s): 빈번한 수정 → 짧은 유효기간
- user (5min): 드문 수정 → 기본값 유지

---

## 9. 파일 구조

```
src/app/dashboard/
├── page.tsx                              # Server Component — SSR 데이터 fetch
├── layout.tsx                            # QueryProvider + ErrorBoundary + Suspense
│
├── components/
│   ├── StoreInitializer.tsx              # EditorData → 3-도메인 분배
│   ├── ErrorBoundary.tsx                 # QueryErrorResetBoundary 래퍼
│   ├── Skeleton.tsx                      # 레이아웃 스켈레톤
│   ├── TreeSidebar/
│   │   ├── index.tsx                     # DndContext + 3-시나리오 드래그
│   │   ├── TreeItem.tsx                  # Sortable 엔트리 아이템
│   │   ├── SectionItem.tsx              # 접을 수 있는 섹션 헤더
│   │   ├── ViewSection.tsx              # 드롭존 + displayed entries
│   │   └── AccountSection.tsx           # 하단 유저 정보
│   ├── ContentPanel/
│   │   ├── index.tsx                     # contentView.kind switch 라우터
│   │   ├── PageListView.tsx             # 엔트리 그리드 + DnD
│   │   ├── BioDesignPanel.tsx           # 프로필 편집 (debounced save)
│   │   ├── CreateEntryPanel.tsx         # 엔트리 타입 선택 → 폼 렌더링
│   │   ├── CreateEventForm.tsx          # RHF 이벤트 생성 폼
│   │   ├── CreateMixsetForm.tsx         # RHF 믹스셋 생성 폼
│   │   ├── EntryDetailView.tsx          # 에디터 호스트 (debounced save)
│   │   ├── EventImportSearch.tsx        # 이벤트 검색/임포트
│   │   └── editors/
│   │       ├── types.ts                 # EntryEditorProps 인터페이스
│   │       ├── EventEditor.tsx          # 이벤트 인라인 에디터
│   │       ├── MixsetEditor.tsx         # 믹스셋 인라인 에디터
│   │       └── LinkEditor.tsx           # 링크 인라인 에디터
│   └── PreviewPanel.tsx                 # iframe 프리뷰 + lazy render
│
├── hooks/
│   ├── index.ts                         # Barrel exports
│   ├── use-editor-data.ts               # Query keys + useEntries, useUserQuery, useEntryDetail
│   ├── use-mutations.ts                 # useEntryMutations (8개)
│   ├── use-user.ts                      # useUser + useUserMutations (3개)
│   ├── optimistic-mutation.ts           # makeOptimisticMutation 팩토리
│   ├── use-create-entry-form.ts         # 폼 팩토리 훅
│   ├── use-preview-refresh.ts           # 콜백 ref 기반 프리뷰 트리거
│   ├── entries.api.ts                   # 순수 API 함수 + reorder 헬퍼
│   └── use-array-field.ts              # 배열 필드 CRUD 훅
│
├── config/
│   ├── entryConfig.ts                   # ENTRY_TYPE_CONFIG (badge, label)
│   ├── entryFieldConfig.ts              # FIELD_CONFIG + ENTRY_SCHEMAS + 완성도 헬퍼
│   ├── entryFormConfig.ts               # EVENT_FORM_CONFIG, MIXSET_FORM_CONFIG
│   ├── menuConfig.ts                    # EDITOR_MENU_CONFIG + resolveMenuItems
│   └── workflowOptions.ts              # EventCreateOption, PublishOption
│
└── stores/
    └── dashboardStore.ts                # ContentView + sidebar + pageId
```

---

## 10. 데이터 흐름 요약

### 10.1 Entry 생성 (Create)

```
User clicks "Create Event"
  → setView({ kind: 'create', entryType: 'event' })
  → ContentPanel renders CreateEventForm

User fills form + clicks "Create"
  → useCreateEntryForm.onSubmit()
  → draftSchema.safeParse (이미 canCreate로 판정)
  → createEntryMutation.mutateAsync({ pageId, entry, publishOption })
      → onMutate: [...entries, entry]     (optimistic)
      → mutationFn: POST /api/entries
      → onSuccess: triggerPreviewRefresh()
      → onSettled: invalidateQueries
  → setView({ kind: 'detail', entryId })
  → toast
```

### 10.2 Entry 수정 (Edit)

```
User opens entry detail
  → setView({ kind: 'detail', entryId })
  → EntryDetailView: useEntryDetail(id) → Suspense
  → entry → localEntry (useState)

User edits field (e.g. title)
  → Editor.onUpdate({ title: 'new' })
  → setLocalEntry({ ...localEntry, title: 'new' })
  → debouncedSave(updatedEntry, ['title'])
      → pendingFieldsRef: Set {'title'}
      → 800ms later:
          → updateMutation.mutateAsync({ entry, changedFields: ['title'] })
              → onMutate: entries.map(e => e.id === id ? entry : e)  (optimistic)
              → mutationFn: PATCH /api/entries/:id
              → onSuccess: hasPreviewField('event', ['title']) → true → refresh
              → onSettled: invalidateQueries
```

### 10.3 프로필 수정 (BioDesignPanel)

```
User types in bio field
  → queryClient.setQueryData(['user'], { ...prev, bio: value })  (즉시 캐시)
  → debouncedSave(500ms)
      → updateProfile.mutate({ userId, updates: { bio: value } })
          → onMutate: cancel + snapshot + optimistic
          → mutationFn: PATCH /api/users/:id
          → onSuccess: 서버 값으로 캐시 덮어쓰기
          → onError: 스냅샷 복구
```
