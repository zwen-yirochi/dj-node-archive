# Dashboard Architecture

> 설정 파일(config) 중심으로 본 대시보드 구조 맵.
> 각 설정이 **무엇을 결정**하고 **누가 소비**하는지에 초점.

---

## 설정 파일 총 목록

```
dashboard/constants/
  entryConfig.ts          ← 뱃지·라벨 표시 + EntryType 파생
  entryFieldConfig.ts     ← 필드 메타 + 스키마 레지스트리 + 완성도 헬퍼
  menuConfig.ts           ← 메뉴 액션 시스템
  editorRegistry.ts       ← 에디터 컴포넌트 매핑
  workflowOptions.ts      ← 생성/발행 워크플로우

lib/validations/
  entry.schemas.ts        ← Zod 스키마 정의 (API + RHF 공용)
```

---

## 1. entryConfig.ts — 뱃지·라벨 표시

타입별 UI 표시 메타데이터. `EntryType`은 이 맵의 키에서 파생.
실제 타입 정의(`EventEntry`, `MixsetEntry` 등)는 `types/domain.ts`에 있음.

```ts
ENTRY_TYPE_CONFIG: Record<EntryType, { badgeType; label; titlePlaceholder }>;
type EntryType = 'event' | 'mixset' | 'link'; // keyof typeof ENTRY_TYPE_CONFIG
```

| 소비자                        | 용도                           |
| ----------------------------- | ------------------------------ |
| `EntryDetailView`, `TreeItem` | `badgeType` → `TypeBadge` 렌더 |
| `CreateEntryPanel`            | `label`, `titlePlaceholder`    |
| 다른 config 파일들            | `EntryType` 타입 참조          |

---

## 2. entryFieldConfig.ts — 필드 메타 + 완성도 판단

각 엔트리 타입의 **필드가 무엇인지**, **프리뷰에 영향을 주는지**, **완성 조건은 무엇인지**를 한 곳에서 관리.

```ts
// 필드 메타데이터
FIELD_CONFIG: Record<EntryType, FieldConfig[]>
FieldConfig = { key: string; label: string; triggersPreview: boolean }

// 스키마 레지스트리 (entry.schemas.ts에서 import)
ENTRY_SCHEMAS: Record<EntryType, { create: ZodSchema; view: ZodSchema }>

// 엔트리 완성도 헬퍼
validateEntry(entry, tier)         → ValidationResult
canCreate(entry)                   → boolean (create tier)
canAddToView(entry)                → boolean (view tier)
getMissingFieldLabels(entry, tier) → string[]
getTreeItemStatus(isInView, isValid) → TreeItemStatus
```

**미리보기 트리거 맵:**

| 타입   | 트리거 O                                                     | 트리거 X               |
| ------ | ------------------------------------------------------------ | ---------------------- |
| event  | title, date, venue, posterUrl, lineup                        | description, links     |
| mixset | title, coverUrl, audioUrl, soundcloudUrl, releaseDate, genre | tracklist, description |
| link   | title, url, icon                                             | —                      |

**완성도 기준 (ENTRY_SCHEMAS):**

| 타입   | create (생성 최소 조건) | view (Page 추가 조건)                                   |
| ------ | ----------------------- | ------------------------------------------------------- |
| event  | title + posterUrl       | title + date + venue + lineup + posterUrl + description |
| mixset | title                   | title + coverUrl + (audioUrl \|\| soundcloudUrl)        |
| link   | title + url             | title + url (URL 형식)                                  |

| 소비자              | 용도                                                         |
| ------------------- | ------------------------------------------------------------ |
| `previewTrigger.ts` | `FIELD_CONFIG` → 변경 필드 중 triggersPreview 확인           |
| `TreeItem`          | `canAddToView`, `getTreeItemStatus`, `getMissingFieldLabels` |
| `TreeSidebar/index` | `canAddToView` (드래그 검증)                                 |
| `use-mutations.ts`  | `canAddToView` (삭제 시 프리뷰 트리거 판단)                  |

---

## 3. entry.schemas.ts — Zod 스키마 정의 (API 계층)

모든 Zod 스키마의 정의 위치. API 핸들러(서버 검증)와 dashboard(RHF + 완성도 판단) 양쪽에서 참조.

```ts
// Entry 스키마 (create/view 2단계)
draftEventSchema / publishEventSchema;
draftMixsetSchema / publishMixsetSchema;
draftLinkSchema / publishLinkSchema;

// API 요청 스키마
createEntryRequestSchema;
updateEntryRequestSchema;
reorderEntriesRequestSchema;
reorderDisplayEntriesRequestSchema;
```

