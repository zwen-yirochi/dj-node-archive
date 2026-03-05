# 아키텍처 다이어그램

> 프로젝트의 데이터 흐름, 상태 관리, 뮤테이션 라이프사이클, 전 계층 관통 흐름, 컴포넌트 트리를 시각화한 학습 문서.

---

## 목차

- [A. 데이터 흐름 (SSR → Client → Mutation → Server)](#a-데이터-흐름)
- [B. 상태 관리 경계](#b-상태-관리-경계)
- [C. Optimistic Mutation 라이프사이클](#c-optimistic-mutation-라이프사이클)
- [D. Entry 생성 전 계층 관통 흐름](#d-entry-생성-전-계층-관통-흐름)
- [E. 컴포넌트 트리 + 데이터 소스 맵](#e-컴포넌트-트리--데이터-소스-맵)

---

## A. 데이터 흐름

SSR에서 시작해 클라이언트 캐시로, 뮤테이션을 거쳐 서버로 돌아가는 전체 흐름.

```
┌─────────────────────────── 서버 ────────────────────────────┐
│                                                              │
│  page.tsx (Server Component)                                 │
│  ┌──────────────────────────────────────────────────┐        │
│  │ const data = await getEditorDataByAuthUserId()   │        │
│  │ // → { user, contentEntries, pageId }            │        │
│  └──────────────────────┬───────────────────────────┘        │
│                         │ props                              │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────┐        │
│  │ <StoreInitializer initialData={data} />          │        │
│  └──────────────────────┬───────────────────────────┘        │
│                         │                                    │
└─────────────────────────│────────────────────────────────────┘
                          │
┌─────────────────────────│──── 클라이언트 (Hydration) ───────────┐
│                         ▼                                       │
│  StoreInitializer가 데이터를 3개 도메인으로 분배:                │
│                                                                 │
│  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ useEntries()    │  │ useUserQuery() │  │ Zustand          │  │
│  │ ┌─────────────┐ │  │ ┌────────────┐ │  │ ┌──────────────┐ │  │
│  │ │ ['entries'] │ │  │ │ ['user']   │ │  │ │ pageId       │ │  │
│  │ │ Entry[]     │ │  │ │ User       │ │  │ │ string       │ │  │
│  │ └──────┬──────┘ │  │ └─────┬──────┘ │  │ └──────────────┘ │  │
│  └────────│────────┘  └───────│────────┘  └──────────────────┘  │
│           │                   │                                  │
│           ▼                   ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    컴포넌트 구독                            │  │
│  │                                                            │  │
│  │  TreeSidebar ─── useEntries() + useUser()                  │  │
│  │  ContentPanel ── useEntries() (PageListView)               │  │
│  │  EntryDetail ─── useEntryDetail(id)  ←── ['entries']에서   │  │
│  │                                          initialData 파생  │  │
│  │  BioDesignPanel ─ useUser()                                │  │
│  │  PreviewPanel ─── useUser()                                │  │
│  │  CreatePanel ──── selectPageId (Zustand)                   │  │
│  └──────────┬─────────────────────────────────────────────────┘  │
│             │ mutation                                            │
│             ▼                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  useEntryMutations() / useUserMutations()                  │  │
│  │                                                            │  │
│  │  onMutate: 캐시 낙관적 업데이트                             │  │
│  │  mutationFn: ─────── fetch('/api/...') ──────────────────────────▶ Server
│  │  onSuccess: 프리뷰 새로고침 판단                            │  │
│  │  onError: 캐시 롤백                                         │  │
│  │  onSettled: invalidateQueries (서버 재동기화)               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 캐시 키별 데이터 흐름

```
['entries']  ──read──▶  TreeSidebar, PageListView
    │
    ├───derive──▶  ['entries', id]  ──read──▶  EntryDetailView
    │                (initialData에서 find)
    │
    ├──mutate──▶  useEntryMutations (8개)
    │              ├─ create, update, remove
    │              ├─ addToDisplay, removeFromDisplay, toggleVisibility
    │              └─ reorder, reorderDisplay
    │
    └──invalidate──▶  onSettled에서 서버 최신 데이터 refetch


['user']  ──read──▶  useUser() → TreeSidebar, BioDesignPanel, PreviewPanel, AccountSection
    │
    └──mutate──▶  useUserMutations (3개)
                   ├─ updateProfile
                   ├─ uploadAvatar
                   └─ deleteAvatar
```

---

## B. 상태 관리 경계

어떤 데이터가 어디에 사는지, 왜 그곳에 사는지.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  TanStack Query (서버 상태)                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━                                         │
│  "서버에 원본이 있고, 클라이언트는 캐시를 들고 있는 데이터"          │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │ ['entries']      │    │ ['user']         │                       │
│  │ ContentEntry[]   │    │ User             │                       │
│  │                  │    │                  │                       │
│  │ staleTime: 1분   │    │ staleTime: 5분   │                       │
│  │ 8개 mutation     │    │ 3개 mutation      │                       │
│  │ optimistic update│    │ optimistic update │                       │
│  └──────────────────┘    └──────────────────┘                       │
│                                                                     │
│  ┌──────────────────┐                                               │
│  │ ['entries', id]  │  ← ['entries']에서 파생 (initialData)         │
│  │ ContentEntry     │                                               │
│  │ staleTime: 1분   │                                               │
│  └──────────────────┘                                               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Zustand (UI 상태)                                                  │
│  ━━━━━━━━━━━━━━━━━                                                  │
│  "서버에 없고, 클라이언트에서만 의미 있는 데이터"                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────┐               │
│  │ dashboardStore                                    │               │
│  │                                                   │               │
│  │ contentView ─── 현재 보고 있는 화면                │               │
│  │   bio | page | page-detail | detail | create      │               │
│  │                                                   │               │
│  │ sidebarSections ── 섹션 접힘/펼침 상태            │               │
│  │   { page: { collapsed }, events: {...}, ... }     │               │
│  │                                                   │               │
│  │ pageId ─── 세션 내 불변 (SSR에서 1회 설정)         │               │
│  └──────────────────────────────────────────────────┘               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  useState (컴포넌트 로컬 상태)                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                      │
│  "해당 컴포넌트가 마운트된 동안만 의미 있는 데이터"                  │
│                                                                     │
│  TreeSidebar ── activeItem, isDraggingOverView (드래그 중 시각 피드백)│
│  EntryDetail ── localEntry (편집 중 로컬 복사본)                     │
│                  editingField ('title' | 'image' | null)             │
│                  isSaving, lastSaved (디바운스 저장 상태)             │
│  AccountSection ── isEditDialogOpen, tempUser (다이얼로그 임시 상태)  │
│  PreviewPanel ── isVisible, isLoading (iframe 지연 로딩)             │
│  PageListView ── activeId (드래그 중 활성 항목)                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Ref (렌더링과 무관한 값)                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━                                            │
│  "변경되어도 리렌더가 필요 없는 데이터"                               │
│                                                                     │
│  snapshotRef ── mutation 직전 entries 스냅샷 (optimistic rollback)    │
│  publishOptionRef ── zodResolver 클로저에서 최신 값 참조             │
│  previewRefreshRef ── iframe reload 콜백 (이벤트 전달)               │
│  timeoutRef ── 디바운스 타이머 ID                                    │
│  pendingFieldsRef ── 디바운스 중 누적된 변경 필드 Set                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 판단 기준: 데이터를 어디에 둘 것인가?

```
이 데이터가 서버에 원본이 있는가?
  ├─ Yes → TanStack Query
  │         (entries, user)
  │
  └─ No → 여러 컴포넌트가 공유하는가?
           ├─ Yes → Zustand
           │         (contentView, sidebarSections, pageId)
           │
           └─ No → 변경 시 리렌더가 필요한가?
                    ├─ Yes → useState
                    │         (localEntry, activeItem, isLoading)
                    │
                    └─ No → useRef
                              (snapshotRef, timeoutRef, previewRefreshRef)
```

---

## C. Optimistic Mutation 라이프사이클

entry 하나를 수정(`update`)할 때 캐시와 서버에서 무슨 일이 일어나는지.

```
시간 ──────────────────────────────────────────────────────────────▶

사용자 편집                                          서버 응답
    │                                                    │
    ▼                                                    ▼
┌──────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│mutate│→ │ onMutate │→ │mutationFn│→ │onSuccess │→ │onSettled │
│      │  │          │  │          │  │          │  │          │
└──────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘

──── 각 단계 상세 ────────────────────────────────────────────────

1. mutate({ entry: updatedEntry, changedFields: ['title'] })

2. onMutate
   ┌─────────────────────────────────────────────────────────┐
   │ ① cancelQueries(['entries'])  ← 진행 중인 refetch 중단  │
   │                                                         │
   │ ② previous = getQueryData(['entries'])                   │
   │   snapshotRef.current = previous   ← 롤백용 원본 저장   │
   │                                                         │
   │ ③ setQueryData(['entries'],                              │
   │     entries.map(e => e.id === entry.id ? entry : e))     │
   │                          ↑ 캐시 즉시 변경 (UI 반영)     │
   │                                                         │
   │ ④ return { previous }   ← context로 전달 (onError용)    │
   └─────────────────────────────────────────────────────────┘

   캐시 상태: [A, B, C] → [A, B', C]  (B를 B'로 낙관적 교체)
   UI 상태: 즉시 변경된 B' 표시

3. mutationFn
   ┌─────────────────────────────────────────────────────────┐
   │ fetch('/api/entries/B', { method: 'PATCH', body: B' })  │
   │                                                         │
   │ snapshotRef.current = [A, B, C]  ← 원본 참조 가능      │
   └─────────────────────────────────────────────────────────┘

   서버로 요청 전송 (비동기, 응답 대기)

4-a. onSuccess (성공 시)
   ┌─────────────────────────────────────────────────────────┐
   │ triggersPreview 판단:                                   │
   │                                                         │
   │ changedFields = ['title']                               │
   │ FIELD_CONFIG.event에서 title.triggersPreview = true      │
   │ → hasPreviewField() = true                              │
   │ → triggerPreviewRefresh()                               │
   │ → PreviewPanel iframe reload                            │
   └─────────────────────────────────────────────────────────┘

4-b. onError (실패 시)
   ┌─────────────────────────────────────────────────────────┐
   │ setQueryData(['entries'], ctx.previous)                  │
   │            ↑ 스냅샷으로 롤백                             │
   └─────────────────────────────────────────────────────────┘

   캐시 상태: [A, B', C] → [A, B, C]  (원래대로 복원)

5. onSettled (성공/실패 무관, 항상 실행)
   ┌─────────────────────────────────────────────────────────┐
   │ snapshotRef.current = undefined   ← 스냅샷 정리        │
   │ invalidateQueries(['entries'])    ← 서버 최신 데이터    │
   │                                     refetch 트리거      │
   └─────────────────────────────────────────────────────────┘

   invalidate → ['entries'] stale 마킹 → 자동 refetch
   → 서버에서 최신 [A, B'', C] 수신 (서버가 추가 변환했을 수 있음)
```

### Preview Trigger 판단 흐름

```
mutation 호출
    │
    ├─ triggersPreview: true  ────────────────────────▶ 항상 refresh
    │   (create, addToDisplay, removeFromDisplay,
    │    toggleVisibility, reorderDisplay)
    │
    ├─ triggersPreview: function ──▶ 조건부 판단
    │   │
    │   ├─ update mutation:
    │   │   hasPreviewField(entry.type, changedFields)
    │   │     │
    │   │     ├─ changedFields에 title 포함 → FIELD_CONFIG에서
    │   │     │   title.triggersPreview = true → refresh ✓
    │   │     │
    │   │     └─ changedFields에 description만 → FIELD_CONFIG에서
    │   │         description.triggersPreview = false → skip ✗
    │   │
    │   └─ remove mutation:
    │       wasVisibleEntry(snapshot, id)
    │         │
    │         ├─ 삭제 대상이 Page에 표시 중 → refresh ✓
    │         └─ 삭제 대상이 Page에 미표시 → skip ✗
    │
    └─ triggersPreview: undefined  ───────────────────▶ skip
        (reorder — 사이드바 순서만 변경)
```

---

## D. Entry 생성 전 계층 관통 흐름

"Event 생성" 버튼 클릭부터 DB 저장까지 4-layer를 관통하는 전체 흐름.

```
┌─────────────────────── Client Layer ──────────────────────────┐
│                                                                │
│  1. 사용자: "Events" 섹션의 + 버튼 클릭                       │
│     └─ SectionItem → setView({ kind: 'create', entryType: 'event' })
│                                                                │
│  2. ContentPanel이 view.kind === 'create' 감지                 │
│     └─ <CreateEntryPanel type="event" /> 렌더링                │
│        └─ CreateEventForm 렌더링                               │
│                                                                │
│  3. CreateEventForm                                            │
│     ┌────────────────────────────────────────────────────┐     │
│     │ useCreateEntryForm(EVENT_FORM_CONFIG)               │     │
│     │                                                     │     │
│     │ Config:                                             │     │
│     │   type: 'event'                                     │     │
│     │   publishable: true                                 │     │
│     │   defaultValues: { title:'', posterUrl:'', ... }    │     │
│     │                                                     │     │
│     │ 파생:                                               │     │
│     │   ENTRY_SCHEMAS['event'] → draftSchema, publishSchema│    │
│     │   ENTRY_TYPE_CONFIG['event'] → { label: 'Event' }  │     │
│     │                                                     │     │
│     │ useForm<CreateEventData>({                          │     │
│     │   resolver: 동적 zodResolver,                       │     │
│     │   mode: 'onTouched',                                │     │
│     │ })                                                  │     │
│     └────────────────────────────────────────────────────┘     │
│                                                                │
│  4. 사용자: 폼 작성 + "Create Event" 클릭                     │
│     ┌────────────────────────────────────────────────────┐     │
│     │ handleSubmit → RHF 검증                             │     │
│     │   └─ zodResolver(publishSchema or draftSchema)      │     │
│     │      └─ schema.safeParse(formValues)                │     │
│     │         ├─ 실패 → FormMessage에 에러 표시 (중단)    │     │
│     │         └─ 성공 → onSubmit(formData) 실행           │     │
│     │                                                     │     │
│     │ onSubmit:                                           │     │
│     │   a. clearErrors('root')                            │     │
│     │   b. pageId 확인 (Zustand)                          │     │
│     │   c. newEntry = toEntry(formData)                   │     │
│     │      └─ createEmptyEntry('event') + formData 병합   │     │
│     │   d. createEntryMutation.mutateAsync({              │     │
│     │        pageId, entry: newEntry, publishOption       │     │
│     │      })                                             │     │
│     └──────────────┬─────────────────────────────────────┘     │
│                    │                                           │
│  5. TanStack Query Mutation                                   │
│     ┌──────────────┴─────────────────────────────────────┐     │
│     │ onMutate:                                           │     │
│     │   cancelQueries → snapshot → optimisticUpdate       │     │
│     │   캐시: [...entries, newEntry]                       │     │
│     │                                                     │     │
│     │ mutationFn:                                         │     │
│     │   fetch('/api/entries', {                           │     │
│     │     method: 'POST',                                 │     │
│     │     body: { pageId, entry, publishOption }          │     │
│     │   })                                                │     │
│     └──────────────┬─────────────────────────────────────┘     │
│                    │                                           │
└────────────────────│───────────────────────────────────────────┘
                     │
┌────────────────────│───── Route Layer ─────────────────────────┐
│                    ▼                                           │
│  app/api/entries/route.ts                                     │
│  ┌─────────────────────────────────────────────────────┐      │
│  │ export const POST = withAuth(async (request, ctx) =>│      │
│  │   handleCreateEntry(request, ctx)                   │      │
│  │ );                                                  │      │
│  └──────────────┬──────────────────────────────────────┘      │
│                 │                                              │
└─────────────────│──────────────────────────────────────────────┘
                  │
┌─────────────────│───── Handler Layer ──────────────────────────┐
│                 ▼                                              │
│  handleCreateEntry(request, { user })                         │
│  ┌─────────────────────────────────────────────────────┐      │
│  │ 1. Parse:  body = await request.json()              │      │
│  │                                                     │      │
│  │ 2. Validate: createEntryRequestSchema.safeParse(body)│     │
│  │    ├─ 실패 → zodValidationErrorResponse (400)       │      │
│  │    └─ 성공 → { pageId, entry, publishOption }       │      │
│  │                                                     │      │
│  │ 3. Verify: verifyPageOwnership(pageId, user.id)     │      │
│  │    └─ 실패 → forbiddenResponse (403)                │      │
│  │                                                     │      │
│  │ 4. Logic: getMaxPosition(pageId) → newPosition      │      │
│  │                                                     │      │
│  │ 5. (publish + event 인 경우)                        │      │
│  │    publishEventSchema.safeParse(entry) → 2차 검증   │      │
│  │    createEvent() → events 테이블 저장                │      │
│  │    referenceId = eventResult.data.id                 │      │
│  │                                                     │      │
│  │ 6. Transform: mapEntryToDatabase(entry, newPosition) │     │
│  │                                                     │      │
│  │ 7. Database: createEntry(id, dbEntry)               │      │
│  │    └─ 실패 → internalErrorResponse (500)            │      │
│  │                                                     │      │
│  │ 8. Response: successResponse(result, 201)           │      │
│  └──────────────┬──────────────────────────────────────┘      │
│                 │                                              │
└─────────────────│──────────────────────────────────────────────┘
                  │
┌─────────────────│───── Database Layer ─────────────────────────┐
│                 ▼                                              │
│  createEntry(id, data): Promise<Result<Entry>>                │
│  ┌─────────────────────────────────────────────────────┐      │
│  │ const supabase = await createClient();              │      │
│  │ const { data, error } = await supabase              │      │
│  │   .from('entries')                                  │      │
│  │   .insert({ id, page_id, type, position, data })    │      │
│  │   .select()                                         │      │
│  │   .single();                                        │      │
│  │                                                     │      │
│  │ return error                                        │      │
│  │   ? { ok: false, error: { code: 'DATABASE_ERROR' } }│      │
│  │   : { ok: true, data };                             │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Zod 검증이 일어나는 3곳

```
클라이언트                        서버
──────────                        ──────

① zodResolver(schema)        ③ publishEventSchema.safeParse(entry)
   useForm resolver              handler 내 2차 검증
   (blur/submit 시)              (publish + event일 때만)

② draftSchema.safeParse(values)
   canCreate 실시간 판정
   (watch()로 매 입력마다)

                              ④ createEntryRequestSchema.safeParse(body)
                                 handler 내 1차 구조 검증
                                 (모든 요청)
```

---

## E. 컴포넌트 트리 + 데이터 소스 맵

### 전체 트리

```
layout.tsx (Server)
├─ QueryProvider ─────────────────────── TanStack Query 컨텍스트
│  └─ Background
│     └─ ErrorBoundaryWithQueryReset ─── 최상위 에러 경계
│        └─ Suspense (Skeleton) ──────── SSR 로딩 경계
│           └─ page.tsx (Server)
│              ├─ StoreInitializer ───── Hydration 분배기
│              │
│              └─ main (flex h-screen p-6 gap-4)
│                 │
│                 ├─ [1] TreeSidebar ─────── 좌측 사이드바 (w-64)
│                 ├─ [2] ContentPanel ────── 메인 콘텐츠 (flex-1)
│                 └─ [3] PreviewPanel ────── 우측 미리보기 (w-[400px])
```

### [1] TreeSidebar 상세

```
TreeSidebar
│  TQ: useEntries(), useUser()
│  Zustand: contentView, setView, sidebarSections, toggleSection
│  Mutations: remove, reorder, addToDisplay, reorderDisplay
│  Local: activeItem, isDraggingOverView
│
├─ DndContext (dnd-kit)
│  │
│  ├─ "DNA" 로고 (Link → /)
│  │
│  ├─ Bio Design 버튼
│  │   └─ onClick → setView({ kind: 'bio' })
│  │
│  ├─ Page 버튼 + 접힘 토글
│  │   └─ onClick → setView({ kind: 'page' })
│  │
│  ├─ ViewSection (드롭존)
│  │   │  useDroppable('view-drop-zone')
│  │   │
│  │   └─ SortableContext
│  │      └─ TreeItem × N (표시 중인 entries)
│  │         │  useSortable('view-{id}')
│  │         └─ Zustand: contentView, setView
│  │
│  ├─ ── Divider ──
│  │
│  ├─ "Components" 헤더
│  │
│  ├─ SectionItem ("Events")
│  │   │  Zustand: sidebarSections, toggleSection, setView
│  │   └─ SortableContext
│  │      └─ TreeItem × N (event entries)
│  │
│  ├─ SectionItem ("Mixsets")
│  │   └─ SortableContext → TreeItem × N
│  │
│  ├─ SectionItem ("Links")
│  │   └─ SortableContext → TreeItem × N
│  │
│  ├─ AccountSection
│  │   │  TQ: useUser(), useUserMutations()
│  │   │  Local: isEditDialogOpen, tempUser, isUploading
│  │   └─ Dialog (프로필 편집)
│  │
│  └─ DragOverlay (드래그 고스트)
```

### [2] ContentPanel 상세

```
ContentPanel
│  Zustand: contentView, setView
│
├─ view.kind === 'bio'
│  └─ BioDesignPanel (dynamic import)
│     │  TQ: useUser(), useUserMutations(), useQueryClient()
│     │  Local: isProfileOpen
│     │
│     ├─ 프로필 섹션 (collapsible)
│     │  ├─ AvatarUpload ─── uploadAvatar, deleteAvatar
│     │  ├─ Display Name ─── 직접 setQueryData + debouncedSave
│     │  └─ Bio textarea ─── 직접 setQueryData + debouncedSave
│     │
│     └─ HeaderStyleSection (UI 전용)
│
├─ view.kind === 'page'
│  └─ PageListView
│     │  TQ: useEntries()
│     │  Mutations: toggleVisibility, removeFromDisplay, reorderDisplay
│     │  Local: activeId
│     │
│     └─ DndContext
│        └─ SortableContext
│           └─ SortableItem × N (displayOrder 기준 정렬)
│
├─ view.kind === 'detail' | 'page-detail'
│  └─ ErrorBoundaryWithQueryReset ────── 상세 전용 에러 경계
│     └─ Suspense (DetailSkeleton)
│        └─ EntryDetailView (dynamic import)
│           │  TQ: useEntryDetail(id)
│           │  Mutations: update, remove
│           │  Local: localEntry, editingField, isSaving, lastSaved
│           │
│           └─ EDITOR_REGISTRY[entry.type]
│              ├─ EventEditor ─── EditableField, EditableDateField,
│              │                  EditablePerformersField, LinksEditor
│              ├─ MixsetEditor ── EditableField, ImageEditor
│              └─ LinkEditor ──── EditableField
│
└─ view.kind === 'create'
   └─ CreateEntryPanel (dynamic import)
      │  Zustand: selectPageId, selectSetView
      │
      └─ Form Router
         ├─ type === 'event'
         │  └─ CreateEventForm
         │     │  Hook: useCreateEntryForm(EVENT_FORM_CONFIG)
         │     │  RHF: <Form>, <FormField> × 6, zodResolver
         │     └─ Mutation: create
         │
         ├─ type === 'mixset'
         │  └─ CreateMixsetForm
         │     │  Hook: useCreateEntryForm(MIXSET_FORM_CONFIG)
         │     │  RHF: <Form>, <FormField> × 3, zodResolver
         │     └─ Mutation: create
         │
         └─ type === 'link'
            └─ DefaultCreateForm (useState 기반, RHF 미사용)
```

### [3] PreviewPanel 상세

```
PreviewPanel
│  TQ: useUser()
│  Callback: useRegisterPreviewRefresh(refreshPreview)
│  Local: copied, isVisible, isLoading
│
├─ 링크 + 복사 버튼
│  └─ /{user.username}
│
└─ iPhone 프레임
   └─ iframe
      └─ src: /{user.username}?preview=true
```

### 데이터 소스 범례

```
TQ       = TanStack Query 캐시 구독 (useEntries, useUser, useEntryDetail)
Mutations = TanStack Query mutation (useEntryMutations, useUserMutations)
Zustand  = dashboardStore 셀렉터 (contentView, sidebarSections, pageId)
Local    = useState / useRef (컴포넌트 마운트 중에만 유지)
RHF      = React Hook Form (useForm + zodResolver)
Callback = 모듈 ref 기반 이벤트 시스템 (previewRefresh)
```

### Suspense / ErrorBoundary 경계

```
layout.tsx
  └─ ErrorBoundary ← ① 최상위: 전체 dashboard 크래시 대응
     └─ Suspense   ← ② SSR 로딩: page.tsx 서버 fetch 대기
        └─ page.tsx
           └─ ContentPanel
              └─ (detail view만)
                 └─ ErrorBoundary ← ③ 상세 전용: entry fetch 실패 격리
                    └─ Suspense   ← ④ 상세 로딩: useEntryDetail suspend

dynamic imports: BioDesignPanel, CreateEntryPanel, EntryDetailView
  → 각각 loading prop으로 스켈레톤 표시 (Suspense와 별도)
```
