# Field Component Review Checklist

> shared-fields 컴포넌트의 코드 리뷰 체크리스트.
> ImageField 리뷰에서 도출, 향후 모든 필드 컴포넌트에 적용.

## 리뷰 축

### 1. 외부 주입 (Props / DI)

- [ ] `FieldComponentProps<T>` 계약 준수 (`value`, `onChange`, `disabled`)
- [ ] `EditFieldConfig` 으로 저장 전략 제어 (immediate / debounced / schema)
- [ ] 역방향 import 없음 (shared-fields가 detail-views에 의존하면 안 됨)
- [ ] 하드코딩된 의존성 없음 (accept 타입, compression 설정 등 설정 가능해야)
- [ ] ID 생성 책임이 명확 (누가 만들고, 라운드트립 시 유지되는지)

### 2. 검증 (Validation)

- [ ] 입력 경로별 필터 일치 (file input accept === drop 필터 === 서버 검증)
- [ ] schema 검증 실패 시 사용자 피드백 있음 (silent drop 아님)
- [ ] 경계값 처리 (빈 값, 최대값, 최소값)
- [ ] 클라이언트 사전 검증 (파일 크기, 형식 등 서버 호출 전 체크)

### 3. 서버 상태 관리

- [ ] 저장 원자성 (업로드 + 저장이 하나의 트랜잭션이거나, 실패 시 정리)
- [ ] stale closure 위험 없음 (비동기 작업 중 value/onChange 참조 안정성)
- [ ] 실패 시 복구 전략 (부분 성공 반영, retry, 고아 리소스 정리)
- [ ] 동시 조작 안전 (업로드 중 reorder/delete 시 데이터 정합성)

### 4. 컴포넌트 UI

- [ ] 4가지 상태 커버: empty / filled / editing / disabled
- [ ] 스타일 일관성 (카드, overlay, 에러 표시 등 디자인 토큰 사용)
- [ ] 반응형 대응 (모바일 터치, 스크롤, 카드 크기)
- [ ] edit 모드 제어 (내부 상태 vs 외부 제어 — 결정하고 일관되게)

### 5. 로컬 상태

- [ ] 상태 전이 완전성: idle -> loading -> success/error -> idle
- [ ] 부분 실패 처리 (batch 작업 중 일부 실패 시 성공분 보존)
- [ ] 진행률 표현 (단일 boolean vs 개별 항목별 상태)
- [ ] unmount 시 cleanup (in-flight 작업 취소, timer 정리)

### 6. 단위 테스트

- [ ] hook 테스트: 핵심 로직 (upload, delete, replace, maxCount)
- [ ] 컴포넌트 테스트: 상태별 렌더링 (empty, filled, editing, disabled)
- [ ] 이벤트 테스트: DND, drop, file select
- [ ] mock 전략 명확 (server action, 외부 라이브러리)
- [ ] 에러 케이스 커버 (네트워크 실패, 검증 실패, 동시 조작)

### 7. 일관성 / 정합성

- [ ] 설정 중복 없음 (IMAGE_EDIT_CONFIG 같은 상수가 여러 파일에 산재하지 않음)
- [ ] ID 패턴 통일 (생성, 비교, 라운드트립)
- [ ] 에러 표시 패턴 통일 (위치, 스타일, 타이밍)
- [ ] 네이밍 컨벤션 (파일명, export명, props명)

### 8. 접근성 (a11y)

- [ ] interactive 요소에 aria-label 또는 accessible name
- [ ] 키보드 조작 가능 (DND에 KeyboardSensor, 버튼 focus)
- [ ] 상태 변화 알림 (업로드 진행/완료/에러 — aria-live region)
- [ ] file input에 연결된 label

### 9. 동시성 / 경쟁 조건

- [ ] 업로드 중 다른 조작(reorder, delete, 추가 업로드) 시 데이터 안전
- [ ] unmount 시 in-flight 비동기 작업 취소 (AbortController)
- [ ] 빠른 연속 조작 시 최종 상태 정합성

### 10. 성능

- [ ] 불필요한 리렌더 없음 (useCallback deps 안정성)
- [ ] 무거운 연산 병렬화 (순차 → Promise.allSettled 등)
- [ ] 큰 파일 처리 시 UI 블로킹 없음

### 11. 타입 안전

- [ ] non-null assertion (`!`) 없음
- [ ] type cast (`as`) 최소화, 불가피할 경우 주석
- [ ] generic이 올바르게 전파 (EditFieldConfig<T> → children render props)

---

## ImageField 리뷰 결과 (2026-03-06)

### 발견된 이슈 (우선도순)

#### Critical

| #   | 축       | 이슈                                                                | 파일:라인         |
| --- | -------- | ------------------------------------------------------------------- | ----------------- |
| C1  | 로컬상태 | uploadFiles 부분 실패 시 성공분 유실 — catch에서 newItems 버려짐    | useImageUpload:61 |
| C2  | 서버상태 | stale closure — 업로드 중 reorder하면 onChange가 stale value로 호출 | useImageUpload:59 |

#### Major

| #   | 축       | 이슈                                                             | 파일:라인                         |
| --- | -------- | ---------------------------------------------------------------- | --------------------------------- |
| M1  | 일관성   | ID가 라운드트립 안 됨 — hook은 `img_xxx`, caller는 `poster-${i}` | EventDetailView:32                |
| M2  | 검증     | accept 불일치 — input은 jpeg/png/webp, drop은 image/\* 전체      | ImageDropZone:30 vs ImageField:93 |
| M3  | 타입안전 | SaveOptions가 detail-views/types.ts → shared-fields가 역참조     | EditFieldWrapper:9                |
| M4  | 검증     | schema 검증 실패 시 silent drop — 사용자 피드백 없음             | EditFieldWrapper:49               |

#### Minor

| #   | 축       | 이슈                                                               | 파일:라인                          |
| --- | -------- | ------------------------------------------------------------------ | ---------------------------------- |
| m1  | 성능     | immediate 모드에서 useCallback deps에 value 포함 → 매 렌더 재생성  | useImageUpload:67                  |
| m2  | 일관성   | IMAGE_EDIT_CONFIG 동일 객체가 EventDetailView, ImageSection에 중복 | EventDetailView:11, ImageSection:8 |
| m3  | 동시성   | unmount 시 in-flight 업로드 미취소                                 | useImageUpload 전체                |
| m4  | 접근성   | drag handle, action button에 aria-label 없음                       | ImageCard:76-101                   |
| m5  | UI       | DragOverlay 스타일이 ImageCard와 불일치 (border color)             | ImageField:182                     |
| m6  | 타입안전 | `result.data!.posterUrl` non-null assertion                        | useImageUpload:88                  |
| m7  | 성능     | 순차 업로드 (for-of await) — 병렬화 가능                           | useImageUpload:45                  |
