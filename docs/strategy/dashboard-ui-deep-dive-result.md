# Dashboard UI Deep Dive 결과

**날짜**: 2026-03-24
**참여 에이전트**: Visual Auditor, Information Architect, Interaction Critic, Critical Reviewer
**범위**: 대시보드 전체 UI (TreeSidebar, ContentPanel, PreviewPanel)

---

## 1. Visual Auditor 발견사항

| ID     | 이슈                                                                                                     | 심각도 | 체크리스트 항목 | 해당 파일:라인                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------- | ------ | --------------- | ------------------------------------------------------------------------------------------------- |
| VIS-01 | PreviewPanel이 shadcn 범용 토큰 사용 (`border-border`, `bg-background` 등) — `dashboard-*` 체계와 불일치 | 중간   | V1              | PreviewPanel.tsx:128,132,137,140                                                                  |
| VIS-02 | iPhone 프레임 하드코딩 `bg-stone-900`, `bg-neutral-50`                                                   | 낮음   | V1              | PreviewPanel.tsx:153,159,186-187                                                                  |
| VIS-03 | TreeItem 경고 아이콘 `text-amber-500/70` — `dashboard-warning` 미사용                                    | 낮음   | V1              | TreeItem.tsx:126                                                                                  |
| VIS-04 | SaveIndicator에 `bg-amber-400`, `text-green-500`, `bg-red-500` 하드코딩                                  | 낮음   | V1              | SaveIndicator.tsx:31,34,36; EntryDetailView.tsx:46                                                |
| VIS-05 | 삭제 hover `hover:text-red-400` — `dashboard-danger` 미사용 (5곳)                                        | 중간   | V1, V4          | SectionHeader.tsx:89; FeatureSectionCard.tsx:56,83; SectionEntryItem.tsx:73,117                   |
| VIS-06 | 이미지 에러 `text-red-500` 하드코딩                                                                      | 낮음   | V1              | ImageField.tsx:107,209; ImageCard.tsx:102                                                         |
| VIS-07 | `dashboard-accent` 토큰 tailwind.config에 미정의 — 이미지 편집 모드 스타일 깨짐 가능                     | 높음   | V1              | ImageField.tsx:140,190; ImageDropZone.tsx:72                                                      |
| VIS-08 | 엔트리 제목 font-weight: Custom=`semibold`, 나머지=`bold`                                                | 중간   | V2              | EntryDetailView.tsx:166 vs EventDetailView.tsx:45, MixsetDetailView.tsx:62, LinkDetailView.tsx:79 |
| VIS-09 | 패널 헤더 padding 불일치: BioDesign `px-6 py-5`, Detail `px-6 py-4`, PageSection `px-4 py-3`             | 중간   | V3              | BioDesignPanel.tsx:52; EntryDetailView.tsx:121; PageSectionEditor.tsx:88                          |
| VIS-10 | 패널 헤더 border opacity 불일치: `/50` vs `100%`                                                         | 낮음   | V7              | PageSectionEditor.tsx:88 vs BioDesignPanel.tsx:52, EntryDetailView.tsx:121                        |
| VIS-11 | 패널 헤더 타이포: BioDesign/Create `text-lg`, PageSection `text-sm`, Detail 타이틀 없음                  | 중간   | V2              | BioDesignPanel.tsx:53; CreateEntryPanel.tsx:104; PageSectionEditor.tsx:89                         |
| VIS-12 | 빈 상태 디자인 3가지 패턴 혼재                                                                           | 중간   | V6              | PageSectionEditor.tsx:124-128; CustomEntryEditor.tsx:361-366; SectionEntryList.tsx:129-141        |
| VIS-13 | TreeItem selected `bg-dashboard-bg-active` vs Bio/Page 버튼 `bg-dashboard-bg-active/70`                  | 낮음   | V4              | TreeItem.tsx:105 vs TreeSidebar/index.tsx:91,105                                                  |
| VIS-14 | Sidebar hover opacity 혼용: `/70` vs `100%`                                                              | 낮음   | V4              | TreeSidebar/index.tsx:92,106; ComponentGroup.tsx:43; TreeItem.tsx:106                             |
| VIS-15 | TreeItem `rounded-md` vs Bio/Page `rounded-lg`                                                           | 낮음   | V7              | TreeItem.tsx:103 vs TreeSidebar/index.tsx:89,103                                                  |
| VIS-16 | isInSection `bg-green-500/70` 하드코딩 — `dashboard-success` 미사용                                      | 낮음   | V1              | TreeItem.tsx:116                                                                                  |
| VIS-17 | LinkField 복사 완료 `text-green-500` 하드코딩                                                            | 낮음   | V1              | LinkField.tsx:129                                                                                 |
| VIS-18 | ContentPanel에서 CreateEntryPanel만 `bg-dashboard-bg-card` 적용                                          | 낮음   | V7              | ContentPanel/index.tsx:48,55,62,76; CreateEntryPanel.tsx:90                                       |

