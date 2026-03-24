# Dashboard UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대시보드 멘탈 모델 개선 — 레이블 명확화, auto-create 패턴 통일, 일괄 섹션 추가, viewType 레이블 추가

**Architecture:** Custom entry의 auto-create 패턴(`CustomAutoCreate` 컴포넌트)을 Event/Mixset/Link에 확장. Create form 3개 삭제. AddEntryModal을 multi-select로 업그레이드. Event만 RA Import 분기 유지.

**Tech Stack:** React · Zustand · TanStack Query · dnd-kit · shadcn/ui · Zod

---

## File Map

### 수정

- `src/app/dashboard/components/TreeSidebar/index.tsx` — 레이블 변경 (Profile, Page Layout, Archive)
- `src/app/dashboard/components/TreeSidebar/ComponentGroup.tsx` — "+" 핸들러를 auto-create로 변경 (Event만 popover 분기)
- `src/app/dashboard/components/ContentPanel/bio-design/BioDesignPanel.tsx` — 헤더 "Bio Design" → "Profile"
- `src/app/dashboard/components/ContentPanel/page-section-editor/PageSectionEditor.tsx` — 헤더 "Page Sections" → "Page Layout"
- `src/app/dashboard/components/ContentPanel/page-section-editor/AddEntryModal.tsx` — single-select → multi-select 체크박스
- `src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryList.tsx` — onAddEntry를 복수 ID 지원으로 변경
- `src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx` — viewType 아이콘에 텍스트 레이블 추가
- `src/app/dashboard/components/ContentPanel/create-forms/CreateEntryPanel.tsx` — RA Import 전용으로 축소
- `src/app/dashboard/components/ContentPanel/detail-views/EntryDetailView.tsx` — 미배치 배너 추가
- `src/app/dashboard/components/ContentPanel/index.tsx` — 'create' 뷰 분기 축소
- `src/app/dashboard/stores/dashboardStore.ts` — ContentView 'create' kind를 RA Import 전용으로 유지

### 삭제

- `src/app/dashboard/components/ContentPanel/create-forms/CreateEventForm.tsx`
- `src/app/dashboard/components/ContentPanel/create-forms/CreateMixsetForm.tsx`
- `src/app/dashboard/components/ContentPanel/create-forms/CreateLinkForm.tsx`

### 참조 (수정 안 함)

- `src/app/dashboard/hooks/use-mutations.ts` — createEntry mutation (기존 그대로 사용)
- `src/app/dashboard/hooks/use-create-entry-form.ts` — 삭제 대상 form들이 사용하던 hook (form 삭제 후 미사용 시 정리)
- `src/app/dashboard/config/entry/entry-forms.ts` — form config (form 삭제 후 미사용 시 정리)
- `src/app/dashboard/config/entry/entry-validation.ts` — validateEntry, canAddToView (미배치 배너에서 참조)
- `src/lib/mappers.ts` — createEmptyEntry() (auto-create에서 사용, 기존 그대로)

---

## Task 1: 사이드바 레이블 변경

**Files:**

- Modify: `src/app/dashboard/components/TreeSidebar/index.tsx:85-119`
- Modify: `src/app/dashboard/components/ContentPanel/bio-design/BioDesignPanel.tsx:53`
- Modify: `src/app/dashboard/components/ContentPanel/page-section-editor/PageSectionEditor.tsx:90`

- [ ] **Step 1: TreeSidebar 레이블 변경**

`index.tsx`에서 3곳 변경:

```
Line 85: {/* Bio Design */}  →  {/* Profile */}
Line 96: Bio design  →  Profile
Line 110: Page  →  Page Layout
Line 116-118: {/* Components */} + Components  →  {/* Archive */} + Archive
```

- [ ] **Step 2: BioDesignPanel 헤더 변경**

```
Line 53: Bio Design  →  Profile
```

- [ ] **Step 3: PageSectionEditor 헤더 변경**

```
Line 90: Page Sections  →  Page Layout
```

