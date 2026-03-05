# Dashboard Domain Refactoring Audit

> 대시보드 도메인 리팩토링을 위한 구조 감사 스펙.
> 3개 청크로 분리하여 독립적으로 분석한다.

---

## Chunk 1: Config 정합성 감사

### 목적

Entry type 추가/변경 시 모든 config가 일관되게 업데이트되는지 검증한다.

### 범위

| 관심사                             | 파일                                                              |
| ---------------------------------- | ----------------------------------------------------------------- |
| Entry type 기본 설정               | `src/app/dashboard/config/entryConfig.ts`                         |
| 사이드바 섹션 정의                 | `src/app/dashboard/config/sidebarConfig.ts`                       |
| 에디터 메뉴 정의                   | `src/app/dashboard/config/menuConfig.ts`                          |
| 필드 메타데이터 + preview 트리거   | `src/app/dashboard/config/entryFieldConfig.ts`                    |
| 필드 블록 → 컴포넌트 매핑          | `src/app/dashboard/config/fieldBlockConfig.ts`                    |
| 생성 폼 기본값 + 변환              | `src/app/dashboard/config/entryFormConfig.ts`                     |
| 커스텀 블록 설정                   | `src/app/dashboard/config/customBlockConfig.ts`                   |
| Zod 검증 스키마 (draft/publish)    | `src/lib/validations/entry.schemas.ts`                            |
| 도메인 타입 정의                   | `src/types/domain.ts`                                             |
| DB 타입 정의                       | `src/types/database.ts`                                           |
| 엔트리 매퍼 (domain ↔ DB)          | `src/lib/mappers.ts`                                              |
| 컴포넌트 레지스트리 (detail view)  | `src/app/dashboard/components/ContentPanel/EntryDetailView.tsx`   |
| 컴포넌트 레지스트리 (create form)  | `src/app/dashboard/components/ContentPanel/CreateEntryPanel.tsx`  |
| 컴포넌트 레지스트리 (custom block) | `src/app/dashboard/components/ContentPanel/CustomEntryEditor.tsx` |

### 검증 항목

- [ ] 모든 `EntryType`에 대해 7개 config 파일이 빠짐없이 정의되어 있는가
- [ ] `DETAIL_VIEW_REGISTRY` / `FORM_REGISTRY` / `BLOCK_COMPONENT_MAP` 에 누락된 타입이 없는가
- [ ] Zod `create` schema 기본값과 `createEmptyEntry()` 기본값이 일치하는가
- [ ] `FIELD_CONFIG` 필드 키와 실제 도메인 타입 필드가 1:1 매핑되는가
- [ ] `mapEntryToDatabase` ↔ `mapEntryToDomain` 라운드트립이 데이터를 손실하지 않는가
- [ ] `ENTRY_SCHEMAS.create` vs `ENTRY_SCHEMAS.view` 검증 수준 차이가 의도와 일치하는가

---

## Chunk 2: UI 로직 정합성 감사

### 목적

ContentView 라우팅과 사이드바 상호작용이 모든 경로에서 일관된 UX를 제공하는지 검증한다.

### 범위

| 관심사                            | 파일                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------- |
| ContentView 타입 + Zustand 스토어 | `src/app/dashboard/stores/dashboardStore.ts`                                    |
| ContentPanel 라우터 (view switch) | `src/app/dashboard/components/ContentPanel/index.tsx`                           |
| BioDesignPanel                    | `src/app/dashboard/components/ContentPanel/BioDesignPanel.tsx`                  |
| PageListView                      | `src/app/dashboard/components/ContentPanel/PageListView.tsx`                    |
| EntryDetailView                   | `src/app/dashboard/components/ContentPanel/EntryDetailView.tsx`                 |
| CreateEntryPanel                  | `src/app/dashboard/components/ContentPanel/CreateEntryPanel.tsx`                |
| CustomEntryEditor                 | `src/app/dashboard/components/ContentPanel/CustomEntryEditor.tsx`               |
| TreeSidebar 메인                  | `src/app/dashboard/components/TreeSidebar/index.tsx`                            |
| TreeItem (사이드바 엔트리)        | `src/app/dashboard/components/TreeSidebar/TreeItem.tsx`                         |
| SectionItem (접기/펼치기 섹션)    | `src/app/dashboard/components/TreeSidebar/SectionItem.tsx`                      |
| ViewSection (Page 엔트리 영역)    | `src/app/dashboard/components/TreeSidebar/ViewSection.tsx`                      |
| DnD 컨텍스트 (사이드바)           | `src/app/dashboard/components/TreeSidebar/index.tsx` 내 DndContext              |
| DnD 컨텍스트 (PageListView)       | `src/app/dashboard/components/ContentPanel/PageListView.tsx` 내 DndContext      |
| DnD 컨텍스트 (CustomEntryEditor)  | `src/app/dashboard/components/ContentPanel/CustomEntryEditor.tsx` 내 DndContext |
| PreviewPanel                      | `src/app/dashboard/components/PreviewPanel.tsx`                                 |