---

## 2. Information Architect 발견사항

| ID      | 이슈                                                                        | 심각도 | 체크리스트 항목 | 해당 파일:라인                                               |
| ------- | --------------------------------------------------------------------------- | ------ | --------------- | ------------------------------------------------------------ |
| INFO-01 | EntryDetailView 헤더에 엔트리 타이틀 없음 — 현재 편집 대상 인지 어려움      | 중간   | I1              | EntryDetailView.tsx:121-152                                  |
| INFO-02 | Sidebar 선택 → ContentPanel 시각적 연결 부재 (Untitled 다수 시 혼동)        | 중간   | I6              | EntryDetailView.tsx:121-133                                  |
| INFO-03 | "Components" 라벨이 DJ 유저에게 직관적이지 않음                             | 낮음   | I4              | TreeSidebar/index.tsx:117-118                                |
| INFO-04 | "Bio Design"과 "Page"의 차이가 불명확                                       | 중간   | I4              | TreeSidebar/index.tsx:86-111                                 |
| INFO-05 | isInSection 상태 표시(1.5px dot)가 너무 미약                                | 중간   | I2              | TreeItem.tsx:113-119                                         |
| INFO-06 | Incomplete 경고가 hover시 사라지고 세부 정보 접근 불가                      | 중간   | I2, I7          | TreeItem.tsx:124-127; EntryDetailView.tsx:134-142            |
| INFO-07 | SectionHeader viewType 토글 아이콘에 텍스트 레이블 없음                     | 낮음   | I7              | SectionHeader.tsx:58-78                                      |
| INFO-08 | 섹션 삭제 Trash2 버튼이 Eye 버튼과 동일 시각적 무게로 배치                  | 중간   | I7              | SectionHeader.tsx:87-92; FeatureSectionCard.tsx:81-86        |
| INFO-09 | "Header - Not Implemented" 개발자 메시지 노출 (에이전트 주장)               | 중간   | I4              | HeaderStyleSection.tsx:21-22                                 |
| INFO-10 | Event에만 Source 섹션(Import/Create)이 있고 다른 타입에는 없음              | 낮음   | I5              | EventCreateSection.tsx                                       |
| INFO-11 | Back 버튼이 조건부로만 나타남 — Sidebar 클릭 시 detail에서 나가는 법 불명확 | 중간   | I1              | EntryDetailView.tsx:123-131; dashboardStore.ts:123           |
| INFO-12 | Preview panel 리프레시 중/완료 시각적 인디케이터 없음                       | 낮음   | I6              | PreviewPanel.tsx:87-99                                       |
| INFO-13 | PageSections vs BioDesign 헤더 시각적 무게감 차이                           | 낮음   | I5              | BioDesignPanel.tsx:52-57; PageSectionEditor.tsx:88-89        |
| INFO-14 | Sidebar TreeItem에 drag handle 어포던스 부재                                | 중간   | I7              | TreeItem.tsx:97-109                                          |
| INFO-15 | Sidebar(타입별)와 PageSections(유저 정의) 두 계층 관계 연결 부재            | 높음   | I3              | TreeSidebar/index.tsx:122-153; PageSectionEditor.tsx:134-173 |
| INFO-16 | SaveIndicator(필드)와 HeaderSaveIndicator(헤더) 혼재                        | 낮음   | I2              | EntryDetailView.tsx:29-59; SaveIndicator.tsx                 |

---

## 3. Interaction Critic 발견사항

