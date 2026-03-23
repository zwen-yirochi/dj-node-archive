# Dashboard UI Deep Dive - 분석 설계서

**날짜**: 2026-03-24
**목적**: 대시보드 UI의 시각적 일관성, 정보 구조, 인터랙션 편의성을 종합 분석하여 개선점 도출
**선행 작업**: [Dashboard Flow Deep Dive](../../strategy/dashboard-flow-deep-dive-result.md) — 유저 플로우 갭 분석 완료

---

## 1. 분석 프레임워크

### 1.1 에이전트 구성

| #   | 에이전트                  | 렌즈                 | 핵심 질문                                                          |
| --- | ------------------------- | -------------------- | ------------------------------------------------------------------ |
| 1   | **Visual Auditor**        | 시각적 일관성/완성도 | "이 대시보드가 하나의 디자인 시스템으로 만들어진 것처럼 보이는가?" |
| 2   | **Information Architect** | 정보 구조/가시성     | "유저가 현재 상태와 다음 행동을 3초 안에 파악할 수 있는가?"        |
| 3   | **Interaction Critic**    | 인터랙션 편의성      | "의도한 작업을 최소 마찰로 완료할 수 있는가?"                      |
| 4   | **Critical Reviewer**     | 검증/종합            | "이 발견이 실제 유저 문제인가, 아니면 에이전트의 과잉 해석인가?"   |

### 1.2 실행 순서

```
[0] File Verifier ────── 분석 대상 파일 존재 확인, 누락/이동 파일 보정
         │
         ▼
[1] Visual Auditor ──┐
[2] Info Architect ──┼── 병렬 실행 (각자 전체 대시보드 코드 분석)
[3] Interaction Critic┘
         │
         ▼
[4] Critical Reviewer ── 3명의 결과를 종합 검증 + 4분면 매트릭스 생성
         │
         ▼
   최종 결과 문서 (docs/strategy/dashboard-ui-deep-dive-result.md)
```

**Step 0**: 분석 시작 전, 1.3에 나열된 모든 파일의 존재를 확인한다. 누락되거나 경로가 변경된 파일은 실제 경로로 대체하고, 새로 추가된 관련 파일이 있으면 목록에 포함한다.

### 1.3 분석 대상 파일

모든 에이전트가 동일한 파일셋을 분석:

**TreeSidebar:**

- `src/app/dashboard/components/TreeSidebar/index.tsx`
- `src/app/dashboard/components/TreeSidebar/TreeItem.tsx`
- `src/app/dashboard/components/TreeSidebar/ComponentGroup.tsx`
- `src/app/dashboard/components/TreeSidebar/AccountSection.tsx`

**ContentPanel:**

- `src/app/dashboard/components/ContentPanel/index.tsx`
- `src/app/dashboard/components/ContentPanel/detail-views/EntryDetailView.tsx`
- `src/app/dashboard/components/ContentPanel/detail-views/EventDetailView.tsx`
- `src/app/dashboard/components/ContentPanel/detail-views/MixsetDetailView.tsx`
- `src/app/dashboard/components/ContentPanel/detail-views/LinkDetailView.tsx`
- `src/app/dashboard/components/ContentPanel/detail-views/CustomEntryEditor.tsx`
- `src/app/dashboard/components/ContentPanel/bio-design/BioDesignPanel.tsx`
- `src/app/dashboard/components/ContentPanel/bio-design/HeaderStyleSection.tsx`
- `src/app/dashboard/components/ContentPanel/bio-design/links/LinksSection.tsx`

**Page Section Editor:**

- `src/app/dashboard/components/ContentPanel/page-section-editor/PageSectionEditor.tsx`
- `src/app/dashboard/components/ContentPanel/page-section-editor/SectionCard.tsx`
- `src/app/dashboard/components/ContentPanel/page-section-editor/FeatureSectionCard.tsx`
- `src/app/dashboard/components/ContentPanel/page-section-editor/SectionHeader.tsx`
- `src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryItem.tsx`
- `src/app/dashboard/components/ContentPanel/page-section-editor/SectionEntryList.tsx`
- `src/app/dashboard/components/ContentPanel/page-section-editor/SortableSectionWrapper.tsx`

**Create Forms:**

