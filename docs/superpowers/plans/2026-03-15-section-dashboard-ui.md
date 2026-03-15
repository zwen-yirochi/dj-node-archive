# Section Dashboard UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대시보드에서 섹션을 인라인 편집하고, 사이드바에서 엔트리를 섹션으로 Drag & Drop하는 풀 에디터 구현

**Architecture:** `PATCH /api/pages/[id]/sections` 단일 API로 sections jsonb 통째 업데이트. PageSectionEditor가 ContentPanel에서 렌더링되며, DashboardDndProvider가 사이드바↔섹션 간 cross-container DnD를 관리. Auto-save는 debounced optimistic update 패턴.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · Supabase · TanStack Query · Zustand · dnd-kit

**Spec:** `docs/superpowers/specs/2026-03-15-section-dashboard-ui-design.md`

---

## File Structure

### 새로 생성

| File                                                                                  | Responsibility                                               |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/lib/validations/section.schemas.ts`                                              | Zod 스키마: Section[] 검증 + max 제한                        |
| `src/lib/api/handlers/section.handlers.ts`                                            | handleUpdateSections (parse→validate→verify→db→response)     |
| `src/app/api/pages/[id]/sections/route.ts`                                            | Thin route: withAuth → handleUpdateSections                  |
| `src/app/dashboard/hooks/use-section-mutations.ts`                                    | useSectionMutations: debounced auto-save + optimistic update |
| `src/app/dashboard/components/DashboardDndProvider.tsx`                               | 공유 DndContext + composite collision + DragOverlay          |
| `src/app/dashboard/components/ContentPanel/page-section-editor/PageSectionEditor.tsx` | 메인 에디터: 섹션 추가 + SectionList                         |
| `src/app/dashboard/components/ContentPanel/page-section-editor/SectionCard.tsx`       | 개별 섹션: header + entry list                               |
| `src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx`     | 인라인 title + viewType dropdown + delete                    |
| `src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryList.tsx`  | 섹션 내 엔트리 Sortable 리스트 + drop target                 |
| `src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryItem.tsx`  | 엔트리 아이템: 뱃지 + title + remove                         |

### 수정

| File                                                    | Change                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/lib/db/queries/page.queries.ts`                    | `updateSections()` 함수 추가                                             |
| `src/lib/services/user.service.ts`                      | `EditorData`에 `sections` 추가, `getEditorData`에서 `parseSections` 사용 |
| `src/app/dashboard/hooks/use-editor-data.ts`            | `PageMeta`에 `sections` 추가, `fetchPageMeta`에서 파싱                   |
| `src/app/dashboard/hooks/use-mutations.ts`              | entry `remove` onSuccess에서 sections 정합성                             |
| `src/app/dashboard/components/TreeSidebar/TreeItem.tsx` | useSortable data에 type 추가, 섹션 포함 dot 복원                         |
| `src/app/dashboard/components/TreeSidebar/index.tsx`    | DndContext 제거 → DashboardDndProvider 위임, placeholder 제거            |
| `src/app/dashboard/config/ui/menu.ts`                   | "섹션에 추가" 메뉴 항목                                                  |
| `src/app/dashboard/components/ContentPanel/index.tsx`   | PageSectionEditor로 교체                                                 |
| `src/types/domain.ts`                                   | Page 인터페이스에 `sections?: Section[]` 추가                            |

### 삭제

| File                                                                        | Reason                   |
| --------------------------------------------------------------------------- | ------------------------ |
| `src/app/dashboard/components/ContentPanel/page-list-view/PageListView.tsx` | PageSectionEditor로 교체 |
| `src/app/dashboard/components/ContentPanel/page-list-view/SortableItem.tsx` | 미사용 stub              |
| `src/app/dashboard/components/TreeSidebar/PageDisplayList.tsx`              | 미사용 stub              |

---

## Chunk 1: 데이터 레이어 (API + Query + Hook + EditorData)

### Task 1: Zod 스키마

**Files:**

- Create: `src/lib/validations/section.schemas.ts`

- [ ] **Step 1: 스키마 파일 작성**

```typescript
import { z } from 'zod';

export const sectionSchema = z.object({
    id: z.string().uuid(),
    viewType: z.enum(['carousel', 'list', 'grid', 'feature']),
    title: z.string().nullable(),
    entryIds: z.array(z.string()).max(50),
    isVisible: z.boolean(),
    options: z.record(z.unknown()),
});

export const updateSectionsRequestSchema = z.object({
    sections: z.array(sectionSchema).max(20),
});

export type UpdateSectionsRequest = z.infer<typeof updateSectionsRequestSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validations/section.schemas.ts
git commit -m "feat(schemas): add section validation schemas"
```

