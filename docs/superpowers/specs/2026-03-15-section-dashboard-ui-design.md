# Section Dashboard UI — Phase 2 Spec

## Scope

대시보드에서 섹션을 편집하는 풀 에디터 구현.

| 포함                                    | 제외                          |
| --------------------------------------- | ----------------------------- |
| 섹션 CRUD (추가/삭제/순서변경)          | viewType별 옵션 상세 설정     |
| viewType 선택 (드롭다운)                | 섹션 isVisible 토글 (Phase 3) |
| 섹션 title 인라인 수정                  |                               |
| 사이드바 → 섹션 Drag & Drop 엔트리 배치 |                               |
| 섹션 내 엔트리 순서 변경 (DnD)          |                               |
| 섹션 간 순서 변경 (DnD)                 |                               |
| 엔트리 제거 (섹션에서)                  |                               |
| 섹션 포함 여부 dot 표시 복원            |                               |
| 엔트리 삭제 시 sections 정합성          |                               |
| Auto-save (debounced)                   |                               |

## 1. 데이터 레이어

### API

`PATCH /api/pages/[id]/sections`

- Body: `{ sections: Section[] }`
- Zod 스키마로 Section[] 검증 + 제한
- 4-layer 패턴: Route → Handler → Query
- 소유자 검증 (pageId → userId → auth)
- entryIds 소유자 검증 (전달된 entryIds가 유저 소유 entries인지 확인)

### Zod 스키마

```typescript
const sectionSchema = z.object({
    id: z.string().uuid(),
    viewType: z.enum(['carousel', 'list', 'grid', 'feature']),
    title: z.string().nullable(),
    entryIds: z.array(z.string()).max(50),
    isVisible: z.boolean(),
    options: z.record(z.unknown()),
});

const updateSectionsRequestSchema = z.object({
    sections: z.array(sectionSchema).max(20),
});
```

### Query

```typescript
// page.queries.ts
export async function updateSections(pageId: string, sections: Section[]): Promise<Result<Page>> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('pages')
        .update({ sections, updated_at: new Date().toISOString() })
        .eq('id', pageId)
        .select()
        .single();
    // ...
}
```

### Handler

```typescript
// section.handlers.ts
export async function handleUpdateSections(
    request: Request,
    { user }: AuthContext,
    pageId: string
) {
    const body = await request.json();                          // 1. Parse
    const parsed = updateSectionsRequestSchema.safeParse(body); // 2. Validate
    if (!parsed.success) return validationErrorResponse(...);

    // 3. Verify ownership
    const page = await findPageByUserId(user.id);
    if (!isSuccess(page) || page.data.id !== pageId) return forbiddenResponse();

    // 4. Verify entryIds ownership
    const allEntryIds = parsed.data.sections.flatMap(s => s.entryIds);
    if (allEntryIds.length > 0) {
        const entries = await getEntriesByPageId(pageId);
        if (!isSuccess(entries)) return internalErrorResponse(...);
        const validIds = new Set(entries.data.map(e => e.id));
        if (!allEntryIds.every(id => validIds.has(id))) return validationErrorResponse('invalid entryIds');
    }

    const result = await updateSections(pageId, parsed.data.sections); // 5. Database
    if (!isSuccess(result)) return internalErrorResponse(...);
    return successResponse(result.data);                               // 6. Response
}
```

### 클라이언트 — TanStack Query 캐시 전략

sections는 `pageKeys.all` 캐시에 포함. 기존 `PageMeta` 인터페이스를 확장:

```typescript
// use-editor-data.ts의 PageMeta에 sections 추가
interface PageMeta {
    pageId: string;
    pageSettings: PageSettings;
    sections: Section[]; // 추가
}
```

**SSR Hydration:**

- 대시보드 `page.tsx`에서 `getEditorData` 호출 시 sections도 prefetch
- HydrationBoundary에 포함되어 로딩 flash 방지

**Hook: `useSectionMutations()`**