| ID     | 이슈                                                                                      | 심각도 | 체크리스트 항목 | 해당 파일:라인                                                         |
| ------ | ----------------------------------------------------------------------------------------- | ------ | --------------- | ---------------------------------------------------------------------- |
| INT-01 | 뒤로가기 스택 1단계만 유지 — 깊은 탐색에서 컨텍스트 상실                                  | 중간   | X7              | dashboardStore.ts:81-89                                                |
| INT-02 | `selectHasPreviousView`가 `navigatedFromPageList`만 반환 — Sidebar/CmdK 진입 시 Back 없음 | 높음   | X7              | dashboardStore.ts:123; ContentPanel/index.tsx:67                       |
| INT-03 | 섹션에서 엔트리 제거(X 버튼)에 확인 없이 즉시 실행                                        | 중간   | X3              | SectionEntryItem.tsx:115-119; FeatureSectionCard.tsx:54-59             |
| INT-04 | 엔트리 삭제 후 undo 불가 (toast undo 없음)                                                | 중간   | X3              | TreeItem.tsx:84-89; EntryDetailView.tsx:94-101                         |
| INT-05 | 드래그 취소 방법/피드백 불명확                                                            | 낮음   | X5              | DashboardDndProvider.tsx:96-105                                        |
| INT-06 | 자동저장(detail)과 수동저장(create) 혼용                                                  | 중간   | X6              | SyncedField.tsx; CreateEventForm.tsx:192-209                           |
| INT-07 | Create form에서 Enter 키 전역 차단 — textarea 줄바꿈 등 차단 가능                         | 중간   | X4, X6          | CreateEventForm.tsx:50; CreateMixsetForm.tsx:33; CreateLinkForm.tsx:85 |
| INT-08 | Cmd+K 외 키보드 단축키 없음                                                               | 중간   | X4              | CommandPalette.tsx:26-33; TreeItem.tsx:109                             |
| INT-09 | SectionHeader title input에 save feedback 없음                                            | 중간   | X2, X6          | SectionHeader.tsx:30-34,44-51                                          |
| INT-10 | Custom entry block 삭제에 확인 없음                                                       | 중간   | X3              | CustomEntryEditor.tsx:195,298-302                                      |
| INT-11 | BlockToolbar 드롭다운에 Escape 키 닫기 없음                                               | 낮음   | X4              | CustomEntryEditor.tsx:217-255                                          |
| INT-12 | PageSectionEditor "Add section" 드롭다운에 Escape 키 닫기 없음                            | 낮음   | X4              | PageSectionEditor.tsx:56-65                                            |
| INT-13 | TREE_DELETE confirm이 모든 타입에 EVENT 로직 적용                                         | 낮음   | X2              | config/ui/menu.ts:129-134                                              |
| INT-14 | Preview panel이 slug 아닌 entryId로 URL 구성 — 404 가능                                   | 높음   | X2              | PreviewPanel.tsx:39-43                                                 |
| INT-15 | Links 섹션 재정렬 시 save indicator 없음                                                  | 중간   | X2, X5          | LinksSection.tsx:51-70                                                 |
| INT-16 | EventImportSearch 20개 제한 — 이벤트 많으면 검색 불완전                                   | 중간   | X1              | EventImportSearch.tsx:44-51                                            |
| INT-17 | 뷰 전환 애니메이션이 방향성 없는 fade-in만 사용                                           | 낮음   | X7              | ContentPanel/index.tsx:93                                              |

---

## 4. Critical Reviewer 검증

**전수 판정**: 51개 발견사항 모두 개별 판정 완료.

### 진짜 문제

