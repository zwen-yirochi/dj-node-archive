# DND Kit Style Guide

프로젝트 전체 드래그 앤 드롭 스타일을 한 곳에서 관리하기 위한 가이드.

## CSS 토큰 (`globals.css` → `@layer utilities`)

| 토큰                    | 용도                                             | Tailwind 정의                                                                                                   |
| ----------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `.drag-handle`          | 기본 드래그 핸들 (항상 보임)                     | `cursor-grab touch-none text-dashboard-text-placeholder hover:text-dashboard-text-muted active:cursor-grabbing` |
| `.drag-handle-hover`    | hover 시 표시되는 드래그 핸들                    | `drag-handle` + `opacity-0 transition-opacity group-hover:opacity-100`                                          |
| `.drag-source-ghost`    | 드래그 중 원본 반투명                            | `opacity-50`                                                                                                    |
| `.drag-source-hidden`   | 드래그 중 원본 완전 숨김 (DragOverlay 대체 표시) | `pointer-events-none opacity-0`                                                                                 |
| `.drag-source-elevated` | 드래그 중 원본 들어올림 (인라인 정렬 시)         | `z-10 bg-dashboard-bg-surface shadow-md`                                                                        |
| `.drag-overlay-card`    | DragOverlay 카드 기반 스타일                     | `rounded-lg border border-dashboard-border bg-dashboard-bg-card shadow-lg animate-[fade-in_150ms_ease-out]`     |
| `.drop-zone-active`     | 드롭 대상 하이라이트                             | `border-blue-400 bg-blue-400/5`                                                                                 |

## JS 상수 (`src/lib/dnd/animate.ts`)

| 상수                           | 용도                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| `sortableAnimateLayoutChanges` | 정렬 시 부드러운 이동 + 드롭 시 즉시 안착 정책              |
| `defaultDropAnimation`         | DragOverlay 드롭 애니메이션 (`duration: 150, easing: ease`) |

## 아이콘 규칙

- 드래그 핸들: **`GripVertical`** (`h-4 w-4`, 16px) 통일
- 방향 무관 — 가로 갤러리도 GripVertical 사용

## 적용 현황

### isDragging 스타일

| 컴포넌트                     | 토큰                   | 이유                                    |
| ---------------------------- | ---------------------- | --------------------------------------- |
| TreeItem                     | `drag-source-ghost`    | 반투명 (전체 행 드래그)                 |
| SectionEntryItem (list/card) | `drag-source-ghost`    | 반투명                                  |
| ImageCard                    | `drag-source-ghost`    | 반투명                                  |
| BlockWrapper                 | `drag-source-ghost`    | 반투명                                  |
| SortableSectionWrapper       | `drag-source-hidden`   | 완전 숨김 (DragOverlay가 대체)          |
| SortableLinkRow              | `drag-source-elevated` | 들어올림 (인라인 편집 중이라 원본 유지) |

### Drag Handle

| 컴포넌트                | 변형                 | 이유                                                                                 |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| SortableLinkRow         | `.drag-handle`       | 항상 보임 (리스트 행)                                                                |
| SectionEntryItem (list) | `.drag-handle`       | 항상 보임                                                                            |
| FeatureSectionCard      | `.drag-handle`       | 항상 보임                                                                            |
| SectionHeader           | `.drag-handle`       | 항상 보임                                                                            |
| BlockWrapper            | `.drag-handle-hover` | hover 시 표시 (편집 UI 방해 최소화)                                                  |
| SectionEntryItem (card) | `.drag-handle-hover` | hover 시 표시 (이미지 위 오버레이)                                                   |
| ImageCard               | 커스텀               | 이미지 위 반투명 오버레이 (`bg-black/15 text-white/70`) — 대시보드 토큰 색상 안 보임 |
| TreeItem                | 없음                 | 전체 행이 드래그 영역 (별도 핸들 불필요)                                             |

### DragOverlay