- [ ] **Step 4: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (텍스트만 변경)

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/components/TreeSidebar/index.tsx \
        src/app/dashboard/components/ContentPanel/bio-design/BioDesignPanel.tsx \
        src/app/dashboard/components/ContentPanel/page-section-editor/PageSectionEditor.tsx
git commit -m "fix(dashboard): rename sidebar labels — Bio design→Profile, Page→Page Layout, Components→Archive"
```

---

## Task 2: viewType 아이콘에 텍스트 레이블 추가

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx`

참조: SectionHeader의 viewType 토글 버튼은 현재 아이콘만(`h-3.5 w-3.5`) 표시. 각 아이콘 옆에 텍스트 레이블을 추가.

- [ ] **Step 1: viewType 토글에 레이블 추가**

SectionHeader.tsx에서 viewType 토글 버튼 영역을 찾아 아이콘 옆에 텍스트 추가:

- List 아이콘 → "List"
- LayoutGrid/Carousel 아이콘 → "Carousel"
- Star/Feature 아이콘 → "Feature"

스타일: `text-[10px] text-dashboard-text-muted` (아이콘과 같은 톤)

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx
git commit -m "fix(SectionHeader): add text labels to viewType toggle icons"
```

---

## Task 3: Auto-create 패턴 — Event/Mixset/Link 확장

**Files:**

- Modify: `src/app/dashboard/components/TreeSidebar/ComponentGroup.tsx:62-72`
- Modify: `src/app/dashboard/components/ContentPanel/create-forms/CreateEntryPanel.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/create-forms/CreateEventForm.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/create-forms/CreateMixsetForm.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/create-forms/CreateLinkForm.tsx`
- Modify: `src/app/dashboard/components/ContentPanel/index.tsx`

### 핵심 패턴 (기존 CustomAutoCreate 참조):

```typescript
// CreateEntryPanel.tsx의 기존 CustomAutoCreate 패턴:
function CustomAutoCreate() {
    const pageId = useDashboardStore(selectPageId);
    const setView = useDashboardStore(selectSetView);
    const goBack = useDashboardStore(selectGoBack);
    const { create: createMutation } = useEntryMutations();
    const hasCreated = useRef(false);

    useEffect(() => {
        if (hasCreated.current || !pageId) return;
        hasCreated.current = true;
        const entry = createEmptyEntry('custom');
        entry.title = 'Untitled';
        createMutation.mutate(
            { pageId, entry },
            { onError: () => { toast({...}); goBack(); } }
        );
        setView({ kind: 'detail', entryId: entry.id }, { replace: true });
    }, [pageId, createMutation, setView, goBack]);

    return null;
}
```

- [ ] **Step 1: CustomAutoCreate를 범용 AutoCreateEntry로 확장**

`CreateEntryPanel.tsx`에서 `CustomAutoCreate`를 타입 파라미터를 받는 범용 컴포넌트로 변경:

```typescript
function AutoCreateEntry({ type }: { type: EntryType }) {
    const pageId = useDashboardStore(selectPageId);
    const setView = useDashboardStore(selectSetView);
    const goBack = useDashboardStore(selectGoBack);
    const { create: createMutation } = useEntryMutations();
    const { data: entries } = useEntries();
    const hasCreated = useRef(false);

    useEffect(() => {
        if (hasCreated.current || !pageId) return;
        hasCreated.current = true;

        // Untitled 방지: 같은 타입의 Untitled 엔트리가 있으면 그걸 열기
        const existingUntitled = entries.find((e) => e.type === type && e.title === 'Untitled');
        if (existingUntitled) {
            setView({ kind: 'detail', entryId: existingUntitled.id }, { replace: true });
            return;
        }

        const entry = createEmptyEntry(type);
        entry.title = 'Untitled';
        createMutation.mutate(
            { pageId, entry },
            {
                onError: () => {
                    toast({ title: 'Failed to create entry' });
                    goBack();
                },
            }
        );
        setView({ kind: 'detail', entryId: entry.id }, { replace: true });
    }, [pageId, createMutation, setView, goBack, entries, type]);

    return null;
}
```

- [ ] **Step 2: CreateEntryPanel 라우팅 변경**

```typescript
export default function CreateEntryPanel({ type }: { type: EntryType }) {
    // Event의 RA Import 경로만 전용 UI 유지
    if (type === 'event') return <EventCreateRouter />;

    // Mixset, Link, Custom: 즉시 auto-create
    return <AutoCreateEntry type={type} />;
}
```

- [ ] **Step 3: EventCreateRouter 구현 (RA Import 분기)**

Event "+" 클릭 시: 간단한 선택 UI (Create new / Import from RA)

```typescript
function EventCreateRouter() {
    const [mode, setMode] = useState<'choose' | 'import' | null>('choose');

    if (mode === 'import') {
        return <EventImportSearch />;  // 기존 RA Import UI 재사용
    }

    if (mode === null) {
        // "Create new" 선택됨 → auto-create
        return <AutoCreateEntry type="event" />;
    }

    // 'choose' 모드: 선택 UI
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
            <p className="text-sm text-dashboard-text-muted">How do you want to add an event?</p>
            <div className="flex gap-3">
                <button onClick={() => setMode(null)} className="...">
                    Create new
                </button>
                <button onClick={() => setMode('import')} className="...">
                    Import from RA
                </button>
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Create form 3개 삭제**

```bash
rm src/app/dashboard/components/ContentPanel/create-forms/CreateEventForm.tsx
rm src/app/dashboard/components/ContentPanel/create-forms/CreateMixsetForm.tsx
rm src/app/dashboard/components/ContentPanel/create-forms/CreateLinkForm.tsx
```

- [ ] **Step 5: EventCreateSection.tsx에서 수동 생성 부분 제거**

`EventCreateSection.tsx`는 현재 "Create from RA" / "Create manually" 탭을 가짐. "Create manually" 부분(CreateEventForm 참조)을 제거하고, RA Import 부분(`EventImportSearch`)만 남기거나, 이 컴포넌트 자체를 EventCreateRouter에 흡수하여 삭제.

- [ ] **Step 6: FORM_REGISTRY 및 미사용 import 정리**

`CreateEntryPanel.tsx`에서:

- `FORM_REGISTRY` 객체 삭제 (더 이상 form 분기 없음)
- 삭제된 form import 제거
- `use-create-entry-form.ts` — 다른 곳에서 사용하지 않으면 삭제
- `entry-forms.ts` — 다른 곳에서 사용하지 않으면 삭제

- [ ] **Step 7: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 삭제된 파일 참조 에러 없음

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(dashboard): unify auto-create pattern for all entry types

- Extend CustomAutoCreate to generic AutoCreateEntry component
- Event keeps RA Import path via EventCreateRouter
- Mixset/Link/Custom: immediate auto-create on '+' click
- Delete CreateEventForm, CreateMixsetForm, CreateLinkForm
- Untitled entry prevention: reuse existing untitled of same type"
```

---

## Task 4: 미배치 엔트리 배너 (EntryDetailView)

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/detail-views/EntryDetailView.tsx`

isInSection 정보는 현재 TreeSidebar에서만 계산됨. EntryDetailView에서도 계산하여 미배치 배너를 표시.

- [ ] **Step 1: EntryDetailView에 미배치 배너 추가**

```typescript
// EntryDetailView 상단, 헤더 아래에 조건부 배너
const { data: pageMeta } = usePageMeta();

const isInSection = useMemo(() => {
    if (!pageMeta?.sections || !entry) return false;
    return pageMeta.sections.some((s) => s.entryIds.includes(entry.id));
}, [pageMeta?.sections, entry]);

// JSX: 헤더 바로 아래
{!isInSection && (
    <div className="flex items-center gap-2 border-b border-dashboard-border/30 bg-dashboard-bg-hover/50 px-6 py-2">
        <Info className="h-3.5 w-3.5 text-dashboard-text-muted" />
        <span className="text-xs text-dashboard-text-muted">
            Not on your page yet — add this entry to a section in Page Layout
        </span>
    </div>
)}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/detail-views/EntryDetailView.tsx
git commit -m "feat(EntryDetailView): show 'not on page' banner for unplaced entries"
```

---

## Task 5: AddEntryModal multi-select 업그레이드

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/page-section-editor/AddEntryModal.tsx`
- Modify: `src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryList.tsx`
- Modify: `src/app/dashboard/components/ContentPanel/page-section-editor/SectionCard.tsx` (onAddEntry prop 타입 변경 시)
- Modify: `src/app/dashboard/hooks/use-section-mutations.ts` (일괄 추가 mutation 필요 시)

현재 AddEntryModal: `onSelect: (entryId: string) => void` — 단건 선택.

- [ ] **Step 1: AddEntryModal을 multi-select로 변경**

Props 변경:

```typescript
interface AddEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entries: ContentEntry[];
    onSelect: (entryIds: string[]) => void; // 복수 ID
}
```

내부 상태:

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const toggleEntry = (id: string) => {
    setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
};

const selectAllUnplaced = () => {
    setSelectedIds(new Set(entries.map((e) => e.id)));
};

const handleConfirm = () => {
    onSelect(Array.from(selectedIds));
    setSelectedIds(new Set());
    onOpenChange(false);
};
```