---

### Task 2: DB Query — updateSections

**Files:**

- Modify: `src/lib/db/queries/page.queries.ts`

- [ ] **Step 1: updateSections 함수 추가**

`findPageByUserId` 함수 아래에 추가:

```typescript
export async function updateSections(pageId: string, sections: unknown[]): Promise<Result<Page>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('pages')
            .update({ sections, updated_at: new Date().toISOString() })
            .eq('id', pageId)
            .select()
            .single();

        if (error) {
            return failure(createDatabaseError(error.message, 'updateSections', error));
        }
        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('섹션 업데이트 중 오류가 발생했습니다.', 'updateSections', err)
        );
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db/queries/page.queries.ts
git commit -m "feat(queries): add updateSections function"
```

---

### Task 3: Handler — handleUpdateSections

**Files:**

- Create: `src/lib/api/handlers/section.handlers.ts`

- [ ] **Step 1: 핸들러 파일 작성**

```typescript
import { isSuccess } from '@/types/result';
import type { AuthContext } from '@/lib/api/middleware';
import {
    forbiddenResponse,
    internalErrorResponse,
    successResponse,
    validationErrorResponse,
} from '@/lib/api/responses';
import { getEntriesByPageId } from '@/lib/db/queries/entry.queries';
import { findPageByUserId, updateSections } from '@/lib/db/queries/page.queries';
import { updateSectionsRequestSchema } from '@/lib/validations/section.schemas';

export async function handleUpdateSections(
    request: Request,
    { user }: AuthContext,
    pageId: string
) {
    // 1. Parse
    const body = await request.json();

    // 2. Validate
    const parsed = updateSectionsRequestSchema.safeParse(body);
    if (!parsed.success) {
        return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid sections');
    }

    // 3. Verify page ownership
    const pageResult = await findPageByUserId(user.id);
    if (!isSuccess(pageResult) || !pageResult.data || pageResult.data.id !== pageId) {
        return forbiddenResponse();
    }

    // 4. Verify entryIds ownership
    const allEntryIds = parsed.data.sections.flatMap((s) => s.entryIds);
    if (allEntryIds.length > 0) {
        const entriesResult = await getEntriesByPageId(pageId);
        if (!isSuccess(entriesResult)) {
            return internalErrorResponse('Failed to verify entry ownership');
        }
        const validIds = new Set(entriesResult.data.map((e) => e.id));
        const invalidIds = allEntryIds.filter((id) => !validIds.has(id));
        if (invalidIds.length > 0) {
            return validationErrorResponse(`Invalid entryIds: ${invalidIds.join(', ')}`);
        }
    }

    // 5. Database
    const result = await updateSections(pageId, parsed.data.sections);
    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    // 6. Response
    return successResponse(result.data);
}
```

> **Note:** `getEntriesByPageId` 함수가 없으면 entry.queries.ts에 추가 필요. 기존 쿼리를 확인하고, 없으면 간단한 select 쿼리 작성.

- [ ] **Step 2: entry.queries.ts에 getEntriesByPageId 없으면 추가**

READ `src/lib/db/queries/entry.queries.ts` — `getEntriesByPageId` 존재 여부 확인. 없으면:

```typescript
export async function getEntriesByPageId(pageId: string): Promise<Result<Entry[]>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('entries').select('id').eq('page_id', pageId);

        if (error) {
            return failure(createDatabaseError(error.message, 'getEntriesByPageId', error));
        }
        return success(data ?? []);
    } catch (err) {
        return failure(
            createDatabaseError('엔트리 조회 중 오류가 발생했습니다.', 'getEntriesByPageId', err)
        );
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/handlers/section.handlers.ts src/lib/db/queries/entry.queries.ts
git commit -m "feat(handlers): add handleUpdateSections with entryIds verification"
```

---

### Task 4: API Route

**Files:**

- Create: `src/app/api/pages/[id]/sections/route.ts`

- [ ] **Step 1: Route 파일 작성**

```typescript
import { handleUpdateSections } from '@/lib/api/handlers/section.handlers';
import { withAuth } from '@/lib/api/middleware';

export const PATCH = withAuth(async (request, context) => {
    const { id } = await context.params;
    return handleUpdateSections(request, context, id);
});
```

> **Note:** `context.params`가 Promise인지 확인 (Next.js 16 App Router). 기존 route 파일의 패턴을 따를 것.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/pages/\[id\]/sections/route.ts
git commit -m "feat(api): add PATCH /api/pages/[id]/sections route"
```

---

### Task 5: EditorData에 sections 추가

**Files:**

- Modify: `src/lib/services/user.service.ts`
- Modify: `src/app/dashboard/hooks/use-editor-data.ts`

- [ ] **Step 1: user.service.ts — EditorData에 sections 추가**

`EditorData` 인터페이스에 `sections` 필드 추가:

```typescript
import type { Section } from '@/types/domain';

