# Error Boundary + Suspense + TanStack Query 정리

> 2026-02-24 학습 기록. Dashboard 리팩토링 과정에서 정리.

---

## 1. Error Boundary 기본 개념

React 컴포넌트 트리에서 **렌더링 중 throw된 에러**를 캐치하는 메커니즘.
JavaScript의 try-catch와 비슷하지만, **컴포넌트 트리 단위**로 동작한다.

### 캐치하는 것

- 컴포넌트 렌더링 중 에러
- 생명주기 메서드 에러
- 생성자 에러

### 캐치 못 하는 것

- 이벤트 핸들러 (onClick 등) — 이건 try-catch로 처리
- 비동기 코드 (setTimeout, fetch 등)
- 서버 컴포넌트 에러 (Next.js에선 `error.tsx`가 담당)

---

## 2. Next.js의 에러 처리 전략

| 영역                | 처리 방식              | 설명                                       |
| ------------------- | ---------------------- | ------------------------------------------ |
| 서버 컴포넌트       | `error.tsx`            | 라우트 세그먼트별 에러 UI. SSR 에러도 캐치 |
| 클라이언트 컴포넌트 | `react-error-boundary` | 렌더링 중 에러 캐치                        |
| root layout 에러    | `global-error.tsx`     | layout.tsx 자체 에러는 error.tsx로 못 잡음 |

### root layout에 ErrorBoundary를 감싸면?

- 서버 컴포넌트 에러 → **못 잡음** (이미 서버에서 발생)
- 클라이언트 에러 → 잡을 수 있지만 **전체 앱이 fallback**으로 대체 (너무 넓음)
- 결론: root에는 불필요. 각 영역에 맞는 도구를 써야 함

---

## 3. react-error-boundary 라이브러리

React의 Error Boundary는 원래 class component로만 만들 수 있다.
`react-error-boundary`는 이걸 함수형으로 쓸 수 있게 해주는 라이브러리.

### 기존 class component vs react-error-boundary

```tsx
// 기존: class component 직접 구현
class ErrorBoundary extends Component {
    static getDerivedStateFromError(error) { ... }
    componentDidCatch(error, info) { ... }
    render() {
        if (this.state.hasError) return <Fallback />;
        return this.props.children;
    }
}

// react-error-boundary: 선언적
<ErrorBoundary FallbackComponent={ErrorFallback} onReset={...}>
    {children}
</ErrorBoundary>
```

### 핵심 Props

| Prop                | 설명                                                          |
| ------------------- | ------------------------------------------------------------- |
| `FallbackComponent` | 에러 시 보여줄 컴포넌트. `{ error, resetErrorBoundary }` 받음 |
| `onReset`           | `resetErrorBoundary()` 호출 시 실행되는 콜백                  |
| `onError`           | 에러 캐치 시 호출 (로깅 등)                                   |
| `resetKeys`         | 특정 값 변경 시 자동으로 에러 상태 리셋                       |

### FallbackProps 타입

```tsx
type FallbackProps = {
    error: unknown; // Error가 아니라 unknown!
    resetErrorBoundary: (...args: unknown[]) => void;
};
```

`error`가 `unknown`이라서 사용 시 타입 체크 필요:

```tsx
const normalizedError = error instanceof Error ? error : new Error(String(error));
```

---

## 4. Suspense 기본 개념

컴포넌트가 **아직 준비되지 않은 상태**를 React에게 알려주는 메커니즘.
"준비 안 됐으니 잠깐 fallback 보여줘" 라는 뜻.

```tsx
<Suspense fallback={<Skeleton />}>
    <MyComponent /> // 아직 데이터 로딩 중이면 Skeleton 표시
</Suspense>
```

### 동작 원리

1. 자식 컴포넌트가 **Promise를 throw** (React 내부 메커니즘)
2. React가 가장 가까운 `<Suspense>` boundary를 찾음
3. fallback 렌더링
4. Promise 해결되면 다시 자식 렌더링 시도

---