- `updateSections` mutation — optimistic update로 `pageKeys.all` 캐시의 sections 교체
- 300ms debounce로 서버 저장 (단일 debounce timer — 모든 섹션 변경 누적)
- preview refresh 트리거

**Entry 삭제 시 정합성:**

- `remove` mutation의 `onSuccess`에서 `pageKeys.all` 캐시의 sections를 순회 → 삭제된 entryId를 entryIds에서 제거 → debounced sections PATCH 호출

## 2. ContentPanel — PageSectionEditor

기존 `PageListView` (placeholder)를 `PageSectionEditor`로 교체.

### 컴포넌트 구조

```
PageSectionEditor
├── "섹션 추가" 버튼 (viewType 선택 드롭다운)
├── SectionList (dnd-kit SortableContext — 섹션 순서 변경)
│   ├── SectionCard (각 섹션)
│   │   ├── SectionHeader
│   │   │   ├── 드래그 핸들 (⠿)
│   │   │   ├── title 인라인 수정 (input)
│   │   │   ├── viewType 드롭다운 (carousel/list/grid/feature)
│   │   │   └── 삭제 버튼 (×)
│   │   └── SectionEntryList (dnd-kit SortableContext — 엔트리 순서)
│   │       ├── SectionEntryItem (타입 뱃지 + 제목 + 제거 버튼)
│   │       └── DropPlaceholder ("엔트리를 드래그해서 추가하세요")
│   └── ...
└── (빈 상태: "섹션을 추가해서 페이지를 구성하세요")
```

### Drag & Drop 아키텍처

dnd-kit 사용 (프로젝트에 이미 설치됨).

**DashboardDndProvider — 공유 DndContext:**

현재 `TreeSidebar/index.tsx`가 자체 `DndContext`를 소유. cross-container DnD를 위해 대시보드 레이아웃 레벨로 올려야 함.

```
DashboardDndProvider (DndContext)
├── TreeSidebar (DnD source + 사이드바 내 sortable)
└── ContentPanel
    └── PageSectionEditor (DnD drop targets)
```

**새 파일: `src/app/dashboard/components/DashboardDndProvider.tsx`**

- 단일 `DndContext` + `DragOverlay` 관리
- composite collision detection: drag item의 `data.type`에 따라 다른 전략 적용

**3종류의 DnD 처리:**

| Drag Type       | Source              | Target                     | handleDragEnd 동작                      |
| --------------- | ------------------- | -------------------------- | --------------------------------------- |
| `sidebar-entry` | TreeItem (사이드바) | SectionEntryList           | 섹션의 entryIds에 추가                  |
| `section`       | SectionCard 핸들    | SectionList                | sections 배열 순서 변경                 |
| `section-entry` | SectionEntryItem    | 같은/다른 SectionEntryList | entryIds 내 순서 변경 또는 섹션 간 이동 |

**TreeItem DnD 변경:**

- 기존 `useSortable`을 유지 (사이드바 내 position 정렬용)
- `useSortable`의 `data` 객체에 `type: 'sidebar-entry'` 추가
- `handleDragEnd`에서 drop target이 section이면 entryIds에 추가하는 로직 분기
- 이미 섹션에 포함된 엔트리를 드롭하면 무시 (중복 방지)

**DragOverlay:**

- drag source의 type별 다른 overlay 렌더링
    - `sidebar-entry` / `section-entry`: 엔트리 요약 카드
    - `section`: 섹션 헤더 요약

### 인라인 편집

- **title**: `<input>` 직접 수정, blur/enter 시 sections 업데이트
- **viewType**: `<select>` 드롭다운, 즉시 전환
- 변경 즉시 optimistic update → 단일 debounce timer로 서버 저장

## 3. 사이드바 연동

### 섹션 포함 여부 표시

- 기존 Phase 1에서 제거한 `isInView` dot 표시를 sections 기반으로 복원
- `pageKeys.all` 캐시에서 sections를 읽어 `sections.some(s => s.entryIds.includes(entry.id))`로 판단
- TreeItem에 작은 dot 표시