| ID      | 이슈                                                                                             | 심각도   | 판정 근거                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| INT-14  | Preview가 `entryId`(UUID)로 URL 구성 — public route는 `[slug]` 기반이므로 404 발생               | **높음** | 유저가 entry detail 편집 시 preview 항상 깨짐. `/${username}/${entryId}` vs `/:user/:slug` 불일치. slug 라우팅 전환(commit 01575ca) 이후 regression. |
| VIS-07  | `dashboard-accent` 토큰 tailwind.config에 미정의 — ImageField/ImageDropZone 스타일 깨짐          | **높음** | `border-dashboard-accent`, `text-dashboard-accent` 등 3개 파일에서 사용되나 토큰 정의 없음. 이미지 편집 모드의 UI가 무색으로 렌더.                   |
| INT-02  | `selectHasPreviousView`가 `navigatedFromPageList`만 반환 — Sidebar/CmdK 진입 시 Back 버튼 미노출 | **높음** | Sidebar 클릭 시 `fromPageList` 미전달 → `hasPreviousView = false` → Back 버튼 없음. detail view에 갇힌 느낌.                                         |
| VIS-05  | 삭제 hover `hover:text-red-400` — `dashboard-danger`(red-500) 미사용 (5곳)                       | **중간** | 토큰 체계 위반. 5개 파일 일괄 수정으로 해결 가능(낮은 노력).                                                                                         |
| INFO-01 | EntryDetailView 헤더에 엔트리 타이틀 없음                                                        | **중간** | TypeBadge + SaveIndicator만 있고 entry.title 미표시. Untitled 다수 시 편집 대상 인지 어려움.                                                         |
| INFO-05 | isInSection 상태 표시(1.5px dot)가 너무 미약                                                     | **중간** | GAP-12/IDEA-08 초기 구현은 완료되었으나 dot 크기가 작아 실효성 의문.                                                                                 |
| INFO-08 | 섹션 삭제 Trash2와 Eye 버튼 동일 시각적 무게                                                     | **중간** | 파괴적 행위의 시각적 구분 부재. confirm dialog(GAP-03)는 추가됐지만 버튼 자체의 위험 신호 없음.                                                      |
| INT-06  | 자동저장(detail)과 수동저장(create) 혼용                                                         | **중간** | 동일 필드가 맥락에 따라 다르게 동작. 0-50 단계에서는 허용 가능하나 인지 부하 존재.                                                                   |
| INT-07  | Create form Enter 키 전역 차단                                                                   | **중간** | 현재 create form에 textarea 없으므로 실제 영향 제한적. 향후 위험.                                                                                    |
| INT-09  | SectionHeader title input에 save feedback 없음                                                   | **중간** | `onBlur` → mutation 호출 후 성공/실패 피드백 없음.                                                                                                   |
| INFO-15 | Sidebar/PageSections 두 계층 관계 연결 부재                                                      | **중간** | isInSection dot으로 부분 해결 중. 근본적으로 두 분류 체계가 다른 것은 의도된 설계. 1회 학습으로 충분. 높음→중간 하향.                                |
| INT-03  | 섹션에서 엔트리 제거에 확인 없음                                                                 | **중간** | 비파괴적 행위(배치 해제)이므로 confirm 대신 undo toast가 적절.                                                                                       |

### 가짜 문제