## 5. useQuery vs useSuspenseQuery

### useQuery — 컴포넌트가 직접 상태 관리

```tsx
const { data, isLoading, error } = useQuery({ ... });

if (isLoading) return <Skeleton />;  // 매번 분기
if (error) return <Error />;          // 매번 분기
// data: T | undefined
```

### useSuspenseQuery — React에게 위임

```tsx
const { data } = useSuspenseQuery({ ... });
// 여기 도달 = 로딩 완료 + 에러 없음
// data: T (not T | undefined)
```

### 비교표

|                | useQuery          | useSuspenseQuery                 |
| -------------- | ----------------- | -------------------------------- |
| `isLoading`    | O                 | **없음** (Suspense가 처리)       |
| `error`        | O                 | **없음** (Error Boundary가 처리) |
| `data` 타입    | `T \| undefined`  | `T`                              |
| `enabled` 옵션 | O                 | **없음** (항상 즉시 fetch)       |
| 에러 발생 시   | state로 들고 있음 | **throw** → Error Boundary 캐치  |
| 로딩 중        | state로 들고 있음 | **suspend** → Suspense fallback  |

### initialData가 있으면 Suspense가 안 걸리는 이유

```tsx
useSuspenseQuery({
    queryKey: ['entries'],
    queryFn: fetchEditorData,
    initialData, // SSR에서 이미 데이터 받아옴
});
```

`initialData` 있음 → TanStack Query 캐시에 이미 데이터 존재 → fetch 기다릴 필요 없음 → **suspend 안 함** → Skeleton 안 보임.

`initialData` 없으면 → 캐시 비어있음 → fetch 시작 → **suspend** → Skeleton 보임.

---

## 6. QueryErrorResetBoundary

### 왜 필요한가

`useSuspenseQuery` 에러 → Error Boundary 캐치 → "다시 시도" 클릭
→ Error Boundary state 리셋 → 자식 다시 렌더
→ 근데 **TanStack Query 캐시에 에러가 남아있음** → 즉시 또 에러

### QueryErrorResetBoundary가 해결

```tsx
<QueryErrorResetBoundary>
    {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={ErrorFallback}>
            {children}
        </ErrorBoundary>
    )}
</QueryErrorResetBoundary>
```

1. "다시 시도" → `resetErrorBoundary()` 호출
2. `onReset` → `reset()` 호출 (QueryErrorResetBoundary 제공)
3. **캐시의 에러 상태 클리어**
4. 자식 다시 마운트 → `useSuspenseQuery` → **실제 refetch**

### 필요 조건

- `useSuspenseQuery` 사용 시 **필수**
- `useQuery` 사용 시 불필요 (에러가 throw되지 않으니까)

---

## 7. 적용한 구조

```
layout.tsx (root) — ErrorBoundary 없음
  └─ dashboard/layout.tsx
       └─ QueryProvider
            └─ Background
                 └─ main
                      └─ ErrorBoundaryWithQueryReset  ← 에러 캐치 + query 리셋
                           └─ Suspense                ← 로딩 시 Skeleton
                                └─ page.tsx
                                     └─ useSuspenseQuery ← data: T 확정
```

### 파일 구조

```
src/components/ErrorBoundary.tsx     — 공용 ErrorFallback + ErrorBoundary 래퍼
src/app/dashboard/components/
  ├── ErrorBoundary.tsx              — Dashboard 전용 (QueryErrorResetBoundary 포함)
  └── Skeleton.tsx                   — Suspense fallback용 스켈레톤
```

### 흐름 정리

| 상황                         | 동작                                         |
| ---------------------------- | -------------------------------------------- |
| 초기 로드 (initialData 있음) | Suspense 안 걸림, 바로 렌더                  |
| 초기 로드 (initialData 없음) | Suspense → Skeleton 표시 → fetch 완료 → 렌더 |
| refetch 실패                 | error throw → ErrorBoundary → ErrorFallback  |
| "다시 시도" 클릭             | resetErrorBoundary → QueryReset → refetch    |
