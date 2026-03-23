# Dashboard UI Deep Dive Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** UI Deep Dive에서 발견된 높음 심각도 3건 + 중간 1건을 즉시 수정한다.

**Architecture:** 기존 파일 수정만으로 완료. 새 파일 생성 없음. tailwind.config에 토큰 1개 추가, 나머지는 기존 Tailwind 클래스 교체.

**Tech Stack:** React, Tailwind CSS, Zustand, TanStack Query

---

### Task 1: PreviewPanel entry detail URL을 slug 기반으로 수정 (INT-14)

**문제:** `usePreviewUrl`이 `contentView.entryId`(UUID)로 URL을 구성하지만, public route는 `/:user/:slug` 기반. entry detail preview가 항상 404.

**Files:**

- Modify: `src/app/dashboard/components/ui/PreviewPanel.tsx:33-44`

- [ ] **Step 1: usePreviewUrl에서 entries를 조회하여 slug 사용**

현재 코드 (33-44행):

```tsx
function usePreviewUrl(username: string): string {
    const contentView = useDashboardStore(selectContentView);
    const hasDetailPage = useDetailHasPage(
        contentView.kind === 'detail' ? contentView.entryId : undefined
    );
    return useMemo(() => {
        if (contentView.kind === 'detail' && hasDetailPage) {
            return `/${username}/${contentView.entryId}?preview=true`;
        }
        return `/${username}?preview=true`;
    }, [username, contentView, hasDetailPage]);
}
```

변경:

```tsx
function usePreviewUrl(username: string): string {
    const contentView = useDashboardStore(selectContentView);
    const { data: entries } = useEntries();
    const hasDetailPage = useDetailHasPage(
        contentView.kind === 'detail' ? contentView.entryId : undefined
    );
    return useMemo(() => {
        if (contentView.kind === 'detail' && hasDetailPage) {
            const entry = entries?.find((e) => e.id === contentView.entryId);
            const slug = entry?.slug;
            if (slug) {
                return `/${username}/${slug}?preview=true`;
            }
        }
        return `/${username}?preview=true`;
    }, [username, contentView, hasDetailPage, entries]);
}
```

Note: `useEntries`와 `useUser`는 이미 PreviewPanel.tsx line 9에서 import 되어 있으므로 import 변경 불필요. 함수 본문만 수정.

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/dashboard/components/ui/PreviewPanel.tsx
git commit -m "fix(PreviewPanel): use entry slug instead of entryId for preview URL"
```

---

### Task 2: tailwind.config에 dashboard-accent 토큰 추가 (VIS-07)

**문제:** `dashboard-accent` 토큰이 tailwind.config.ts에 미정의. ImageField/ImageDropZone에서 `border-dashboard-accent`, `text-dashboard-accent`, `bg-dashboard-accent/5` 등을 사용하지만 실제 색상이 없어 투명으로 렌더됨.

**Files:**

- Modify: `tailwind.config.ts:114` (dashboard 객체의 `success` 뒤에 추가)

- [ ] **Step 1: dashboard.accent 토큰 추가**

`tailwind.config.ts`의 dashboard 객체에서 `success` 라인(114행) 뒤에 추가:

```ts
                    // Success (뷰 추가됨 표시 등)
                    success: 'rgb(34 197 94)', // green-500
                    // Accent (선택/활성 강조)
                    accent: 'rgb(59 130 246)', // blue-500 — ImageField 편집모드, 드래그 활성 등
```

blue-500 선택 근거: 대시보드가 중립적(neutral) 팔레트 기반이므로 accent에 blue가 자연스러움. shadcn의 `accent` 토큰과는 별개.

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add tailwind.config.ts
git commit -m "fix(tailwind): add dashboard-accent token for ImageField active states"
```

---

### Task 3: 삭제 hover 색상을 dashboard-danger 토큰으로 통일 (VIS-05)

**문제:** 5개 파일에서 `hover:text-red-400`을 사용. `dashboard-danger`(red-500)가 정의되어 있으나 미사용. 토큰 체계 위반.

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx:89`
- Modify: `src/app/dashboard/components/ContentPanel/page-section-editor/FeatureSectionCard.tsx:56,83`
- Modify: `src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryItem.tsx:73,117`

- [ ] **Step 1: SectionHeader.tsx 수정**

89행:

```tsx
// 기존:
className = 'text-dashboard-text-placeholder hover:text-red-400';
// 변경:
className = 'text-dashboard-text-placeholder hover:text-dashboard-danger';
```

- [ ] **Step 2: FeatureSectionCard.tsx 수정**

56행 (X 버튼):

```tsx
// 기존:
className =
    'invisible shrink-0 text-dashboard-text-placeholder hover:text-red-400 group-hover:visible';