UI: 각 엔트리에 체크박스, 상단에 "Select all (N)" 토글, 하단에 "Add N entries" 버튼.

- [ ] **Step 2: SectionEntryList의 onAddEntry 호출 변경**

현재: `onAddEntry(entryId: string)` — 단건
변경: `onAddEntries(entryIds: string[])` — 복수

SectionEntryList에서 AddEntryModal의 onSelect 콜백을 복수 ID를 순차 처리하도록 변경. 또는 use-section-mutations에 일괄 추가 함수 추가.

```typescript
// 간단한 접근: 순차 호출
const handleAddEntries = (entryIds: string[]) => {
    for (const id of entryIds) {
        onAddEntry(id);
    }
};
```

- [ ] **Step 3: Feature 섹션 가드**

Feature 섹션은 엔트리 1개 제한. multi-select에서 Feature 섹션일 경우:

- "Select all" 비활성
- 1개 초과 선택 시 경고 또는 1개만 허용

`FeatureSectionCard`는 별도 UI(`AddEntryModal` 대신 단건 드롭다운)를 사용할 수 있으므로 확인 필요.

- [ ] **Step 4: 빌드 확인**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(AddEntryModal): upgrade to multi-select with 'select all' toggle"
```

---

## Task 6: 미사용 코드 정리

**Files:**

- Possibly delete: `src/app/dashboard/hooks/use-create-entry-form.ts`
- Possibly delete: `src/app/dashboard/config/entry/entry-forms.ts`
- Modify: `src/app/dashboard/components/ContentPanel/create-forms/EventCreateSection.tsx` (RA Import만 남기거나 삭제 후 EventCreateRouter에 흡수)

- [ ] **Step 1: 미사용 파일 확인**

```bash
# 삭제된 form들이 import하던 파일들이 다른 곳에서도 쓰이는지 확인
grep -r "use-create-entry-form" src/ --include="*.ts" --include="*.tsx"
grep -r "entry-forms" src/ --include="*.ts" --include="*.tsx"
grep -r "EventCreateSection" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 2: 미사용 파일 삭제**

참조 없는 파일 삭제.

- [ ] **Step 3: 빌드 확인 + 전체 정리**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused create form hooks and configs"
```

---

## Execution Order

```
Task 1 (레이블) ──────────── 독립, 즉시 실행 가능
Task 2 (viewType 레이블) ─── 독립, 즉시 실행 가능
Task 3 (auto-create) ─────── 핵심 변경, Task 4/6이 의존
Task 4 (미배치 배너) ──────── Task 3 이후 (auto-create 시 배너 필요)
Task 5 (multi-select) ────── 독립, 언제든 실행 가능
Task 6 (정리) ─────────────── Task 3 이후 (삭제된 파일 참조 정리)
```

Task 1, 2, 5는 병렬 가능. Task 3 → 4 → 6은 순차.
