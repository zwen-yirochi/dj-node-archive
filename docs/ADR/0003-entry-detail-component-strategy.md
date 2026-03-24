# ADR-0003: 상세 페이지 컴포넌트 통합/분리 전략

**상태**: 승인됨
**날짜**: 2026-03-17
**관련**: ADR-0002, Custom 블록 뷰 / 범용 렌더러 관계

## 컨텍스트

상세 페이지에는 두 종류의 컴포넌트가 존재한다:

- **범용 렌더러**: `CoverImage`, `MetaTable`, `Description` 등 — Event/Mixset 상세에서 사용
- **Custom 블록 뷰**: `HeaderBlockView`, `ImageBlockView` 등 — Custom 엔트리의 블록 렌더링

일부 컴포넌트가 기능적으로 겹칠 수 있어 통합/분리 기준이 필요했다.

## 분석

| 범용 렌더러   | 블록 뷰             | 관계                                             |
| ------------- | ------------------- | ------------------------------------------------ |
| `CoverImage`  | `ImageBlockView`    | 레이아웃 다름 (히어로 vs 인라인) — 분리 유지     |
| `Description` | `RichtextBlockView` | 기능 동일 — **통합**                             |
| `MetaTable`   | `KeyvalueBlockView` | 용도 다름 (format 옵션 vs 단순 표시) — 분리 유지 |

## 결정

- `Description`과 `RichtextBlockView`는 하나의 컴포넌트(`RichtextBlockView`)로 통합
- 나머지는 분리 유지, 공통 부분이 보이면 향후 통합

### 근거

- 동일 기능을 중복 구현하는 것은 유지보수 부담
- 레이아웃/용도가 다른 컴포넌트를 억지로 합치면 props가 복잡해짐
- 점진적 통합이 과도한 추상화보다 나음

## 향후 확장

- `CoverImage`와 `ImageBlockView`가 공통 이미지 유틸을 공유할 수 있음
- `MetaTable`과 `KeyvalueBlockView`도 사용 패턴이 수렴하면 통합 검토