| 소비자                | 용도                            |
| --------------------- | ------------------------------- |
| API 핸들러            | 요청 본문 검증                  |
| `entryFieldConfig.ts` | `ENTRY_SCHEMAS` 레지스트리 구성 |
| (Phase 2) 폼 컴포넌트 | `zodResolver(schema)`           |

---

## 4. menuConfig.ts — 메뉴 액션 시스템

선언적 메뉴 정의 → 런타임 resolve.

```ts
// 액션 타입 (discriminated union)
MenuAction = { type: 'set-editing-field'; field: 'title'|'image' }
           | { type: 'delete' }

// 타입별 메뉴 구성
EDITOR_MENU_CONFIG: Record<EntryType, EditorMenuItemConfig[]>
  event:  [제목 변경, 이미지 변경, ─, 삭제]
  mixset: [제목 변경, 이미지 변경, ─, 삭제]
  link:   [제목 변경, ─, 삭제]

// 런타임 바인딩
resolveMenuItems(items, ctx: MenuActionContext) → DropdownMenuItemConfig[]
```

| 소비자            | 용도                     |
| ----------------- | ------------------------ |
| `EntryDetailView` | "..." 드롭다운 메뉴 구성 |

---

## 5. editorRegistry.ts — 에디터 컴포넌트 레지스트리

`entry.type` → React 컴포넌트 매핑.

```ts
EntryEditorProps = { entry, onUpdate, editingField, onEditingDone }

EDITOR_REGISTRY: Record<EntryType, ComponentType<EntryEditorProps>>
  event  → EventEditor
  mixset → MixsetEditor
  link   → LinkEditor
```

| 소비자            | 용도                                         |
| ----------------- | -------------------------------------------- |
| `EntryDetailView` | `EDITOR_REGISTRY[type]`으로 동적 에디터 렌더 |
| 각 Editor         | `EntryEditorProps` 인터페이스 구현           |

---

## 6. workflowOptions.ts — 생성/발행 옵션

```ts
EventCreateOption = 'import' | 'create';
PublishOption = 'publish' | 'private';
```

| 소비자             | 용도                      |
| ------------------ | ------------------------- |
| `CreateEventForm`  | 이벤트 생성 방식 선택     |
| `CreateEntryPanel` | 발행 옵션 토글            |
| `use-mutations.ts` | `PublishOption` 타입 참조 |

---

## 설정 → 소비자 의존성 그래프

```
types/domain.ts (타입 정의: EventEntry, MixsetEntry, LinkEntry, ContentEntry)
  │
  └─► entryConfig.ts (뱃지·라벨 + EntryType 파생)
        │
        ├─► entryFieldConfig.ts ─┬─► previewTrigger.ts ──► use-mutations.ts
        │    (필드 + 완성도)      │
        │                        ├─► TreeItem, TreeSidebar/index
        │                        │
        │                        └─► entry.schemas.ts (Zod 스키마, API 공유)
        │
        ├─► menuConfig.ts ──────────► EntryDetailView
        │
        ├─► editorRegistry.ts ─────► EntryDetailView
        │
        └─► workflowOptions.ts ───► CreateEventForm, CreateEntryPanel
```

---

## 핵심 데이터 흐름

### 미리보기 새로고침

```
필드 변경 → use-mutations update
  → shouldTriggerPreview(prev, next)         ← entryFieldConfig (FIELD_CONFIG)
    → 변경된 필드 중 triggersPreview:true 존재?
      → Yes → onPreviewTrigger()
               → dashboardStore.triggerPreviewRefresh()
                 → previewVersion++ → PreviewPanel 재렌더
```

### 완성도 검증

```
엔트리 → entryFieldConfig.ts
  → ENTRY_SCHEMAS[type][tier].safeParse(entry)
    → ValidationResult { isValid, errors, missingFields }

사용 지점:
  TreeItem:        isValid → 경고 아이콘 표시
  TreeSidebar:     canAddToView → DnD 드롭 허용 여부
  use-mutations:   canAddToView → 삭제 시 프리뷰 트리거 판단
```

### 에디터 렌더링

```
EntryDetailView
  ├─ EDITOR_REGISTRY[type]     → 에디터 컴포넌트 선택
  ├─ EDITOR_MENU_CONFIG[type]  → 메뉴 아이템 목록
  │   └─ resolveMenuItems(items, ctx) → 클릭 핸들러 바인딩
  └─ ENTRY_TYPE_CONFIG[type]   → TypeBadge 렌더
```

---

## 상태 관리

### useDashboardStore (Zustand)

대시보드 전체 UI 상태를 `ContentView` discriminated union으로 관리.