| ID      | 이슈                             | 거부 근거                                                                         |
| ------- | -------------------------------- | --------------------------------------------------------------------------------- |
| VIS-01  | PreviewPanel shadcn 토큰         | R3: 미리보기 프레임은 dashboard 작업 영역이 아님. 범용 토큰 사용이 적절.          |
| VIS-02  | iPhone 프레임 하드코딩           | R3: 물리적 디바이스 프레임은 토큰 대상 아님. 의도적 하드코딩.                     |
| VIS-03  | TreeItem amber-500/70            | R4: `dashboard-warning`(amber-500)과 `/70` opacity 차이뿐. 시각적 차이 미미.      |
| VIS-04  | SaveIndicator 하드코딩           | R4: `dashboard-success/warning/danger`와 동일값. 유저 경험 변화 0.                |
| VIS-06  | ImageField red-500               | R1: `dashboard-danger`와 동일값(red-500). 시각적 차이 0.                          |
| VIS-08  | Custom=semibold, 나머지=bold     | R3: Custom은 편집 가능 input이므로 semibold 의도적 구분 가능.                     |
| VIS-10  | border opacity 50% vs 100%       | R1: 독립 뷰에서 인지 불가.                                                        |
| VIS-13  | selected bg opacity 차이         | R3: TreeItem(child)과 top-level nav의 의도적 시각 계층.                           |
| VIS-14  | hover opacity 혼용               | R3: 시각적 계층 유지를 위한 의도적 차이.                                          |
| VIS-15  | rounded-md vs rounded-lg         | R3: dense list vs top-level 버튼의 의도적 차이.                                   |
| VIS-16  | isInSection green-500/70         | R5: GAP-12 초기 구현. 토큰화는 후속 작업.                                         |
| VIS-17  | LinkField green-500              | R4: 일시적 피드백 1곳. `dashboard-success`와 동일값.                              |
| VIS-18  | CreateEntryPanel만 bg-card       | R3: 생성 패널 강조를 위한 의도적 차별화.                                          |
| VIS-12  | 빈 상태 3패턴 혼재               | R2: 0-50 단계에서 empty state 통일은 낮은 우선순위. 기능적 문제 없음.             |
| VIS-09  | 패널 헤더 padding 불일치         | R1: 독립 뷰에서 나란히 보이지 않음. 인지 부하 미미.                               |
| VIS-11  | 패널 헤더 타이포 불일치          | R1: VIS-09와 동일 논리.                                                           |
| INFO-03 | "Components" 라벨                | R2: 10px uppercase 보조 텍스트. 유저는 하위 그룹명으로 인식.                      |
| INFO-04 | Bio Design vs Page 구분          | R2: 1회 학습으로 충분. 구조적으로 분리된 관심사.                                  |
| INFO-07 | viewType 토글 레이블 없음        | R4: `title` attribute로 hover tooltip 제공.                                       |
| INFO-09 | "Not Implemented" 노출           | 코드에서 해당 문자열 미발견. 이전 deep dive GAP-09에서 가짜 문제 판정 완료. 오탐. |
| INFO-10 | Event만 Import 있음              | R3: Import는 Event 전용 설계. 다른 타입은 직접 생성이 자연스러움.                 |
| INFO-12 | Preview 리프레시 인디케이터 없음 | R5: GAP-10에서 "과잉" 판정. postMessage로 즉시 반영.                              |
| INFO-13 | 헤더 무게감 차이                 | VIS-09/VIS-11과 중복.                                                             |
| INFO-16 | SaveIndicator 이중 표시          | R3: field-level과 page-level 스코프가 다름. 올바른 분리.                          |
| INT-01  | 뒤로가기 스택 1단계              | R3: flat structure 의도. `goBack` fallback이 항상 안전.                           |
| INT-04  | 삭제 undo 없음                   | R2: confirm dialog(GAP-03) 추가 완료. 이중 안전장치는 과잉.                       |
| INT-05  | 드래그 취소 피드백 없음          | R1: dnd-kit Escape 기본 지원. `drag-source-ghost` CSS 처리 중.                    |
| INT-11  | BlockToolbar Escape 없음         | Radix 기반 Escape 기본 지원. 오탐.                                                |
| INT-12  | Add section Escape 없음          | R1: click-outside로 닫힘. 실제 불편 미미.                                         |
| INT-13  | 전타입 EVENT confirm             | R3: 모든 삭제에 동일 confirm이 오히려 일관적.                                     |
| INT-17  | fade-in 방향성 없음              | R2: 0-50 단계에서 directional animation은 과잉 polish.                            |

### 데이터 수집 필요

| ID      | 이슈                                  | 측정 방법                                                 |
| ------- | ------------------------------------- | --------------------------------------------------------- |
| INFO-02 | Sidebar→ContentPanel 시각적 연결 부재 | 유저 5명: "Untitled" 5개 이상 생성 후 편집 대상 혼동 빈도 |
| INFO-06 | Incomplete 경고 hover시 사라짐        | warning icon → menu icon 교체 시 유저 인지 실패 빈도      |
| INFO-11 | Back 버튼 조건부 노출                 | INT-02와 연관. sidebar 재클릭 학습 여부 테스트            |
| INFO-14 | Sidebar TreeItem drag handle 부재     | 유저가 drag 가능을 인지하는지 테스트                      |
| INT-08  | Cmd+K 외 키보드 단축키 없음           | 0-50 단계 파워 유저 비율 및 단축키 요청 빈도              |
| INT-10  | Custom block 삭제 확인 없음           | block 삭제 빈도 및 실수 복구 요청 빈도                    |
| INT-15  | Links 재정렬 save indicator 없음      | mutation 호출 후 피드백 부재 체감 여부                    |
| INT-16  | EventImportSearch 20개 제한           | 현재 DB 내 이벤트 수 확인. 20개 이상 존재 여부            |

---

## 5. 4분면 매트릭스

```
                        높은 임팩트
                            |
         Quick Win          |         Strategic
         (즉시 실행)         |         (계획 후 실행)
                            |
  INT-14 (preview slug)     |  INT-02 (Back 버튼 로직)
  VIS-07 (accent 토큰)      |    + INFO-11 (navigation)
  VIS-05 (danger 토큰 5곳)  |
  INFO-08 (삭제 버튼 구분)   |  INT-06 (저장 모델 통일)
                            |
  --------------------------+----------------------------
                            |
         Nice to Have       |        Money Pit
         (여유 시)           |        (하지 말 것)
                            |
  INFO-01 (헤더에 타이틀)    |  VIS-09/11 (패널 헤더 통일)
  INT-09 (section title     |    -> 독립 뷰라 ROI 낮음
    save feedback)          |
  INT-03 (remove undo toast)|  VIS-01 (PreviewPanel 토큰)
  INFO-05 (dot 크기 개선)    |    -> 의도적 분리
  INT-07 (Enter 키 차단)    |
                            |
                        낮은 임팩트
  낮은 노력 <──────────────────────────> 높은 노력
```