- `src/app/dashboard/components/ContentPanel/create-forms/CreateEntryPanel.tsx`
- `src/app/dashboard/components/ContentPanel/create-forms/CreateEventForm.tsx`
- `src/app/dashboard/components/ContentPanel/create-forms/CreateMixsetForm.tsx`
- `src/app/dashboard/components/ContentPanel/create-forms/CreateLinkForm.tsx`
- `src/app/dashboard/components/ContentPanel/create-forms/EventImportSearch.tsx`
- `src/app/dashboard/components/ContentPanel/create-forms/EventCreateSection.tsx`

**Shared Fields:**

- `src/app/dashboard/components/ContentPanel/shared-fields/SyncedField.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/TextField.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/DateField.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/image/ImageField.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/image/ImageCard.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/image/ImageDropZone.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/VenueField.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/LinkField.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/EmbedField.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/KeyValueField.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/SearchableTagField.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/IconField.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/LineupField.tsx`
- `src/app/dashboard/components/ContentPanel/shared-fields/SaveIndicator.tsx`

**UI Components:**

- `src/app/dashboard/components/ui/PreviewPanel.tsx`
- `src/app/dashboard/components/ui/CommandPalette.tsx`
- `src/app/dashboard/components/ui/ConfirmDialog.tsx`
- `src/app/dashboard/components/ui/DashboardSettingsModal.tsx`

**Layout & DnD:**

- `src/app/dashboard/components/Dashboard.tsx`
- `src/app/dashboard/components/DashboardDndProvider.tsx`

**Config (참조용 — UI 분석 대상이 아닌 아키텍처 레퍼런스):**

Config 파일은 직접적인 UI 감사 대상이 아니다. 다만 레이블/용어 일관성(I4) 검사 시 하드코딩된 표시 문자열을 확인하는 데 참조한다.

- `src/app/dashboard/config/ui/sidebar.ts`
- `src/app/dashboard/config/ui/menu.ts`
- `src/app/dashboard/config/ui/view-types.tsx`
- `src/app/dashboard/config/entry/entry-types.ts`
- `src/app/dashboard/config/entry/entry-validation.ts`

**Stores:**

- `src/app/dashboard/stores/dashboardStore.ts`
- `src/app/dashboard/stores/dndBridgeStore.ts`

---

## 2. 공통 심각도 척도

모든 에이전트가 동일한 척도를 사용:

| 심각도   | 정의                                           | 예시                                                          |
| -------- | ---------------------------------------------- | ------------------------------------------------------------- |
| **높음** | 유저 에러, 데이터 손실, 또는 핵심 태스크 차단  | 저장 실패 표시 없음, 클릭 타겟 혼동으로 잘못된 항목 삭제      |
| **중간** | 일상적 작업에서 혼란 또는 불필요한 마찰 발생   | 현재 편집 중인 항목이 어디인지 파악 어려움, 빈 상태 안내 부재 |
| **낮음** | 시각적 완성도/일관성 이슈 — 기능적 임팩트 없음 | 아이콘 크기 불일치, border-radius 패턴 예외                   |

---

## 3. 에이전트별 분석 체크리스트

### 3.1 Visual Auditor

| ID  | 검사 항목              | 구체적으로 보는 것                                                                    |
| --- | ---------------------- | ------------------------------------------------------------------------------------- |
| V1  | **컬러 토큰 일관성**   | `dashboard-*` 시맨틱 토큰 vs 하드코딩 컬러 (`text-amber-500`, `bg-stone-900` 등) 혼용 |
| V2  | **타이포그래피 계층**  | 헤더/본문/레이블/플레이스홀더 간 font-size, weight, color 규칙이 패널마다 일관한가    |
| V3  | **간격 시스템**        | px/py/gap/space-y 값이 패턴을 이루는가, 임의 값이 섞여있진 않은가                     |
| V4  | **상태 표현 일관성**   | selected/hover/active/disabled/dragging 상태가 모든 인터랙티브 요소에서 동일 패턴인가 |
| V5  | **아이콘 사용**        | 크기(h-3.5, h-4, h-5), 컬러, lucide 아이콘 선택이 일관한가                            |
| V6  | **빈 상태 디자인**     | 섹션 0개, 엔트리 0개, 프리뷰 로딩 등 빈 상태의 시각적 처리가 통일되어 있는가          |
| V7  | **border/radius 패턴** | rounded 값, border 컬러/opacity가 계층별로 규칙적인가                                 |

