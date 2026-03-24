# Dashboard UI Deep Dive Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** UI Deep Dive Phase 2 — Back 버튼 로직 개선(INT-02), 헤더에 엔트리 타이틀 표시(INFO-01), SectionHeader title save feedback(INT-09) 3건 수정.

**Architecture:** 기존 파일 수정만으로 완료. 새 파일 생성 없음. dashboardStore selector 수정, EntryDetailView 헤더 보강, SectionHeader에 mutation status 전달.

**Tech Stack:** React, Tailwind CSS, Zustand, TanStack Query

---

### Task 1: Back 버튼 로직 개선 — Sidebar/CmdK 진입 시에도 Back 표시 (INT-02 + INFO-11)

**문제:** `selectHasPreviousView`가 `navigatedFromPageList`만 반환. Sidebar에서 entry 클릭 시 `fromPageList` 미전달 → Back 버튼이 안 보여 detail view에 갇힌 느낌.

**Files:**

- Modify: `src/app/dashboard/stores/dashboardStore.ts:123`

- [ ] **Step 1: selectHasPreviousView를 previousView 기반으로 변경**

현재 코드 (123행):

```tsx
export const selectHasPreviousView = (s: DashboardStore) => s.navigatedFromPageList;
```

변경:

```tsx
export const selectHasPreviousView = (s: DashboardStore) => s.previousView !== null;
```

이 변경으로:

- Sidebar 클릭 시: `setView({ kind: 'detail', entryId })` → `previousView`에 이전 뷰 저장 → `previousView !== null` = true → Back 버튼 표시
- CmdK 진입 시: 동일 로직으로 Back 버튼 표시
- PageList 진입 시: 기존과 동일 (previousView에 page 뷰 저장)
- `goBack()`은 `previousView ?? { kind: 'page' }` fallback이 있으므로 안전

**동작 변경 주의:** entry detail에서 다른 entry를 sidebar로 클릭하면 `previousView`에 이전 entry detail이 저장된다. Back 클릭 시 이전 entry detail로 돌아감 (기존: Back 자체가 안 보임). 이는 의도된 동작 — 1단계 뒤로가기이므로 자연스러움.

`navigatedFromPageList` 필드는 현재 이 selector에서만 사용됨. 다른 곳에서 쓰는지 확인:

- [ ] **Step 2: navigatedFromPageList 사용처 확인**

Run: `grep -r "navigatedFromPageList" src/ --include="*.ts" --include="*.tsx"`

Expected: `dashboardStore.ts`에서만 사용 (선언 + selector + setView + goBack + DEFAULT_STATE). 외부 직접 참조 없음.

`navigatedFromPageList` 필드 자체는 삭제하지 않는다 — `setView`의 `fromPageList` 옵션은 향후 Page Section 내 진입 시 특별 처리에 쓸 수 있으므로 보존.

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/app/dashboard/stores/dashboardStore.ts
git commit -m "fix(dashboardStore): show Back button for all entry detail navigation"
```

---

### Task 2: EntryDetailView 헤더에 entry.title 표시 (INFO-01)

**문제:** EntryDetailView 헤더에 TypeBadge + SaveIndicator만 있고 현재 편집 중인 엔트리 타이틀이 없음. Untitled 엔트리 다수 시 편집 대상 인지 어려움.

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/detail-views/EntryDetailView.tsx:121-143`

- [ ] **Step 1: 헤더 left 영역에 entry.title 추가**

현재 코드 (121-143행):

```tsx
            <div className="flex items-center justify-between border-b border-dashboard-border/50 px-6 py-4">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1.5 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    )}
                    <TypeBadge type={config.badgeType} size="sm" />
                    <HeaderSaveIndicator status={updateField.status} />
                    {!isViewReady && (
                        <span
                            title={`Required to add to Page: ${missingFields.join(', ')}`}
                            className="flex items-center gap-1.5"
                        >
                            <AlertCircle className="h-3.5 w-3.5 text-dashboard-warning" />
                            <span className="text-xs text-dashboard-warning">Incomplete</span>
                        </span>
                    )}
                </div>
```

변경:

```tsx
            <div className="flex items-center justify-between border-b border-dashboard-border/50 px-6 py-4">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1.5 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    )}
                    <TypeBadge type={config.badgeType} size="sm" />
                    <span className="max-w-[200px] truncate text-sm font-medium text-dashboard-text">
                        {entry.title || 'Untitled'}
                    </span>
                    <HeaderSaveIndicator status={updateField.status} />
                    {!isViewReady && (
                        <span
                            title={`Required to add to Page: ${missingFields.join(', ')}`}
                            className="flex items-center gap-1.5"
                        >
                            <AlertCircle className="h-3.5 w-3.5 text-dashboard-warning" />
                            <span className="text-xs text-dashboard-warning">Incomplete</span>
                        </span>
                    )}
                </div>
```