### Money Pit 거부 근거

| 아이디어                      | 거부 사유                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| VIS-09/11 패널 헤더 통일      | 각 패널은 독립 뷰이며 나란히 보이지 않음. 4개 패널 padding/typography 통일은 높은 노력 대비 유저 인지 변화 미미. |
| VIS-01 PreviewPanel 토큰 통일 | Preview 프레임은 dashboard 작업 영역과 의도적으로 분리. shadcn 범용 토큰이 더 적절.                              |

---

## 6. 채택 실행 순서

### Phase 1: Critical Fixes (즉시, 1일)

| #   | 작업                                                                                        | 예상 | 해결    |
| --- | ------------------------------------------------------------------------------------------- | ---- | ------- |
| 1   | **PreviewPanel: entryId -> slug 변환** — `useEntries()`에서 entry.slug 조회하여 URL 구성    | 30분 | INT-14  |
| 2   | **tailwind.config.ts: `dashboard.accent` 토큰 추가** 또는 ImageField에서 기존 토큰으로 교체 | 15분 | VIS-07  |
| 3   | **`hover:text-red-400` -> `hover:text-dashboard-danger`** 5개 파일 일괄 교체                | 15분 | VIS-05  |
| 4   | **SectionHeader Trash2 버튼에 `hover:text-dashboard-danger` + 좌측 separator 추가**         | 15분 | INFO-08 |

### Phase 2: UX Improvements (1-2일)

| #   | 작업                                                                               | 예상  | 해결             |
| --- | ---------------------------------------------------------------------------------- | ----- | ---------------- |
| 5   | **Back 버튼 로직 개선** — `selectHasPreviousView`를 `previousView !== null`로 변경 | 1시간 | INT-02 + INFO-11 |
| 6   | **EntryDetailView 헤더에 entry.title 표시**                                        | 30분  | INFO-01          |
| 7   | **SectionHeader title에 SaveIndicator 추가**                                       | 30분  | INT-09           |

### Phase 3: Nice to Have (여유 시)

| #   | 작업                                | 해결    |
| --- | ----------------------------------- | ------- |
| 8   | isInSection dot 크기/스타일 개선    | INFO-05 |
| 9   | 섹션 엔트리 제거에 undo toast       | INT-03  |
| 10  | Create form Enter 키 차단 범위 축소 | INT-07  |
| 11  | Create form -> auto-save 전환 검토  | INT-06  |

---

## 7. 이전 deep dive와의 관계

| 신규 ID | 이전 GAP/IDEA  | 관계            | 비고                                                                  |
| ------- | -------------- | --------------- | --------------------------------------------------------------------- |
| INT-14  | 신규           | **신규 발견**   | slug 라우팅 전환(commit 01575ca) 이후 regression. 가장 높은 우선순위. |
| VIS-07  | 신규           | **신규 발견**   | 디자인 토큰 — 이전 deep dive 범위 밖.                                 |
| INT-02  | GAP-05 관련    | **별개 이슈**   | GAP-05는 삭제 후 빈 상태. INT-02는 일반 navigation Back 버튼 부재.    |
| INFO-01 | 신규           | **신규 발견**   | 헤더 타이틀 부재.                                                     |
| INFO-05 | GAP-12/IDEA-08 | **중복**        | staged 코드 초기 구현 완료. dot 크기 개선은 후속.                     |
| INFO-08 | GAP-03         | **보완**        | confirm dialog는 완료. 버튼 시각적 위험 신호 추가가 보완적.           |
| INFO-15 | 신규           | **데이터 필요** | isInSection(IDEA-08)으로 부분 해결 중.                                |
| INT-06  | IDEA-06        | **관련**        | "Saved just now" 텍스트가 부분 해결. create->auto-save는 큰 리팩토링. |
| INT-09  | IDEA-06        | **관련**        | SectionHeader는 SyncedField 미사용. SaveIndicator 적용으로 해결.      |
| VIS-05  | 신규           | **신규 발견**   | 토큰 일관성 — 이전 deep dive 범위 밖.                                 |