**이슈 ID 형식**: VIS-01, VIS-02, ...

### 3.2 Information Architect

| ID  | 검사 항목              | 구체적으로 보는 것                                                                 |
| --- | ---------------------- | ---------------------------------------------------------------------------------- |
| I1  | **현재 위치 인지**     | 유저가 "지금 무엇을 편집 중인지" 즉시 알 수 있는가 (breadcrumb, highlight, 타이틀) |
| I2  | **엔트리 상태 전달**   | 완성도(incomplete), 배치 여부(isInSection), 저장 상태가 명확히 보이는가            |
| I3  | **계층 구조 표현**     | Sidebar의 그룹 -> 엔트리, Page의 섹션 -> 엔트리 계층이 시각적으로 읽히는가         |
| I4  | **레이블/용어 명확성** | "Bio Design", "Page", "Components", "Section" 등 용어가 유저에게 직관적인가        |
| I5  | **정보 밀도**          | 너무 밀집하거나 너무 sparse한 영역이 있는가                                        |
| I6  | **패널 간 관계**       | Sidebar 선택 -> ContentPanel 변경 -> Preview 반영의 관계가 시각적으로 연결되는가   |
| I7  | **숨겨진 기능**        | 메뉴("..."), hover-only 버튼, 드래그 가능 요소 등의 발견 가능성                    |

**이슈 ID 형식**: INFO-01, INFO-02, ...

### 3.3 Interaction Critic

| ID  | 검사 항목               | 구체적으로 보는 것                                                    |
| --- | ----------------------- | --------------------------------------------------------------------- |
| X1  | **핵심 태스크 클릭 수** | 엔트리 생성, 섹션에 배치, 편집, 삭제 각각 몇 클릭인가                 |
| X2  | **피드백 루프**         | 저장, 삭제, 생성, 드래그 후 유저가 "성공했다"를 어떻게 아는가         |
| X3  | **되돌리기 가능성**     | 실수 시 복구 경로가 있는가 (삭제 취소, 드래그 취소 등)                |
| X4  | **키보드 접근성**       | Cmd+K 외에 키보드로 주요 작업이 가능한가, 포커스 트래핑은 올바른가    |
| X5  | **드래그 경험**         | 드래그 시 시각적 피드백, 드롭 타겟 명확성, 취소 방법                  |
| X6  | **폼 경험**             | 자동저장 vs 수동저장 혼용 여부, 유효성 검증 시점, 에러 표시           |
| X7  | **전환 경험**           | 뷰 전환(bio -> page -> detail) 시 애니메이션, 컨텍스트 유지, 뒤로가기 |

**이슈 ID 형식**: INT-01, INT-02, ...

---

## 4. Critical Reviewer 검증 프로토콜

### 4.1 검증 질문 (각 발견사항에 적용)

| #   | 검증 질문                                | "가짜 문제" 판정 기준                              |
| --- | ---------------------------------------- | -------------------------------------------------- |
| R1  | **실제 유저가 이걸 문제로 느끼는가?**    | 개발자 눈에만 보이는 코드 일관성 이슈              |
| R2  | **현재 단계(유저 0-50명)에서 중요한가?** | 스케일 이후에나 의미 있는 문제                     |
| R3  | **기존 설계 의도와 충돌하는가?**         | CLAUDE.md, flow deep dive에서 의도적으로 결정한 것 |
| R4  | **수정 비용 대비 임팩트가 있는가?**      | 대규모 리팩토링 필요한데 임팩트 미미               |
| R5  | **이전 deep dive 발견과 중복되는가?**    | GAP-01~12로 이미 식별된 것                         |

### 4.2 전수 판정 원칙

Critical Reviewer는 Visual Auditor, Information Architect, Interaction Critic이 보고한 **모든 발견사항을 개별적으로** 판정해야 한다. 어떤 발견사항도 묵시적으로 생략할 수 없다. 각 VIS-XX, INFO-XX, INT-XX에 대해 아래 3개 카테고리 중 하나를 배정한다.

### 4.3 판정 카테고리

- **진짜 문제**: 즉시 수정 필요 — 유저 경험을 직접 해침
- **가짜 문제**: 수정 불필요 — 의도된 설계이거나 실제 임팩트 없음
- **데이터 수집 필요**: 판단 보류 — 유저 테스트로 확인 필요