```ts
type ContentView =
  | { kind: 'bio' }
  | { kind: 'page' }
  | { kind: 'page-detail'; entryId: string }
  | { kind: 'create'; entryType: EntryType }
  | { kind: 'detail'; entryId: string }

// State
contentView: ContentView          // default: { kind: 'page' }
sidebarSections: SidebarSections  // 각 섹션 collapsed 여부
previewVersion: number            // triggerPreviewRefresh()로 증가

// Actions
setView(view)           selectEntry(id)         openCreatePanel(type)
closeCreatePanel()      triggerPreviewRefresh()  toggleSection(section)
```

### TanStack Query (서버 상태)

```ts
// use-editor-data.ts
entryKeys.all  = ['entries']           → useEditorData()    (useSuspenseQuery)
entryKeys.detail(id) = ['entries', id] → useEntryDetail(id) (리스트 캐시에서 초기값)

// use-mutations.ts — 8개 mutation
create / update / remove
addToDisplay / removeFromDisplay / toggleVisibility
reorder / reorderDisplay
```

**Mutation 흐름:**

```
Component → useMutation(makeOptimisticMutation(config))
  onMutate:   cancelQueries → snapshot → optimisticUpdate
  mutationFn: fetch API
  onSuccess:  triggersPreview? → triggerPreviewRefresh()
  onError:    rollback to snapshot
  onSettled:  invalidateQueries → refetch
```

---

## 파일 구조 요약

```
src/app/dashboard/
├── page.tsx                          ← SSR: EditorData fetch
├── layout.tsx                        ← QueryProvider + ErrorBoundary + Suspense
│
├── constants/
│   ├── entryConfig.ts                ← 뱃지·라벨 + EntryType 파생
│   ├── entryFieldConfig.ts           ← 필드 메타 + 스키마 레지스트리 + 완성도 헬퍼
│   ├── menuConfig.ts                 ← 메뉴 액션 시스템
│   ├── editorRegistry.ts             ← 에디터 컴포넌트 매핑
│   └── workflowOptions.ts           ← 생성/발행 옵션
│
├── hooks/
│   ├── index.ts                      ← barrel export
│   ├── use-editor-data.ts            ← useSuspenseQuery (entries)
│   ├── use-mutations.ts              ← 8개 mutation composite 훅
│   ├── optimistic-mutation.ts        ← mutation 팩토리
│   ├── entries.api.ts                ← 순수 fetch 함수
│   └── use-array-field.ts            ← 배열 필드 CRUD 유틸
│
├── components/
│   ├── StoreInitializer.tsx          ← SSR data → cache + store init
│   ├── ErrorBoundary.tsx
│   ├── Skeleton.tsx
│   ├── PreviewPanel.tsx
│   │
│   ├── TreeSidebar/
│   │   ├── index.tsx                 ← DnD + 섹션 네비 + 엔트리 목록
│   │   ├── TreeItem.tsx              ← 정렬 가능 엔트리 행 + 상태 아이콘
│   │   ├── ViewSection.tsx
│   │   ├── SectionItem.tsx
│   │   └── AccountSection.tsx
│   │
│   └── ContentPanel/
│       ├── index.tsx                 ← contentView.kind 기반 라우팅
│       ├── EntryDetailView.tsx       ← 에디터 셸 (debounced save)
│       ├── PageListView.tsx
│       ├── CreateEntryPanel.tsx
│       ├── CreateEventForm.tsx
│       ├── BioDesignPanel.tsx
│       └── editors/
│           ├── EventEditor.tsx
│           ├── MixsetEditor.tsx
│           ├── LinkEditor.tsx
│           └── ImageEditor.tsx

src/lib/
├── previewTrigger.ts                 ← shouldTriggerPreview (entryFieldConfig 소비)
└── validations/
    └── entry.schemas.ts              ← 모든 Zod 스키마 (API + RHF 공용)

src/stores/
├── dashboardStore.ts                 ← ContentView + sidebar + previewVersion
└── userStore.ts                      ← user 정보
```

---

## 파일별 책임 요약

| 파일                  | 단일 책임                                  |
| --------------------- | ------------------------------------------ |
| `entryConfig.ts`      | 뱃지·라벨 표시 메타                        |
| `entryFieldConfig.ts` | 필드가 무엇이고, 어떤 완성 조건을 가지는가 |
| `menuConfig.ts`       | 에디터 드롭다운에 무엇이 나오는가          |
| `editorRegistry.ts`   | 어떤 컴포넌트로 편집하는가                 |
| `workflowOptions.ts`  | 생성/발행 워크플로우 옵션                  |
| `entry.schemas.ts`    | Zod 스키마 정의 (API + 클라이언트 공용)    |
| `dashboardStore.ts`   | UI 라우팅 + 사이드바 + 프리뷰 버전         |
| `use-editor-data.ts`  | 서버 데이터 캐시 (entries)                 |
| `use-mutations.ts`    | 8개 mutation + optimistic update           |
| `previewTrigger.ts`   | 어떤 필드 변경이 프리뷰를 새로고침하는가   |