export interface EditorData {
    user: User;
    contentEntries: ContentEntry[];
    pageId: string | null;
    pageSettings: PageSettings;
    sections: Section[]; // 추가
}
```

`getEditorData`와 `getEditorDataByAuthUserId`의 반환값에 sections 추가. `parseSections` 재사용 (이미 같은 파일에 존재):

```typescript
// 기존 return success({ ... }) 에 sections 추가
return success({
    user,
    contentEntries,
    pageId: page.id,
    pageSettings: buildPageSettings(page),
    sections: parseSections(page.sections), // 추가
});
```

빈 페이지 fallback에도 추가:

```typescript
return success({
    user,
    contentEntries: [],
    pageId: null,
    pageSettings: DEFAULT_PAGE_SETTINGS,
    sections: [], // 추가
});
```

- [ ] **Step 2: use-editor-data.ts — PageMeta에 sections 추가**

`PageMeta` 인터페이스 수정:

```typescript
import type { Section } from '@/types/domain';

export interface PageMeta {
    pageId: string | null;
    pageSettings: PageSettings;
    sections: Section[]; // 추가
}
```

`fetchPageMeta` 수정:

```typescript
async function fetchPageMeta(): Promise<PageMeta> {
    const res = await fetch('/api/editor/data');
    if (!res.ok) throw new Error(`Failed to fetch page meta: ${res.status}`);
    const json = await res.json();
    return {
        pageId: json.data.pageId,
        pageSettings: json.data.pageSettings ?? { headerStyle: 'minimal', links: [] },
        sections: json.data.sections ?? [], // 추가
    };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/user.service.ts src/app/dashboard/hooks/use-editor-data.ts
git commit -m "feat(data): add sections to EditorData and PageMeta"
```

---

### Task 6: useSectionMutations hook

**Files:**

- Create: `src/app/dashboard/hooks/use-section-mutations.ts`

- [ ] **Step 1: Hook 파일 작성**

```typescript
import { v4 as uuidv4 } from 'uuid';
import { useCallback, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type { Section, ViewType } from '@/types/domain';

import { useDashboardStore } from '../stores/dashboardStore';
import { pageKeys, usePageMeta } from './use-editor-data';

const DEBOUNCE_MS = 300;

async function patchSections(pageId: string, sections: Section[]) {
    const res = await fetch(`/api/pages/${pageId}/sections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
    });
    if (!res.ok) throw new Error('Failed to update sections');
    return res.json();
}

export function useSectionMutations() {
    const queryClient = useQueryClient();
    const { data: pageMeta } = usePageMeta();
    const pageId = pageMeta?.pageId;
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const triggerPreviewRefresh = useDashboardStore((s) => s.triggerPreviewRefresh);

    // Core: update sections optimistically + debounced save
    const updateSections = useCallback(
        (updater: (prev: Section[]) => Section[]) => {
            queryClient.setQueryData(pageKeys.all, (prev: typeof pageMeta) => {
                if (!prev) return prev;
                return { ...prev, sections: updater(prev.sections) };
            });

            // Debounced server save
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                const current = queryClient.getQueryData<typeof pageMeta>(pageKeys.all);
                if (current?.pageId && current.sections) {
                    patchSections(current.pageId, current.sections).catch(console.error);
                }
                triggerPreviewRefresh?.();
            }, DEBOUNCE_MS);
        },
        [queryClient, pageMeta, triggerPreviewRefresh]
    );

    // Actions
    const addSection = useCallback(
        (viewType: ViewType) => {
            const newSection: Section = {
                id: uuidv4(),
                viewType,
                title: null,
                entryIds: [],
                isVisible: true,
                options: {},
            };
            updateSections((prev) => [...prev, newSection]);
        },
        [updateSections]
    );

    const removeSection = useCallback(
        (sectionId: string) => {
            updateSections((prev) => prev.filter((s) => s.id !== sectionId));
        },
        [updateSections]
    );

    const updateSectionField = useCallback(
        (sectionId: string, field: Partial<Pick<Section, 'title' | 'viewType'>>) => {
            updateSections((prev) =>
                prev.map((s) => (s.id === sectionId ? { ...s, ...field } : s))
            );
        },
        [updateSections]
    );

    const reorderSections = useCallback(
        (fromIndex: number, toIndex: number) => {
            updateSections((prev) => {
                const next = [...prev];
                const [moved] = next.splice(fromIndex, 1);
                next.splice(toIndex, 0, moved);
                return next;
            });
        },
        [updateSections]
    );

    const addEntryToSection = useCallback(
        (sectionId: string, entryId: string) => {
            updateSections((prev) =>
                prev.map((s) => {
                    if (s.id !== sectionId) return s;
                    if (s.entryIds.includes(entryId)) return s; // 중복 방지
                    return { ...s, entryIds: [...s.entryIds, entryId] };
                })
            );
        },
        [updateSections]
    );

    const removeEntryFromSection = useCallback(
        (sectionId: string, entryId: string) => {
            updateSections((prev) =>
                prev.map((s) => {
                    if (s.id !== sectionId) return s;
                    return { ...s, entryIds: s.entryIds.filter((id) => id !== entryId) };
                })
            );
        },
        [updateSections]
    );

    const reorderEntryInSection = useCallback(
        (sectionId: string, fromIndex: number, toIndex: number) => {
            updateSections((prev) =>
                prev.map((s) => {
                    if (s.id !== sectionId) return s;
                    const next = [...s.entryIds];
                    const [moved] = next.splice(fromIndex, 1);
                    next.splice(toIndex, 0, moved);
                    return { ...s, entryIds: next };
                })
            );
        },
        [updateSections]
    );

    const moveEntryBetweenSections = useCallback(
        (fromSectionId: string, toSectionId: string, entryId: string, toIndex: number) => {
            updateSections((prev) =>
                prev.map((s) => {
                    if (s.id === fromSectionId) {
                        return { ...s, entryIds: s.entryIds.filter((id) => id !== entryId) };
                    }
                    if (s.id === toSectionId) {
                        const next = [...s.entryIds];
                        next.splice(toIndex, 0, entryId);
                        return { ...s, entryIds: next };
                    }
                    return s;
                })
            );
        },
        [updateSections]
    );

    // Entry 삭제 시 sections에서 제거
    const removeEntryFromAllSections = useCallback(
        (entryId: string) => {
            updateSections((prev) =>
                prev.map((s) => ({
                    ...s,
                    entryIds: s.entryIds.filter((id) => id !== entryId),
                }))
            );
        },
        [updateSections]
    );

    return {
        addSection,
        removeSection,
        updateSectionField,
        reorderSections,
        addEntryToSection,
        removeEntryFromSection,
        reorderEntryInSection,
        moveEntryBetweenSections,
        removeEntryFromAllSections,
    };
}
```

- [ ] **Step 2: use-mutations.ts — entry 삭제 시 sections 정합성**

`use-mutations.ts`의 `remove` mutation의 `onSuccess` 콜백에서 `removeEntryFromAllSections`를 호출하도록 연결. 실제 연결 방식은 구현 시 확인 필요 (hook 간 의존성).

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/hooks/use-section-mutations.ts src/app/dashboard/hooks/use-mutations.ts
git commit -m "feat(hooks): add useSectionMutations with debounced auto-save"
```

---

## Chunk 2: PageSectionEditor UI 컴포넌트

### Task 7: SectionEntryItem

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryItem.tsx`

- [ ] **Step 1: 컴포넌트 작성**

섹션 내 개별 엔트리 아이템. dnd-kit의 `useSortable`로 드래그 가능.

```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import type { ContentEntry } from '@/types/domain';
import { TypeBadge } from '@/components/dna';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';

interface Props {
    entry: ContentEntry;
    sectionId: string;
    onRemove: () => void;
}

export function SectionEntryItem({ entry, sectionId, onRemove }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `${sectionId}:${entry.id}`,
        data: { type: 'section-entry', entry, sectionId },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const config = ENTRY_TYPE_CONFIG[entry.type];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-dashboard-border hover:bg-dashboard-bg-hover/50"
        >
            <button {...attributes} {...listeners} className="cursor-grab text-dashboard-text-placeholder">
                <GripVertical className="h-3.5 w-3.5" />
            </button>
            <TypeBadge type={config.badgeType} size="sm" />
            <span className="flex-1 truncate text-sm text-dashboard-text">
                {entry.title || 'Untitled'}
            </span>
            <button
                onClick={onRemove}
                className="invisible text-dashboard-text-placeholder hover:text-red-400 group-hover:visible"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryItem.tsx
git commit -m "feat(ui): add SectionEntryItem component"
```

---

### Task 8: SectionEntryList

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryList.tsx`

- [ ] **Step 1: 컴포넌트 작성**

섹션 내 엔트리 리스트. SortableContext로 순서 변경 + useDroppable로 사이드바 drop target.

```typescript
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ContentEntry } from '@/types/domain';
import { SectionEntryItem } from './SectionEntryItem';

interface Props {
    sectionId: string;
    entries: ContentEntry[];
    onRemoveEntry: (entryId: string) => void;
}

export function SectionEntryList({ sectionId, entries, onRemoveEntry }: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id: `droppable:${sectionId}`,
        data: { type: 'section-drop', sectionId },
    });

    const sortableIds = entries.map((e) => `${sectionId}:${e.id}`);

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[40px] rounded-md border border-dashed transition-colors ${
                isOver
                    ? 'border-blue-400 bg-blue-400/5'
                    : 'border-transparent'
            }`}
        >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {entries.length === 0 ? (
                    <p className="py-3 text-center text-xs text-dashboard-text-placeholder">
                        엔트리를 드래그해서 추가하세요
                    </p>
                ) : (
                    entries.map((entry) => (
                        <SectionEntryItem
                            key={entry.id}
                            entry={entry}
                            sectionId={sectionId}
                            onRemove={() => onRemoveEntry(entry.id)}
                        />
                    ))
                )}
            </SortableContext>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryList.tsx
git commit -m "feat(ui): add SectionEntryList with drop target"
```

---

### Task 9: SectionHeader

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx`

- [ ] **Step 1: 컴포넌트 작성**

인라인 title 수정 + viewType 드롭다운 + 삭제 버튼.

```typescript
import { GripVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ViewType } from '@/types/domain';

const VIEW_TYPE_OPTIONS: { value: ViewType; label: string }[] = [
    { value: 'list', label: 'List' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'grid', label: 'Grid' },
    { value: 'feature', label: 'Feature' },
];

interface Props {
    title: string | null;
    viewType: ViewType;
    dragHandleProps: Record<string, unknown>;
    onTitleChange: (title: string | null) => void;
    onViewTypeChange: (viewType: ViewType) => void;
    onDelete: () => void;
}

export function SectionHeader({
    title,
    viewType,
    dragHandleProps,
    onTitleChange,
    onViewTypeChange,
    onDelete,
}: Props) {
    const [localTitle, setLocalTitle] = useState(title ?? '');

    const handleBlur = () => {
        onTitleChange(localTitle.trim() || null);
    };

    return (
        <div className="flex items-center gap-2 px-2 py-2">
            <button {...dragHandleProps} className="cursor-grab text-dashboard-text-placeholder">
                <GripVertical className="h-4 w-4" />
            </button>
            <input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder="섹션 제목 (선택)"
                className="flex-1 bg-transparent text-sm font-medium text-dashboard-text placeholder:text-dashboard-text-placeholder focus:outline-none"
            />
            <select
                value={viewType}
                onChange={(e) => onViewTypeChange(e.target.value as ViewType)}
                className="rounded border border-dashboard-border bg-dashboard-bg px-2 py-1 text-xs text-dashboard-text"
            >
                {VIEW_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <button
                onClick={onDelete}
                className="text-dashboard-text-placeholder hover:text-red-400"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx
git commit -m "feat(ui): add SectionHeader with inline editing"
```

---

### Task 10: SectionCard

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/page-section-editor/SectionCard.tsx`

- [ ] **Step 1: 컴포넌트 작성**

개별 섹션 카드. `useSortable`로 섹션 간 드래그 + SectionHeader + SectionEntryList 조합.

```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ContentEntry, Section, ViewType } from '@/types/domain';
import { SectionHeader } from './SectionHeader';
import { SectionEntryList } from './SectionEntryList';

interface Props {
    section: Section;
    entries: ContentEntry[];
    onUpdateField: (field: Partial<Pick<Section, 'title' | 'viewType'>>) => void;
    onDelete: () => void;
    onRemoveEntry: (entryId: string) => void;
}

export function SectionCard({ section, entries, onUpdateField, onDelete, onRemoveEntry }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: section.id,
        data: { type: 'section', section },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="mb-3 rounded-xl border border-dashboard-border bg-dashboard-bg-card"
        >
            <SectionHeader
                title={section.title}
                viewType={section.viewType}
                dragHandleProps={{ ...attributes, ...listeners }}
                onTitleChange={(title) => onUpdateField({ title })}
                onViewTypeChange={(viewType) => onUpdateField({ viewType })}
                onDelete={onDelete}
            />
            <div className="px-2 pb-2">
                <SectionEntryList
                    sectionId={section.id}
                    entries={entries}
                    onRemoveEntry={onRemoveEntry}
                />
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/page-section-editor/SectionCard.tsx
git commit -m "feat(ui): add SectionCard component"
```

---

### Task 11: PageSectionEditor

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/page-section-editor/PageSectionEditor.tsx`

- [ ] **Step 1: 컴포넌트 작성**

메인 에디터. 섹션 추가 버튼 + SortableContext로 섹션 정렬 + SectionCard 리스트.

```typescript
'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import type { ViewType } from '@/types/domain';
import { useEntries, usePageMeta } from '@/app/dashboard/hooks/use-editor-data';
import { useSectionMutations } from '@/app/dashboard/hooks/use-section-mutations';
import { SectionCard } from './SectionCard';

const VIEW_TYPE_OPTIONS: { value: ViewType; label: string }[] = [
    { value: 'list', label: 'List' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'grid', label: 'Grid' },
    { value: 'feature', label: 'Feature' },
];

export default function PageSectionEditor() {
    const { data: pageMeta } = usePageMeta();
    const { data: entries } = useEntries();
    const mutations = useSectionMutations();
    const [showTypeSelect, setShowTypeSelect] = useState(false);

    const sections = pageMeta?.sections ?? [];
    const entryMap = new Map(entries.map((e) => [e.id, e]));

    const resolveEntries = (entryIds: string[]) =>
        entryIds.map((id) => entryMap.get(id)).filter(Boolean) as typeof entries;

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border px-4 py-3">
                <h2 className="text-sm font-medium text-dashboard-text">Page Sections</h2>
                <div className="relative">
                    <button
                        onClick={() => setShowTypeSelect(!showTypeSelect)}
                        className="flex items-center gap-1 rounded-md bg-dashboard-bg-hover px-2 py-1 text-xs text-dashboard-text-secondary hover:bg-dashboard-bg-active"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        섹션 추가
                    </button>
                    {showTypeSelect && (
                        <div className="absolute right-0 top-full z-10 mt-1 rounded-md border border-dashboard-border bg-dashboard-bg-card py-1 shadow-lg">
                            {VIEW_TYPE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        mutations.addSection(opt.value);
                                        setShowTypeSelect(false);
                                    }}
                                    className="block w-full px-4 py-1.5 text-left text-xs text-dashboard-text hover:bg-dashboard-bg-hover"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Section List */}
            <div className="flex-1 overflow-y-auto p-4">
                {sections.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-dashboard-text-placeholder">
                            섹션을 추가해서 페이지를 구성하세요
                        </p>
                    </div>
                ) : (
                    <SortableContext
                        items={sections.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {sections.map((section) => (
                            <SectionCard
                                key={section.id}
                                section={section}
                                entries={resolveEntries(section.entryIds)}
                                onUpdateField={(field) =>
                                    mutations.updateSectionField(section.id, field)
                                }
                                onDelete={() => mutations.removeSection(section.id)}
                                onRemoveEntry={(entryId) =>
                                    mutations.removeEntryFromSection(section.id, entryId)
                                }
                            />
                        ))}
                    </SortableContext>
                )}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: ContentPanel/index.tsx 업데이트**

`PageListView` import를 `PageSectionEditor`로 교체:

```typescript
// Before
import PageListView from './page-list-view/PageListView';
// After
import PageSectionEditor from './page-section-editor/PageSectionEditor';
```

`case 'page':` 렌더링도 변경:

```typescript
case 'page':
    return (
        <div className="h-full overflow-hidden rounded-2xl">
            <PageSectionEditor />
        </div>
    );
```

- [ ] **Step 3: 기존 stub 파일 삭제**

```bash
rm src/app/dashboard/components/ContentPanel/page-list-view/PageListView.tsx
rm src/app/dashboard/components/ContentPanel/page-list-view/SortableItem.tsx
rm src/app/dashboard/components/TreeSidebar/PageDisplayList.tsx
```

빈 디렉토리도 정리.

- [ ] **Step 4: Commit**

```bash
git add -A src/app/dashboard/components/ContentPanel/ src/app/dashboard/components/TreeSidebar/PageDisplayList.tsx
git commit -m "feat(ui): add PageSectionEditor, replace PageListView"
```

---

## Chunk 3: DnD 통합 + 사이드바 연동

### Task 12: DashboardDndProvider

**Files:**

- Create: `src/app/dashboard/components/DashboardDndProvider.tsx`
- Modify: `src/app/dashboard/components/TreeSidebar/index.tsx`

- [ ] **Step 1: DashboardDndProvider 작성**

TreeSidebar에서 DndContext를 추출하고, sidebar DnD + section DnD를 모두 처리하는 공유 프로바이더.

```typescript
'use client';

import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type CollisionDetection,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useId, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ContentEntry } from '@/types/domain';
import { TypeBadge } from '@/components/dna';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entry/entry-types';
import { computeReorderedPositions } from '../hooks/entries.api';
import { entryKeys, useEntries, usePageMeta } from '../hooks/use-editor-data';
import { useEntryMutations } from '../hooks';
import { useSectionMutations } from '../hooks/use-section-mutations';
import { toast } from '@/hooks/use-toast';

interface DragData {
    type: 'entry' | 'sidebar-entry' | 'section' | 'section-entry' | 'section-drop';
    entry?: ContentEntry;
    sectionId?: string;
    section?: unknown;
}

export default function DashboardDndProvider({ children }: { children: ReactNode }) {
    const dndId = useId();
    const queryClient = useQueryClient();
    const { data: entries } = useEntries();
    const { data: pageMeta } = usePageMeta();
    const { reorder: reorderEntriesMutation } = useEntryMutations();
    const sectionMutations = useSectionMutations();

    const [activeItem, setActiveItem] = useState<DragData | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const collisionDetection: CollisionDetection = useCallback(
        (args) => {
            const activeData = args.active.data.current as DragData | undefined;

            // Sidebar entry sorting — restrict to same type
            if (activeData?.type === 'entry') {
                const filtered = args.droppableContainers.filter((c) => {
                    const d = c.data.current as DragData | undefined;
                    return d?.type === 'entry' && d.entry?.type === activeData.entry?.type;
                });
                return closestCenter({ ...args, droppableContainers: filtered });
            }

            // Section sorting — restrict to sections
            if (activeData?.type === 'section') {
                const filtered = args.droppableContainers.filter((c) => {
                    const d = c.data.current as DragData | undefined;
                    return d?.type === 'section';
                });
                return closestCenter({ ...args, droppableContainers: filtered });
            }

            // Section entry / sidebar-entry — allow section drop targets
            return closestCenter(args);
        },
        []
    );

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as DragData | undefined;
        if (data) setActiveItem(data);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);
        if (!over) return;

        const activeData = active.data.current as DragData | undefined;
        const overData = over.data.current as DragData | undefined;
        if (!activeData || !overData) return;

        // 1. Sidebar entry reorder (within same type)
        if (activeData.type === 'entry' && overData.type === 'entry') {
            if (activeData.entry?.type === overData.entry?.type && active.id !== over.id) {
                const sectionEntries = entries
                    .filter((e) => e.type === activeData.entry!.type)
                    .sort((a, b) => a.position - b.position);
                const overIndex = sectionEntries.findIndex((e) => e.id === over.id);
                if (overIndex !== -1) {
                    const updates = computeReorderedPositions(
                        entries, activeData.entry!.type, activeData.entry!.id, overIndex
                    );
                    if (updates) {
                        const posMap = new Map(updates.map((u) => [u.id, u.position]));
                        queryClient.setQueryData<ContentEntry[]>(entryKeys.all, (prev) =>
                            prev?.map((e) => {
                                const newPos = posMap.get(e.id);
                                return newPos !== undefined ? { ...e, position: newPos } : e;
                            })
                        );
                        reorderEntriesMutation.mutate(
                            { updates },
                            { onError: () => toast({ variant: 'destructive', title: 'Failed to reorder' }) }
                        );
                    }
                }
            }
            return;
        }

        // 2. Sidebar entry → section (drop into section)
        if (activeData.type === 'entry' && overData.type === 'section-drop' && overData.sectionId) {
            if (activeData.entry) {
                sectionMutations.addEntryToSection(overData.sectionId, activeData.entry.id);
            }
            return;
        }

        // 3. Section reorder
        if (activeData.type === 'section' && overData.type === 'section') {
            const sections = pageMeta?.sections ?? [];
            const fromIndex = sections.findIndex((s) => s.id === active.id);
            const toIndex = sections.findIndex((s) => s.id === over.id);
            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                sectionMutations.reorderSections(fromIndex, toIndex);
            }
            return;
        }

        // 4. Section entry reorder (within or between sections)
        if (activeData.type === 'section-entry' && activeData.sectionId && activeData.entry) {
            const activeSectionId = activeData.sectionId;
            const activeEntryId = activeData.entry.id;

            // Drop onto section-drop target
            if (overData.type === 'section-drop' && overData.sectionId) {
                if (activeSectionId !== overData.sectionId) {
                    sectionMutations.moveEntryBetweenSections(
                        activeSectionId, overData.sectionId, activeEntryId, 0
                    );
                }
                return;
            }

            // Drop onto another section-entry
            if (overData.type === 'section-entry' && overData.sectionId) {
                const overSectionId = overData.sectionId;
                const overEntryId = overData.entry?.id;
                if (!overEntryId) return;

                const sections = pageMeta?.sections ?? [];

                if (activeSectionId === overSectionId) {
                    // Same section reorder
                    const section = sections.find((s) => s.id === activeSectionId);
                    if (!section) return;
                    const fromIdx = section.entryIds.indexOf(activeEntryId);
                    const toIdx = section.entryIds.indexOf(overEntryId);
                    if (fromIdx !== -1 && toIdx !== -1) {
                        sectionMutations.reorderEntryInSection(activeSectionId, fromIdx, toIdx);
                    }
                } else {
                    // Cross-section move
                    const toSection = sections.find((s) => s.id === overSectionId);
                    if (!toSection) return;
                    const toIdx = toSection.entryIds.indexOf(overEntryId);
                    sectionMutations.moveEntryBetweenSections(
                        activeSectionId, overSectionId, activeEntryId, toIdx
                    );
                }
            }
        }
    };

    return (
        <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {children}
            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
                {activeItem?.entry && (
                    <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-card px-3 py-1 pl-8 shadow-lg">
                        <span className="text-sm text-dashboard-text">
                            {activeItem.entry.title || 'Untitled'}
                        </span>
                    </div>
                )}
                {activeItem?.type === 'section' && (
                    <div className="rounded-lg border border-dashboard-border bg-dashboard-bg-card px-3 py-2 shadow-lg">
                        <span className="text-sm font-medium text-dashboard-text">Section</span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
```

- [ ] **Step 2: TreeSidebar/index.tsx — DndContext 제거, DashboardDndProvider로 위임**

TreeSidebar에서:

1. `DndContext`, `DragOverlay`, collision detection, handleDragStart, handleDragEnd, sensors 등 DnD 관련 코드 모두 제거
2. `<DndContext>` wrapper 제거 — 단순히 `<aside>` 반환
3. TreeItem의 `useSortable` data에 `type: 'entry'` 추가 확인
4. Page placeholder 텍스트 제거

- [ ] **Step 3: 대시보드 레이아웃에 DashboardDndProvider 적용**

대시보드 레이아웃 파일에서 TreeSidebar + ContentPanel을 DashboardDndProvider로 감싸기.

- [ ] **Step 4: Commit**

```bash
git add -A src/app/dashboard/
git commit -m "feat(dnd): add DashboardDndProvider for cross-container drag and drop"
```

---

### Task 13: TreeItem 섹션 포함 dot + 메뉴

**Files:**

- Modify: `src/app/dashboard/components/TreeSidebar/TreeItem.tsx`
- Modify: `src/app/dashboard/config/ui/menu.ts`

- [ ] **Step 1: TreeItem에 섹션 포함 여부 dot 표시**

TreeItem에서 `usePageMeta()`로 sections를 가져와서 `sections.some(s => s.entryIds.includes(entry.id))`로 판단:

```typescript
const { data: pageMeta } = usePageMeta();
const isInSection = pageMeta?.sections?.some((s) => s.entryIds.includes(entry.id)) ?? false;
```

JSX에 dot 표시 추가:

```tsx
{
    isInSection && <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />;
}
```

- [ ] **Step 2: menu.ts에 "섹션에 추가" 항목**

`TREE_ENTRY_MENU`에 add-to-section 액션 추가. 실제 서브메뉴 구현은 TreeItem의 메뉴 핸들러에서 처리.

```typescript
export const TREE_ADD_TO_SECTION: MenuItem = {
    key: 'add-to-section',
    label: '섹션에 추가',
    icon: Plus,
};

export const TREE_ENTRY_MENU: MenuConfig = [TREE_ADD_TO_SECTION, TREE_DELETE];
```

- [ ] **Step 3: TreeItem 메뉴 핸들러에서 섹션 선택 로직**

"섹션에 추가" 클릭 시 sections 목록을 표시하고, 선택 시 `addEntryToSection` 호출. 구현 시 기존 메뉴 시스템의 패턴 확인 필요.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/components/TreeSidebar/TreeItem.tsx src/app/dashboard/config/ui/menu.ts
git commit -m "feat(sidebar): restore section dot indicator and add-to-section menu"
```

---

### Task 14: domain.ts Page 타입 + 빌드 검증

**Files:**

- Modify: `src/types/domain.ts`

- [ ] **Step 1: Page 인터페이스에 sections 추가**

```typescript
export interface Page {
    id: string;
    userId: string;
    slug: string;
    title?: string;
    bio?: string;
    avatarUrl?: string;
    themeColor?: string;
    headerStyle?: HeaderStyle;
    links: ProfileLink[];
    sections?: Section[]; // 추가
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```

Expected: 성공.

- [ ] **Step 4: Commit**

```bash
git add src/types/domain.ts
git commit -m "feat(types): add sections to Page interface"
```