### 검증 항목

- [x] ContentView 5개 kind 간 전환 시 모든 경로가 유효한가 → **Issue 1, 5, 6**
- [x] `page-detail` vs `detail` 분리가 정당한가 → **Issue 1**: 사이드바 highlight 외 차이 없음
- [x] 삭제 후 현재 보고 있던 엔트리가 사라졌을 때 view 전환 처리 → **Issue 2 (BUG)**
- [x] 사이드바 TreeItem 상태 아이콘(✓, ⚠)과 `canAddToView()` 로직 일치 → OK
- [x] DnD 3가지 동작 간 충돌 가능성 → **Issue 8**: 기능 문제 없으나 UX 피드백 불일치
- [x] Create flow: `FORM_REGISTRY`에 없는 타입(link)의 DefaultCreateForm 동작 완결성 → OK
- [x] Custom entry 즉시 생성(CustomAutoCreate) → detail 전환 시 캐시 동기화 → **Issue 7**
- [x] 사이드바 highlight 로직이 ContentView와 정확히 동기화되는가 → OK

### 감사 결과

#### Issue 1: `page-detail` vs `detail` 구분 무의미화 — Low

**파일**: `ContentPanel/index.tsx:63-76`

두 kind가 완전히 동일하게 렌더링됨 (같은 컴포넌트, 같은 `onBack` 콜백).
유일한 차이: 사이드바 highlight 로직 (`detail` → TreeItem, `page-detail` → Page 버튼).
`key={view.kind}` 사용으로 `page-detail` ↔ `detail` 전환 시 불필요한 리마운트 발생.

#### Issue 2: 사이드바 삭제 시 ContentView 미전환 — HIGH (BUG)

**파일**: `TreeSidebar/index.tsx:248-250`

사용자가 entry A의 detail을 보고 있는 상태에서, 사이드바에서 같은 entry A를 삭제하면:

1. Optimistic update로 `entryKeys.all` 캐시에서 제거
2. ContentView는 여전히 `{ kind: 'detail', entryId: 'A' }`
3. `useEntryDetail('A')` → 캐시 miss → API 404 → ErrorBoundary 렌더링

**원인**: `handleDelete`에 현재 contentView 확인 + 전환 로직 없음.

#### Issue 3: ViewSection TreeItem 메뉴 2개 no-op — HIGH (BUG)

**파일**: `TreeSidebar/index.tsx:330-337`, `ViewSection.tsx:38-39, 72-79`

ViewSection에 `removeFromDisplay` prop 미전달 → "Remove from Page" no-op.
ViewSection 내 TreeItem에 `onToggleVisibility` prop 미전달 → "Hide/Show" no-op.
`onDeleteEntry` prop은 ViewSection이 받지만 어디에도 사용하지 않는 dead prop.
결과: View 섹션의 컨텍스트 메뉴에서 "Edit"만 동작, 나머지 2개 항목은 클릭해도 반응 없음.

#### Issue 4: ViewSection 이중 필터링 — Low

**파일**: `TreeSidebar/index.tsx:94-100` + `ViewSection.tsx:32-34`

TreeSidebar에서 이미 `displayOrder`로 필터+정렬한 배열을 전달하는데,
ViewSection에서 동일한 필터+정렬을 다시 수행. 불필요한 중복.

#### Issue 5: Create 취소 시 항상 Page로 이동 — Low

**파일**: `CreateEntryPanel.tsx:123, 197`

