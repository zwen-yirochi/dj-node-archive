# ADR: DND Kit 리팩토링 — 스타일 통일, Strategy 패턴, Bridge Store

**Date:** 2026-03-18
**Status:** Accepted
**Scope:** Dashboard DND 시스템 전체

---

## Context

프로젝트에서 @dnd-kit을 14개 파일에서 사용하지만, 공유 코드 없이 각 컴포넌트가 독립적으로 구현되어 있었다. DashboardDndProvider는 290줄짜리 모놀리식 컴포넌트로, 4가지 드래그 시나리오의 collision detection + onDragOver + onDragEnd를 하나의 함수에서 if/else 체인으로 처리했다.

### 문제

1. **스타일 불일치** — isDragging 처리가 opacity-30/50/0 혼재, 드래그 핸들 아이콘 크기 불일치 (3.5/4), GripHorizontal/Vertical 혼용
2. **코드 중복** — animateLayoutChanges 함수 2곳 복붙, drop-zone 스타일 2곳 하드코딩
3. **확장성 부족** — 새 드래그 타입 추가 시 Provider의 3곳(collision, onDragOver, onDragEnd)을 동시에 수정해야 함
4. **네이밍 충돌** — `SectionBlock` 타입이 페이지 `Section`과 혼동
5. **드롭 후 점프** — TQ `setQueryData` → React 리렌더 사이 비동기 갭으로 TreeSidebar에서 아이템이 원래 위치로 돌아갔다가 새 위치로 점프

---

## Decision Process

### Phase 1: 공유 유틸리티 추출 여부 검토

DND Kit이 이미 범용 추상화를 제공하므로, 추가 추상화가 필요한지 패턴별로 비판적으로 검토했다.

| 패턴                        | 반복 횟수 | 추출 결정 | 이유                                                         |
| --------------------------- | --------- | --------- | ------------------------------------------------------------ |
| DndContext 셋업             | 4회       | **X**     | 원본이 이미 명확, 간접 참조만 증가                           |
| useSortable + CSS Transform | 6회       | **X**     | 각 사용처의 옵션 차이가 커서 래퍼가 또 다른 설정 레이어가 됨 |
| animateLayoutChanges        | 2회       | **O**     | 완전 동일한 프로젝트 정책 함수, 변경 시 동기화 필요          |
| Drop target 스타일          | 2회       | **O**     | Tailwind 토큰으로 일관성 확보 (컴포넌트 분리 아님)           |

**핵심 판단**: dnd-kit 훅을 래핑하면 "이 훅은 뭐하는 거지?" → 파일 열어보기 → "useSortable 래퍼구나"라는 간접 참조만 추가. 추상화가 새로운 지식을 만들지 않고 기존 지식을 숨기기만 하는 케이스.

### Phase 2: CSS 토큰 통일

드래그 핸들, isDragging, DragOverlay, drop-zone 등 시각적 패턴을 Tailwind `@layer utilities` 토큰 7종으로 통일. 아이콘은 `GripVertical h-4 w-4`로 표준화.

**의도적 예외 4곳도 문서화** — ImageCard 핸들(이미지 위 반투명 오버레이), ImageField DragOverlay(이미지 직접 렌더링), DashboardDndProvider dropAnimation, LinksSection(DragOverlay 미사용).

### Phase 3: SectionBlock → ContentBlock 리네이밍

페이지 레이아웃의 `Section`과 커스텀 엔트리 내 콘텐츠 블록의 `SectionBlock`이 네이밍 충돌. `ContentBlock`/`ContentBlockType`/`ContentBlockDataMap`으로 변경하여 두 개념을 명확히 분리.

### Phase 4: Strategy 패턴 적용

DashboardDndProvider의 handleDragEnd를 Strategy 패턴으로 분리하는 3가지 접근을 비교:

| 접근                                  | Provider 크기 | 장점                             | 단점                          |
| ------------------------------------- | ------------- | -------------------------------- | ----------------------------- |
| A. handleDragEnd만 분리               | ~150줄        | 가장 실용적                      | collision은 여전히 Provider에 |
| **B. handleDragEnd + collision 분리** | ~100줄        | 타입별 collision이 전략에 캡슐화 | —                             |
| C. 전부 분리                          | ~60줄         | 순수 orchestrator                | Strategy 인터페이스 복잡      |

**B안 채택** — collision detection이 해당 전략에 가까이 위치하면 응집도가 높아지고, onDragOver는 이후 제거 대상이라 분리 가치 낮음.

**entryToSection 병합**: 초기 설계에서 entry → section-drop을 별도 전략으로 분리했으나, `activeTypes` 매칭 메커니즘으로는 같은 `entry` 타입의 두 전략을 구분할 수 없어서 `sidebarEntryReorder`에 통합. 전략 4개 → 3개.

### Phase 5: DND Context 분리 가능성 검토

DashboardDndProvider를 제거하고 TreeSidebar/ContentPanel에 각각 DndContext를 두는 방안을 검토.