### 메뉴

- `TREE_ENTRY_MENU`에 "섹션에 추가" 항목 추가
- 클릭 시 섹션 선택 서브메뉴 표시
- 선택한 섹션의 entryIds 끝에 추가

## 4. 저장 전략

### Auto-save (debounced)

- 모든 섹션 변경 → 즉시 optimistic update (`pageKeys.all` 캐시)
- 단일 300ms debounce timer — title 수정, viewType 변경, 엔트리 순서 변경 등 모든 변경을 누적
- 기존 BioDesignPanel의 debounced save 패턴과 동일

### Entry 삭제 시 정합성

- entry `remove` mutation의 onSuccess에서:
    1. `pageKeys.all` 캐시의 sections에서 삭제된 entryId를 모든 entryIds에서 제거
    2. debounced sections PATCH 호출

### Preview 갱신

- sections 변경 시 preview refresh 트리거
- `triggersPreview: true` 설정

## 5. 영향받는 파일

### 새로 생성

| 파일                                                                                  | 역할                             |
| ------------------------------------------------------------------------------------- | -------------------------------- |
| `src/app/api/pages/[id]/sections/route.ts`                                            | 섹션 업데이트 API route          |
| `src/lib/api/handlers/section.handlers.ts`                                            | 섹션 핸들러 (entryIds 검증 포함) |
| `src/lib/validations/section.schemas.ts`                                              | 섹션 Zod 스키마 (max 제한 포함)  |
| `src/app/dashboard/components/DashboardDndProvider.tsx`                               | 공유 DndContext + DragOverlay    |
| `src/app/dashboard/components/ContentPanel/page-section-editor/PageSectionEditor.tsx` | 메인 에디터                      |
| `src/app/dashboard/components/ContentPanel/page-section-editor/SectionCard.tsx`       | 개별 섹션 카드                   |
| `src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx`     | 섹션 헤더 (인라인 편집)          |
| `src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryList.tsx`  | 섹션 내 엔트리 리스트            |
| `src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryItem.tsx`  | 엔트리 아이템                    |
| `src/app/dashboard/hooks/use-section-mutations.ts`                                    | 섹션 mutation hook               |

### 수정

| 파일                                                    | 변경                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/lib/db/queries/page.queries.ts`                    | `updateSections()` 추가                                                   |
| `src/lib/services/user.service.ts`                      | EditorData에 sections 추가, parseSections 재사용                          |
| `src/app/dashboard/hooks/use-editor-data.ts`            | PageMeta에 sections 추가, SSR hydration 포함                              |
| `src/app/dashboard/hooks/use-mutations.ts`              | entry 삭제 시 sections 정합성 (onSuccess)                                 |
| `src/app/dashboard/components/TreeSidebar/TreeItem.tsx` | useSortable data에 type 추가 + 섹션 포함 dot 복원                         |
| `src/app/dashboard/components/TreeSidebar/index.tsx`    | 자체 DndContext 제거 → DashboardDndProvider로 위임, Page placeholder 제거 |
| `src/app/dashboard/config/ui/menu.ts`                   | "섹션에 추가" 메뉴 항목                                                   |
| `src/app/dashboard/components/ContentPanel/index.tsx`   | PageSectionEditor 렌더링                                                  |
| `src/types/domain.ts`                                   | Page 인터페이스에 `sections?: Section[]` 추가                             |

### 삭제

| 파일                                                                        | 이유                     |
| --------------------------------------------------------------------------- | ------------------------ |
| `src/app/dashboard/components/ContentPanel/page-list-view/PageListView.tsx` | PageSectionEditor로 교체 |
| `src/app/dashboard/components/ContentPanel/page-list-view/SortableItem.tsx` | 더 이상 미사용           |
| `src/app/dashboard/components/TreeSidebar/PageDisplayList.tsx`              | 더 이상 미사용           |