변경 내용: TypeBadge와 HeaderSaveIndicator 사이에 `entry.title` 텍스트 추가.

- `max-w-[200px] truncate`: 긴 제목이 헤더를 넘치지 않도록 제한
- `text-sm font-medium`: 패널 헤더 텍스트와 동일 스타일

**`entry` nullability 안전성:** `EntryDetailView`는 `ContentPanel/index.tsx`에서 `<Suspense>` + `<ErrorBoundaryWithQueryReset>`로 감싸져 있고, `useEntryDetail`은 entries.all 캐시에서 optimistic하게 resolve되므로 `entry`는 항상 정의됨 (line 103에서 이미 `entry.type`을 null check 없이 사용 중).

**Custom entry 제목 래그:** Custom entry의 body 내 SyncedField로 편집 중인 제목은 debounce 후 서버 동기화 → TQ 캐시 업데이트 시점에 헤더에 반영됨. debounce 중에는 헤더 제목이 이전 값을 보여줄 수 있으나, 이는 HeaderSaveIndicator의 "saving" 상태와 일관됨.

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/dashboard/components/ContentPanel/detail-views/EntryDetailView.tsx
git commit -m "feat(EntryDetailView): show entry title in editor header"
```

---

### Task 3: SectionHeader title input에 save feedback 추가 (INT-09)

**문제:** SectionHeader의 title input이 `onBlur` → `onTitleChange` 호출 후 저장 성공/실패 피드백이 없음. SyncedField/SaveIndicator를 사용하지 않는 plain input.

**접근:** SectionHeader 내부에서 자체 관리하는 optimistic saving indicator. Props 변경 없음 — SectionCard/PageSectionEditor 수정 불필요.

한계: 실제 mutation 실패를 반영하지 않음. 하지만 현재 단계에서 "저장 중" 피드백 자체가 없는 것보다 나음.

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx:1,30-34,44-51`

- [ ] **Step 1: import에 Loader2 추가**

1행:

```tsx
// 기존:
// 변경:
import {
    Eye,
    Eye,
    EyeOff,
    EyeOff,
    GripVertical,
    GripVertical,
    Loader2,
    Trash2,
    Trash2,
} from 'lucide-react';
```

- [ ] **Step 2: 내부 state에 isSaving 추가 + handleBlur 변경**

현재 (30-34행):

```tsx
const [localTitle, setLocalTitle] = useState(title ?? '');

const handleBlur = () => {
    onTitleChange(localTitle.trim() || null);
};
```

변경:

```tsx
const [localTitle, setLocalTitle] = useState(title ?? '');
const [isSaving, setIsSaving] = useState(false);

const handleBlur = () => {
    const trimmed = localTitle.trim() || null;
    if (trimmed !== title) {
        onTitleChange(trimmed);
        setIsSaving(true);
        const timer = setTimeout(() => setIsSaving(false), 600);
        // cleanup은 600ms로 매우 짧아 unmount 시 stale setState 무해 (React 18+)
    }
};
```

**동작 변경 주의:** 기존 `handleBlur`는 값 변경 여부와 무관하게 항상 `onTitleChange`를 호출했으나, 변경 후에는 `trimmed !== title`일 때만 호출. 이는 불필요한 mutation 방지로 개선.

- [ ] **Step 3: title input을 wrapper div로 감싸고 saving indicator 추가**

현재 (44-51행):

```tsx
<input
    value={localTitle}
    onChange={(e) => setLocalTitle(e.target.value)}
    onBlur={handleBlur}
    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    placeholder="Section title (optional)"
    className="flex-1 bg-transparent text-sm font-medium text-dashboard-text placeholder:text-dashboard-text-placeholder focus:outline-none"
/>
```

변경:

```tsx
<div className="flex flex-1 items-center gap-1.5">
    <input
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        placeholder="Section title (optional)"
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-dashboard-text placeholder:text-dashboard-text-placeholder focus:outline-none"
    />
    {isSaving && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-dashboard-text-muted" />}
</div>
```

- [ ] **Step 4: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx
git commit -m "feat(SectionHeader): add saving indicator for section title changes"
```

---

## 최종 검증

- [ ] **전체 빌드 확인**: `npx tsc --noEmit && npm run build`
- [ ] **수동 확인 포인트**:
    - Sidebar에서 entry 클릭 후 detail view에 Back 버튼 표시
    - CmdK로 entry 진입 후에도 Back 버튼 표시
    - Back 클릭 시 이전 뷰(page/bio)로 정상 복귀
    - EntryDetailView 헤더에 entry.title 표시 (긴 제목은 truncate)
    - SectionHeader title 변경 후 blur 시 spinning loader 잠시 표시
