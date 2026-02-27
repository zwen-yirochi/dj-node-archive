# Dashboard Architecture

> Config 중심으로 본 대시보드 구조. 각 설정이 **무엇을 결정**하고 **누가 소비**하는지에 초점.

## Config 파일 목록

| 파일                  | 위치                | 단일 책임                                   |
| --------------------- | ------------------- | ------------------------------------------- |
| `entryConfig.ts`      | `dashboard/config/` | 뱃지·라벨 표시 + `EntryType` 파생           |
| `entryFieldConfig.ts` | `dashboard/config/` | 필드 메타 + 스키마 레지스트리 + 완성도 헬퍼 |
| `menuConfig.ts`       | `dashboard/config/` | 선언적 메뉴 액션 + 런타임 resolve           |
| `workflowOptions.ts`  | `dashboard/config/` | 생성/발행 워크플로우 옵션                   |
| `entry.schemas.ts`    | `lib/validations/`  | Zod 스키마 (API 검증 + 완성도 판단 공용)    |

---

## 의존성 그래프

```
types/domain.ts ─── EventEntry, MixsetEntry, LinkEntry, ContentEntry
    │
    ▼
entry.schemas.ts ─── Zod 스키마 정의 (draft/publish × 3타입 + API 요청)
    │                    │
    │                    ├──► API 핸들러 (서버 검증)
    │                    ├──► CreateEventForm (RHF zodResolver)
    │                    ▼
    │               entryFieldConfig.ts ─── ENTRY_SCHEMAS 레지스트리 + 완성도 헬퍼
    │                    │
    │                    ├──► previewTrigger.ts (FIELD_CONFIG → triggersPreview 확인)
    │                    ├──► TreeItem (canAddToView, getTreeItemStatus)
    │                    ├──► TreeSidebar/index (canAddToView → DnD 드롭 검증)
    │                    └──► use-mutations.ts (canAddToView → 삭제 시 프리뷰 판단)
    │
entryConfig.ts ─── ENTRY_TYPE_CONFIG + EntryType
    │
    ├──► EntryDetailView, TreeItem, PageListView (badgeType → TypeBadge)
    ├──► CreateEntryPanel (label, titlePlaceholder)
    ├──► dashboardStore.ts (EntryType → ContentView 타입)
    ├──► previewTrigger.ts (EntryType 타입 참조)
    └──► 다른 config 파일들 (EntryType 타입 참조)

menuConfig.ts ───► EntryDetailView ("..." 드롭다운 메뉴)

workflowOptions.ts ───► CreateEventForm, CreateEntryPanel (옵션 UI)
                   ───► use-mutations.ts (PublishOption 타입)
```

---

## Config 상세

### 1. entryConfig.ts

```ts
ENTRY_TYPE_CONFIG: Record<EntryType, { badgeType; label; titlePlaceholder }>;
type EntryType = keyof typeof ENTRY_TYPE_CONFIG; // 'event' | 'mixset' | 'link'
```

`EntryType`의 유일한 정의 위치. 타입 정의(`EventEntry` 등)는 `types/domain.ts`에 별도 존재.

### 2. entryFieldConfig.ts

3가지 관심사를 하나의 파일에서 관리:

**필드 메타데이터** — 각 필드의 이름, 라벨, 프리뷰 트리거 여부:

| 타입   | triggersPreview: true                                        | triggersPreview: false |
| ------ | ------------------------------------------------------------ | ---------------------- |
| event  | title, date, venue, posterUrl, lineup                        | description, links     |
| mixset | title, coverUrl, audioUrl, soundcloudUrl, releaseDate, genre | tracklist, description |
| link   | title, url, icon                                             | —                      |

**스키마 레지스트리** — `entry.schemas.ts`의 Zod 스키마를 2-tier로 매핑:

| 타입   | create (생성 최소) | view (Page 추가)                                        |
| ------ | ------------------ | ------------------------------------------------------- |
| event  | title + posterUrl  | title + date + venue + lineup + posterUrl + description |
| mixset | title              | title + coverUrl + (audioUrl \|\| soundcloudUrl)        |
| link   | title + url        | title + url(URL 형식)                                   |

**완성도 헬퍼** — Zod safeParse 기반 파생 함수:

```ts
validateEntry(entry, tier) → ValidationResult
canCreate(entry)           → boolean   // create tier
canAddToView(entry)        → boolean   // view tier
getMissingFieldLabels(entry, tier) → string[]
getTreeItemStatus(isInView, isValid) → TreeItemStatus
```

### 3. entry.schemas.ts

Zod 스키마의 단일 정의 위치. 두 종류:

- **Entry 스키마**: draft/publish × 3타입 — dashboard 완성도 판단 + RHF resolver
- **API 요청 스키마**: createEntry, updateEntry, reorder, reorderDisplay — API 핸들러 전용

### 4. menuConfig.ts

```ts
MenuAction = { type: 'set-editing-field'; field: 'title'|'image' } | { type: 'delete' }
EDITOR_MENU_CONFIG: Record<EntryType, EditorMenuItemConfig[]>
resolveMenuItems(items, ctx) → DropdownMenuItemConfig[]
```

선언적 메뉴 정의를 런타임에 클릭 핸들러로 바인딩.

### 5. workflowOptions.ts