// 변경:
className =
    'invisible shrink-0 text-dashboard-text-placeholder hover:text-dashboard-danger group-hover:visible';
```

83행 (Trash2 버튼):

```tsx
// 기존:
className = 'text-dashboard-text-placeholder hover:text-red-400';
// 변경:
className = 'text-dashboard-text-placeholder hover:text-dashboard-danger';
```

- [ ] **Step 3: SectionEntryItem.tsx 수정**

73행 (card variant X 버튼):

```tsx
// 기존:
className =
    'absolute right-0.5 top-0.5 z-10 rounded bg-dashboard-bg-card/80 p-0.5 text-dashboard-text-placeholder opacity-0 hover:text-red-400 group-hover/card:opacity-100';
// 변경:
className =
    'absolute right-0.5 top-0.5 z-10 rounded bg-dashboard-bg-card/80 p-0.5 text-dashboard-text-placeholder opacity-0 hover:text-dashboard-danger group-hover/card:opacity-100';
```

117행 (list variant X 버튼):

```tsx
// 기존:
className = 'invisible text-dashboard-text-placeholder hover:text-red-400 group-hover:visible';
// 변경:
className =
    'invisible text-dashboard-text-placeholder hover:text-dashboard-danger group-hover:visible';
```

- [ ] **Step 4: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx \
        src/app/dashboard/components/ContentPanel/page-section-editor/FeatureSectionCard.tsx \
        src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryItem.tsx
git commit -m "fix(page-section-editor): use dashboard-danger token for delete hover states"
```

---

### Task 4: SectionHeader 삭제 버튼에 시각적 구분 추가 (INFO-08)

**문제:** Trash2(삭제)와 Eye(가시성) 버튼이 동일한 시각적 무게(`text-dashboard-text-placeholder`, `h-3.5 w-3.5`)로 배치. 파괴적 행위의 시각적 위험 신호 없음.

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx:86-92`

**의존성:** Task 3이 먼저 실행되어야 함 (Trash2의 `hover:text-red-400` → `hover:text-dashboard-danger` 교체).

- [ ] **Step 1: Eye와 Trash2 사이에 separator 추가 + title 속성 추가**

현재 코드 (80-92행, Task 3 적용 후 상태):

```tsx
            <button
                onClick={onToggleVisibility}
                className="text-dashboard-text-placeholder hover:text-dashboard-text"
                title={isVisible ? 'Hide section' : 'Show section'}
            >
                {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <button
                onClick={onDelete}
                className="text-dashboard-text-placeholder hover:text-dashboard-danger"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
```

변경:

```tsx
            <button
                onClick={onToggleVisibility}
                className="text-dashboard-text-placeholder hover:text-dashboard-text"
                title={isVisible ? 'Hide section' : 'Show section'}
            >
                {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <div className="h-3.5 w-px bg-dashboard-border" />
            <button
                onClick={onDelete}
                className="text-dashboard-text-placeholder hover:text-dashboard-danger"
                title="Delete section"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
```

변경 내용:

1. Eye와 Trash2 사이에 `<div className="h-3.5 w-px bg-dashboard-border" />` 구분선 추가
2. Trash2에 `title="Delete section"` 추가 (접근성)

Note: `hover:text-dashboard-danger`는 Task 3에서 이미 적용됨.

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx
git commit -m "fix(SectionHeader): add visual separator before delete button"
```

---

## 최종 검증

- [ ] **전체 빌드 확인**: `npx tsc --noEmit && npm run build`
- [ ] **수동 확인 포인트**:
    - Entry detail 선택 시 PreviewPanel에 slug 기반 URL로 프리뷰 로드 (404 아님)
    - ImageField 편집 모드에서 파란색(blue-500) accent 테두리 표시
    - 섹션/엔트리 삭제 버튼 hover 시 dashboard-danger(red-500) 색상 적용
    - SectionHeader에서 Eye와 Trash2 사이 구분선 표시