**결론: 불가**. dnd-kit에서 크로스 컨테이너 드래그(사이드바 → 섹션)는 반드시 같은 DndContext 안에 있어야 한다. 별도 라이브러리가 아니라 단일 DndContext 내 여러 SortableContext를 배치하는 패턴.

### Phase 6: 드롭 후 점프 해결 — Temporary Local State Bridge

onDragOver 실시간 리오더, dropAnimation 보정, tempEntries bridge 3가지 접근을 비교:

| 접근                     | 근본 해결                   | 복잡도                   | 출처                                 |
| ------------------------ | --------------------------- | ------------------------ | ------------------------------------ |
| dropAnimation 150ms      | ❌ 갭을 UX로 커버           | 최소                     | —                                    |
| onDragOver 실시간 리오더 | ✅ 드롭 시 이미 올바른 위치 | 높음 (우회 코드 3개)     | 기존 섹션 구현                       |
| **tempEntries bridge**   | ✅ 갭 자체가 없음           | 낮음 (Zustand store 1개) | dnd-kit Discussion #1522, Issue #833 |

**Bridge 패턴 채택**:

- dnd-kit + TanStack Query 조합에서 커뮤니티 검증된 패턴 (Discussion #1522)
- `setState`는 React 동기 업데이트라 dnd-kit이 transform 제거하는 같은 렌더 사이클에 DOM이 새 순서로 반영
- onDragOver 실시간 리오더를 제거하면서 `dragReadyRef`, `lastOverIdRef`, `requestAnimationFrame` 우회 코드도 함께 제거

**Store 위치**: `dashboardStore`에 추가하는 대신 별도 `dndBridgeStore` 생성. DND bridge는 다른 대시보드 UI 상태(ContentView 라우팅, sidebar sections, previewVersion)와 책임이 다르기 때문.

### Phase 7: 디렉토리 이동

`src/lib/dnd/`의 모든 소비자가 대시보드 컴포넌트뿐이므로 `src/app/dashboard/dnd/`로 이동. 의존 범위와 파일 위치를 일치시킴.

---

## Final Architecture

```
src/app/dashboard/
├── dnd/
│   ├── animate.ts              — sortableAnimateLayoutChanges, defaultDropAnimation
│   ├── types.ts                — DragData, DragContext, DragStrategy
│   └── strategies/
│       ├── index.ts            — dashboardStrategies 배열
│       ├── sidebar-entry-reorder.ts
│       ├── section-reorder.ts
│       └── section-entry-reorder.ts
├── stores/
│   ├── dashboardStore.ts       — ContentView, sidebar, preview
│   └── dndBridgeStore.ts       — tempEntryOrder, tempSectionOrder
├── components/
│   └── DashboardDndProvider.tsx — ~120줄 orchestrator
└── ...

globals.css (@layer utilities)
├── .drag-handle / .drag-handle-hover
├── .drag-source-ghost / .drag-source-hidden / .drag-source-elevated
├── .drag-overlay-card
└── .drop-zone-active
```

**데이터 흐름 (드롭 시):**

```
onDragEnd
  → Strategy.onEnd()
    → useDndBridgeStore.setTempOrder(newIds)   // (1) 동기 Zustand → 즉시 리렌더
    → queryClient.setQueryData(...)             // (2) TQ 캐시 (낙관적)
    → mutation.mutate({ onSettled: clearTemp }) // (3) 서버 + bridge 해제
```

---

## Consequences

### Positive

- 새 드래그 타입 추가: 전략 파일 1개 + index 배열에 추가 (Provider 수정 불필요)
- 드롭 점프 현상 해결 (bridge store)
- onDragOver 우회 코드 3개 제거 (`dragReadyRef`, `lastOverIdRef`, `requestAnimationFrame`)
- DND 스타일 변경 시 CSS 토큰 1곳만 수정
- 전략 함수는 순수 함수에 가까워 단독 테스트 가능

### Negative

- Zustand store 1개 추가 (dndBridgeStore)
- 소비자 컴포넌트(TreeSidebar, PageSectionEditor)에 bridge 구독 코드 추가
- 전략 파일 3개 + types.ts 추가로 파일 수 증가

### Risks

- Bridge store의 temp state가 해제되지 않는 edge case (mutation이 실패하고 onSettled가 호출 안 되는 경우) → onError에서도 clearTemp 호출로 대응
- 추후 dnd-kit이 TanStack Query 통합을 공식 지원하면 bridge가 불필요해질 수 있음

---

## References

- [dnd-kit Discussion #1522 — React Query 드롭 점프 문제](https://github.com/clauderic/dnd-kit/discussions/1522)
- [dnd-kit Issue #833 — Async reordering and drop animation](https://github.com/clauderic/dnd-kit/issues/833)
- [dnd-kit Issue #921 — Sorting not working with react-query](https://github.com/clauderic/dnd-kit/issues/921)
- `docs/DND_STYLE_GUIDE.md` — 토큰 레퍼런스 + 체크리스트