```ts
EventCreateOption = 'import' | 'create';
PublishOption = 'publish' | 'private';
```

---

## 핵심 데이터 흐름

### 미리보기 새로고침

```
필드 변경 → use-mutations.update
  → shouldTriggerPreview(prev, next)    ← FIELD_CONFIG[type].triggersPreview
    → Yes → onPreviewTrigger()
             → dashboardStore.triggerPreviewRefresh()
               → previewVersion++ → PreviewPanel 재렌더
```

### 완성도 검증

```
entry → ENTRY_SCHEMAS[type][tier].safeParse(entry)
  → ValidationResult { isValid, errors, missingFields }

사용:
  TreeItem      → getTreeItemStatus → 경고 아이콘
  TreeSidebar   → canAddToView → DnD 드롭 허용
  use-mutations → canAddToView → 삭제 시 프리뷰 트리거
```

### 에디터 렌더링

```
EntryDetailView
  ├─ EDITOR_REGISTRY[type]    → 에디터 컴포넌트 선택 (인라인 매핑)
  ├─ EDITOR_MENU_CONFIG[type] → resolveMenuItems → 메뉴 바인딩
  └─ ENTRY_TYPE_CONFIG[type]  → TypeBadge 렌더
```

---

## 상태 관리

### useDashboardStore (Zustand) — UI 상태

```ts
ContentView =
  | { kind: 'bio' }
  | { kind: 'page' }
  | { kind: 'page-detail'; entryId: string }
  | { kind: 'create'; entryType: EntryType }
  | { kind: 'detail'; entryId: string }

State: contentView, sidebarSections, previewVersion
Actions: setView, triggerPreviewRefresh, toggleSection, reset
Selectors: selectContentView, selectSetView, selectSidebarSections, selectToggleSection, selectPreviewVersion
```

### TanStack Query — 서버 상태

```ts
entryKeys.all = ['entries']     → useEditorData() (useSuspenseQuery)
entryKeys.detail(id)            → useEntryDetail(id) (캐시 초기값)

// use-mutations.ts — 8개 mutation (makeOptimisticMutation 팩토리)
create, update, remove, addToDisplay, removeFromDisplay, toggleVisibility, reorder, reorderDisplay
```

**Mutation 흐름:**

```
onMutate: cancelQueries → snapshot → optimisticUpdate
mutationFn: fetch API
onSuccess: triggersPreview? → triggerPreviewRefresh()
onError: rollback
onSettled: invalidateQueries
```

---

## 파일 구조

```
src/app/dashboard/
├── page.tsx                     SSR: EditorData fetch
├── layout.tsx                   QueryProvider + ErrorBoundary + Suspense
│
├── config/
│   ├── entryConfig.ts           뱃지·라벨 + EntryType
│   ├── entryFieldConfig.ts      필드 메타 + 스키마 레지스트리 + 완성도 헬퍼
│   ├── menuConfig.ts            메뉴 액션 시스템
│   └── workflowOptions.ts      생성/발행 옵션
│
├── stores/
│   └── dashboardStore.ts        ContentView + sidebar + previewVersion
│
├── lib/
│   └── previewTrigger.ts        shouldTriggerPreview
│
├── hooks/
│   ├── index.ts                 barrel export
│   ├── use-editor-data.ts       entryKeys + useEditorData + useEntryDetail
│   ├── use-mutations.ts         8개 entry mutation
│   ├── use-user.ts              useUser + useUserMutations
│   ├── optimistic-mutation.ts   mutation 팩토리
│   ├── entries.api.ts           순수 fetch (mutation용)
│   ├── use-array-field.ts       배열 CRUD + stable key
│   └── use-create-event-form.ts RHF + 이벤트 폼 로직
│
├── actions/
│   └── upload.ts                포스터 업로드 Server Action
│
├── components/
│   ├── StoreInitializer.tsx     SSR data → TQ 캐시 + 스토어 초기화
│   ├── ErrorBoundary.tsx        QueryErrorResetBoundary 포함
│   ├── Skeleton.tsx
│   ├── PreviewPanel.tsx
│   │
│   ├── TreeSidebar/
│   │   ├── index.tsx            DnD + 섹션 네비
│   │   ├── TreeItem.tsx         엔트리 행 + 완성도 아이콘
│   │   ├── ViewSection.tsx
│   │   ├── SectionItem.tsx
│   │   └── AccountSection.tsx
│   │
│   └── ContentPanel/
│       ├── index.tsx            contentView.kind 기반 라우팅
│       ├── EntryDetailView.tsx  에디터 셸 (debounced save + 메뉴)
│       ├── PageListView.tsx
│       ├── CreateEntryPanel.tsx
│       ├── CreateEventForm.tsx  RHF + dynamic zodResolver
│       ├── BioDesignPanel.tsx
│       ├── AvatarUpload.tsx     아바타 업로드/삭제
│       ├── HeaderStyleSection.tsx 헤더 스타일 설정
│       ├── EventImportSearch.tsx 이벤트 임포트
│       └── editors/
│           ├── types.ts         EntryEditorProps 인터페이스
│           ├── EventEditor.tsx
│           ├── MixsetEditor.tsx
│           ├── LinkEditor.tsx
│           └── ImageEditor.tsx

src/lib/validations/
└── entry.schemas.ts             Zod 스키마 (API + 클라이언트 공용)
```