| DndContext                     | 토큰                                                    | dropAnimation                     |
| ------------------------------ | ------------------------------------------------------- | --------------------------------- |
| DashboardDndProvider (entry)   | `drag-overlay-card`                                     | `null` (onDragOver 실시간 리오더) |
| DashboardDndProvider (section) | `drag-overlay-card` + `shadow-xl rounded-xl` 오버라이드 | `null`                            |
| CustomEntryEditor              | `drag-overlay-card`                                     | `defaultDropAnimation`            |
| ImageField                     | 커스텀 (`border-dashboard-accent border-2`)             | `defaultDropAnimation`            |
| LinksSection                   | 없음 (DragOverlay 미사용)                               | —                                 |

### Drop Zone

| 컴포넌트          | 토큰               |
| ----------------- | ------------------ |
| SectionEntryList  | `drop-zone-active` |
| FeatureDropTarget | `drop-zone-active` |

## 새 드래그 가능 컴포넌트 추가 시 체크리스트

1. `useSortable`에 `animateLayoutChanges: sortableAnimateLayoutChanges` 전달
2. isDragging 스타일 → `drag-source-ghost` / `drag-source-hidden` / `drag-source-elevated` 중 선택
3. 드래그 핸들 → `drag-handle` 또는 `drag-handle-hover` 적용, 아이콘은 `GripVertical h-4 w-4`
4. DragOverlay 사용 시 → 카드면 `drag-overlay-card`, `dropAnimation={defaultDropAnimation}`
5. 드롭 대상 → `drop-zone-active` 적용

## 새 드래그 시나리오 추가 시 (DashboardDndProvider)

DashboardDndProvider는 Strategy 패턴을 사용합니다.

**파일 위치:** `src/lib/dnd/strategies/`

**현재 전략:**

| 전략                  | activeTypes     | 역할                                  |
| --------------------- | --------------- | ------------------------------------- |
| `sidebarEntryReorder` | `entry`         | 엔트리 정렬 + 섹션에 추가             |
| `sectionReorder`      | `section`       | 섹션 순서 변경 (onOver 실시간 리오더) |
| `sectionEntryReorder` | `section-entry` | 섹션 내 엔트리 정렬/이동              |

**새 전략 추가 순서:**

1. `src/lib/dnd/strategies/<name>.ts` 파일 생성
2. `DragStrategy` 인터페이스 구현: `activeTypes`, `acceptsOver`, `onEnd` (필요 시 `onOver`)
3. `src/lib/dnd/strategies/index.ts`의 `dashboardStrategies` 배열에 추가
4. Provider 수정 불필요 — 전략 배열에 추가만 하면 자동 매칭

**전략 인터페이스 (`src/lib/dnd/types.ts`):**

| 필드          | 용도                                            |
| ------------- | ----------------------------------------------- |
| `activeTypes` | 이 전략이 처리할 드래그 아이템 타입             |
| `acceptsOver` | collision detection: 허용할 droppable 타입 필터 |
| `onOver?`     | 드래그 중 실시간 처리 (optional)                |
| `onEnd`       | 드롭 시 처리                                    |

## 예외 (토큰 미적용, 의도적)

| 컴포넌트               | 항목                          | 이유                                                                                                                                                                         |
| ---------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ImageCard 핸들         | `.drag-handle` 미사용         | 이미지 위 반투명 오버레이 (`bg-black/15 text-white/70`) — 대시보드 토큰 색상이 이미지 배경에서 안 보임                                                                       |
| ImageField DragOverlay | `.drag-overlay-card` 미사용   | `<Image>` 직접 렌더링이라 카드 배경 불필요. `shadow-lg rounded-lg`는 공통이지만, 이미지 오버레이는 `border-2 border-dashboard-accent`로 "선택됨" 강조가 목적이라 맥락이 다름 |
| DashboardDndProvider   | `defaultDropAnimation` 미사용 | onDragOver에서 섹션 실시간 리오더 → 드롭 시 애니메이션이 이중으로 겹쳐 어색                                                                                                  |
| LinksSection           | DragOverlay 없음              | `drag-source-elevated`로 행 자체가 들어올려져 이동하므로 별도 오버레이 불필요                                                                                                |