### 4.4 4분면 매트릭스 생성

Critical Reviewer는 "진짜 문제"로 판정된 항목들을 4분면 매트릭스에 배치한다.

- **X축**: 노력 (코드 변경 범위) — 낮은 노력 ← → 높은 노력
- **Y축**: 임팩트 (유저 마찰 감소) — 낮은 임팩트 ← → 높은 임팩트
- **Quick Win**: 높은 임팩트 + 낮은 노력 → 즉시 실행
- **Strategic**: 높은 임팩트 + 높은 노력 → 계획 후 실행
- **Nice to Have**: 낮은 임팩트 + 낮은 노력 → 여유 시
- **Money Pit**: 낮은 임팩트 + 높은 노력 → 하지 말 것 (거부 근거 명시)

### 4.5 이전 deep dive 참조

Critical Reviewer는 아래 항목들의 상태를 인지한다. **코드 검사로 실제 해결 여부를 확인**한 뒤에만 중복으로 분류할 수 있다. "계획됨"과 "코드에서 확인됨"은 구분한다.

- GAP-06: Custom entry title debounce — 코드 확인 필요 (커밋 ee5d783)
- GAP-03: 섹션 삭제 확인 모달 — 코드 확인 필요 (커밋 147bfd1)
- GAP-05: 삭제 후 navigation fallback — 코드 확인 필요 (커밋 5e7b6e5)
- GAP-04: Feature 섹션 엔트리 제거 UI — 코드 확인 필요 (staged, 미커밋)
- GAP-12/IDEA-08: isInSection 시각적 표시 — 코드 확인 필요 (staged, 미커밋)
- GAP-02: 섹션 선택 서브메뉴 (Phase 2 예정 — 미구현)
- IDEA-12: 섹션 가시성 토글 (Phase 2 예정 — 미구현)

---

## 5. 결과물

### 5.1 출력 파일

`docs/strategy/dashboard-ui-deep-dive-result.md`

### 5.2 결과 문서 구조

```markdown
# Dashboard UI Deep Dive 결과

**날짜**: 2026-03-24
**참여 에이전트**: Visual Auditor, Information Architect, Interaction Critic, Critical Reviewer
**범위**: 대시보드 전체 UI (TreeSidebar, ContentPanel, PreviewPanel)

## 1. Visual Auditor 발견사항

| ID | 이슈 | 심각도 | 체크리스트 항목 | 해당 파일:라인 |
(VIS-01 ~ VIS-N)

## 2. Information Architect 발견사항

| ID | 이슈 | 심각도 | 체크리스트 항목 | 해당 파일:라인 |
(INFO-01 ~ INFO-N)

## 3. Interaction Critic 발견사항

| ID | 이슈 | 심각도 | 체크리스트 항목 | 해당 파일:라인 |
(INT-01 ~ INT-N)

## 4. Critical Reviewer 검증

**전수 판정**: 위 1~3 섹션의 모든 발견사항에 대해 개별 판정. 생략 불가.

### 진짜 문제

| ID | 이슈 | 심각도 | 판정 근거 |

### 가짜 문제

| ID | 이슈 | 거부 근거 |

### 데이터 수집 필요

| ID | 이슈 | 측정 방법 |

## 5. 4분면 매트릭스

(Critical Reviewer가 생성. 축: 노력 vs 임팩트)
Quick Win / Strategic / Nice to Have / Money Pit

## 6. 채택 실행 순서

### Phase 1: Quick Win (즉시 실행)

### Phase 2: Strategic (계획 후 실행)

### Phase 3: Nice to Have (여유 시)

## 7. 이전 deep dive와의 관계

| 이전 ID | 현재 ID | 관계 | 비고 |
(중복 / 보완 / 신규)
```

---

## 6. 제약사항

- 코드만 분석 (실제 렌더링된 화면은 보지 않음 — 코드 기반 추론)
- Tailwind 클래스에서 시각적 속성을 역추론
- 기존 아키텍처(4-layer, ContentView discriminated union 등)는 변경 대상이 아님
- 결과물의 "진짜 문제"만이 실행 후보 — "가짜 문제"와 "Money Pit"은 명시적으로 거부