Cancel/취소 시 항상 `{ kind: 'page' }`로 이동.
Events 섹션의 + 버튼에서 진입했어도 Page로 이동 (이전 뷰 추적 불가).
ContentView에 history 개념 없음 → 아키텍처 한계.

#### Issue 6: `key={view.kind}` 불필요한 리마운트 — Low

**파일**: `ContentPanel/index.tsx:89`

`page-detail` → `detail` (또는 반대) 전환 시 key 변경으로 전체 언마운트/리마운트 + 애니메이션 재실행.
동일한 `EntryDetailView`인데 kind 문자열 차이로 리마운트.

#### Issue 7: CustomAutoCreate 캐시 이중 세팅 — Medium

**파일**: `CreateEntryPanel.tsx:32-60`

`entryKeys.detail(id)`에 직접 세팅 + mutation optimistic으로 `entryKeys.all`에도 추가.
두 캐시가 독립적으로 존재하여 이후 update 시 짧은 시간 동안 불일치 가능.
`onSettled` invalidation으로 결국 동기화되지만 타이밍 gap 존재.

#### Issue 8: Cross-type 드래그 시각적 피드백 불일치 — Low

**파일**: `TreeSidebar/index.tsx:210-245`

`closestCenter` collision detection으로 다른 타입 섹션 위 드래그 시 시각적 반응하지만
drop 시 `activeEntry.type === overEntry.type` 체크로 무시됨. UX 혼란 가능.

---

## Chunk 3: 서버 상태 관리 감사

### 목적

TanStack Query 캐시 전략과 optimistic update가 데이터 정합성을 보장하는지 검증한다.

### 범위

| 관심사                                     | 파일                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Query key 정의 + useEntries/useEntryDetail | `src/app/dashboard/hooks/use-editor-data.ts`                                                    |
| Optimistic mutation 팩토리                 | `src/app/dashboard/hooks/optimistic-mutation.ts`                                                |
| Entry mutations (8개)                      | `src/app/dashboard/hooks/use-mutations.ts`                                                      |
| User query + mutations                     | `src/app/dashboard/hooks/use-user.ts`                                                           |
| Page query + mutations                     | `src/app/dashboard/hooks/use-page.ts`                                                           |
| Preview refresh hook                       | `src/app/dashboard/hooks/use-preview-refresh.ts`                                                |
| Create entry form hook                     | `src/app/dashboard/hooks/use-create-entry-form.ts`                                              |
| SSR 초기 데이터 hydration                  | `src/app/dashboard/components/StoreInitializer.tsx`                                             |
| SSR 데이터 fetch                           | `src/app/dashboard/page.tsx`                                                                    |
| EditorData 서비스                          | `src/lib/services/user.service.ts`                                                              |
| QueryProvider 설정                         | `src/app/dashboard/layout.tsx` 또는 providers                                                   |
| API 핸들러 (entry)                         | `src/lib/api/handlers/entry.handlers.ts`                                                        |
| API 핸들러 (user)                          | `src/lib/api/handlers/user.handlers.ts`                                                         |
| DB 쿼리 (entry)                            | `src/lib/db/queries/entry.queries.ts`                                                           |
| DB 쿼리 (user)                             | `src/lib/db/queries/user.queries.ts`                                                            |
| API 라우트 (entries)                       | `src/app/api/entries/route.ts`, `[id]/route.ts`, `reorder/route.ts`, `reorder-display/route.ts` |

### 검증 항목

- [ ] 3개 캐시(`entries`, `user`, `page`) invalidation 전략이 일관적인가
- [ ] `useEntryDetail` initial data가 `entryKeys.all`에서 파생 → 캐시 간 sync 이슈
- [ ] Optimistic update rollback 후 stale 데이터 잔존 가능성
- [ ] Debounced save + external sync lock 패턴의 레이스 컨디션
- [ ] Preview refresh 조건부 트리거 누락 케이스
- [ ] `onSettled` invalidation과 optimistic data 간 깜빡임(flicker) 가능성
- [ ] Batch reorder의 partial failure 시 rollback 전략
- [ ] StoreInitializer `initialDataUpdatedAt: Date.now()` → SSR/CSR 타이밍 이슈
