# Dashboard 리팩토링 정리

> `refactor/error-boundary-suspense` 브랜치 전체 작업 정리.
> 2026-02 진행. 커밋 30+개, Phase 1~5.

---

## 목차

1. [리팩토링 전 문제점](#1-리팩토링-전-문제점)
2. [Phase별 작업 요약](#2-phase별-작업-요약)
3. [핵심 아키텍처 결정](#3-핵심-아키텍처-결정)
4. [4-Layer 아키텍처](#4-4-layer-아키텍처)
5. [상태 관리 구조](#5-상태-관리-구조)
6. [Mutation 패턴](#6-mutation-패턴)
7. [Config 중심 설계](#7-config-중심-설계)
8. [Error Boundary + Suspense](#8-error-boundary--suspense)
9. [최종 파일 구조](#9-최종-파일-구조)
10. [삭제된 것들](#10-삭제된-것들)

---

## 1. 리팩토링 전 문제점

### 상태 관리

- **3개 Zustand 스토어**가 서버 상태(entries, user)와 UI 상태를 혼재
- `useComponentStore` → entries 데이터를 Zustand에서 관리, mutation 후 수동 동기화
- `useUserStore` → user 데이터를 별도 Zustand에서 관리, TanStack Query의 EditorData와 이중 관리
- Mutation 후 `updateEntry()`, `updateUser()`로 수동 캐시 업데이트 필요

### API Layer

- Route 파일에 비즈니스 로직 + Supabase 직접 호출이 인라인 (Fat Route)
- 일부 route에서 수동 `supabase.auth.getUser()` 인증 (withAuth 미사용)
- Result 패턴 불일치: `result.success` vs `result.ok` vs `isSuccess(result)`
- Response 형식 불일치: raw `NextResponse.json` vs response helpers

### 컴포넌트

- 단일 파일에 에디터 + 폼 + 비즈니스 로직이 혼재 (BioDesignPanel: 500줄+)
- `useQuery` 사용으로 매 컴포넌트에서 `isLoading`/`error` 분기 반복
- 인덱스 기반 React key로 인한 배열 필드 입력 손실

### 검증

- Server Action + Supabase 직접 호출이 혼재 (일부는 API route, 일부는 Server Action)
- Zod 스키마가 API 핸들러와 클라이언트에서 각각 별도 정의

---

## 2. Phase별 작업 요약

### Phase 1: 기반 전환

| 커밋      | 작업                                                            |
| --------- | --------------------------------------------------------------- |
| `f8bea97` | `useQuery` → `useSuspenseQuery` 전환 + ErrorBoundary + Suspense |
| `4a2e7e6` | use-entries 훅을 dashboard/hooks/로 이동                        |
| `95dcdc0` | entry detail GET API 추가                                       |
| `1d2788b` | PagePanel 래퍼 + EntryDetailView 추출                           |
| `336123e` | hooks API layer + editors 추출 + 편집 단순화                    |

**핵심**: `useSuspenseQuery`로 전환하면서 `data: T | undefined` → `data: T` 확정. 각 컴포넌트에서 로딩/에러 분기 제거. ErrorBoundary가 에러를 캐치하고 Suspense가 로딩을 처리.

### Phase 2: 구조 정리 + Config 중심 설계

| 커밋      | 작업                                                  |
| --------- | ----------------------------------------------------- |
| `96a2074` | entry config 통합 + TypeBadge 교체                    |
| `dc5b712` | 3개 스토어 → 1개 병합 + discriminated union 라우팅    |
| `11c2e4e` | config 분리 (entry/field/menu/workflow) + 선언적 메뉴 |
| `71ecbec` | 도메인 내부 co-location + constants → config 리네이밍 |
| `fb43982` | 스토어 API 단순화 — 편의 래퍼 + dead code 제거        |

**핵심**: 3개 Zustand 스토어(`componentStore` + `viewStore` + `pageStore`)를 단일 `useDashboardStore`로 병합. `ContentView` discriminated union으로 라우팅 단일화. Config 파일 4개로 선언적 설정 분리.

### Phase 3: 안정성 + Zod 통합 + 컴포넌트 분리

| 커밋      | 작업                                              |
| --------- | ------------------------------------------------- |
| `e5fbfc6` | 런타임 안전성 강화 + mutation 에러 피드백         |
| `80fa56a` | event base fields 추출 + passthrough 제거         |
| `9f6c1f1` | 불필요한 `as` 타입 단언 제거                      |
| `e11b987` | EntryDetailView debounced save 레이스 컨디션 수정 |
| `a65ff9f` | BioDesignPanel 분리 + useCreateEventForm 추출     |

**핵심**: Zod 스키마를 `entry.schemas.ts` 단일 출처로 통합. BioDesignPanel을 500줄에서 분리(BioDesignPanel + AvatarUpload + HeaderStyleSection). debounced save에서 snapshot 갈아치기 버그 수정.

### Phase 4: TanStack Query 최적화 + Zustand 정리

| 커밋                  | 작업                                                     |
| --------------------- | -------------------------------------------------------- |
| `ee290f9` + `27cb736` | userStore → TanStack Query 마이그레이션                  |
| `b8bf448`             | 인덱스 기반 key → stable key (useArrayField)             |
| `e9922a5`             | PreviewPanel useEffect 통합                              |
| `5e7064b`             | 한국어 validation 메시지 표준화                          |
| `4858508`             | Zustand devtools + named selectors                       |
| `88451a5`             | staleTime 축소 + user mutation blanket invalidation 제거 |
| `24e4ca3`             | `.optional().default()` → `.default()` 정리              |

**핵심**: `useUserStore` 완전 삭제. user 데이터는 `useEditorData().data.user`에서 파생. `useUser()` + `useUserMutations()` 훅으로 접근. 아바타 업로드/삭제를 API route로 이관(4-layer 준수). Zustand devtools 미들웨어 추가.

### Phase 5: API Route 4-Layer 정리

| 커밋      | 작업                                                                          |
| --------- | ----------------------------------------------------------------------------- |
| `a8f6020` | pages/[id] route → handler + query 분리                                       |
| `2ebef73` | venues route → handler + withAuth 전환                                        |
| `960e2c2` | artists/events route — isSuccess + withAuth + response helpers                |
| `30a3c9b` | handler barrel export 정리 + dead entries action 삭제                         |
| (미커밋)  | search routes response helpers + display-entry dead code 삭제 + barrel export |

**핵심**: Fat route → thin route 원칙 적용. 모든 인증된 route에 `withAuth` 적용. `result.success`(잘못된 프로퍼티) 버그 수정. `venue_references`(잘못된 테이블) slug 체크 버그 수정.

---

## 3. 핵심 아키텍처 결정

### 서버 상태: TanStack Query (Zustand 아님)

```
❌ Before: Zustand에서 entries + user 관리, mutation 후 수동 setState
✅ After:  TanStack Query 캐시가 단일 진실 출처, Zustand는 UI 상태만
```

**이유**: 서버 상태를 Zustand에서 관리하면 캐시 무효화, 낙관적 업데이트, 재검증을 수동 구현해야 한다. TanStack Query는 이를 선언적으로 제공.

### UI 라우팅: Discriminated Union (문자열 플래그 아님)

```
❌ Before: activePanel + selectedEntryId + createPanelType → 3개 필드 조합으로 상태 결정
✅ After:  contentView: { kind: 'detail', entryId: string } → 단일 필드로 상태 확정
```

**이유**: 불가능한 상태 조합을 타입 레벨에서 방지. 예: `activePanel: 'create'`인데 `selectedEntryId`가 남아있는 상황.

### Config 중심: 선언적 설정 (조건문 산재 아님)

```
❌ Before: if (type === 'event') ... else if (type === 'mixset') ... 반복
✅ After:  ENTRY_TYPE_CONFIG[type].label, ENTRY_SCHEMAS[type][tier].safeParse(entry)
```

**이유**: 새 엔트리 타입 추가 시 config에 한 줄 추가로 완료. 조건문이 파일 곳곳에 흩어지지 않음.

### useSuspenseQuery: 로딩/에러를 React에게 위임

```
❌ Before: const { data, isLoading, error } = useQuery(...) → 매번 3-way 분기
✅ After:  const { data } = useSuspenseQuery(...) → data: T 확정, Suspense가 로딩 처리
```

**이유**: 보일러플레이트 제거 + 에러 처리 일원화. initialData가 있으면 suspend 안 함.

---

## 4. 4-Layer 아키텍처

```
Client (hooks, Zustand)
  ↓ fetch
Route (app/api/**/route.ts) — withAuth만 적용, 1-3줄
  ↓ 위임
Handler (lib/api/handlers/) — Parse → Validate → Verify → Logic → DB → Response
  ↓ 호출
Database (lib/db/queries/) — 순수 DB 쿼리, Result<T> 반환
```

### 레이어별 책임

| 레이어       | 하는 것                                | 하지 않는 것                         |
| ------------ | -------------------------------------- | ------------------------------------ |
| **Database** | Supabase 쿼리, `Result<T>` 반환        | 비즈니스 로직, 인증                  |
| **Handler**  | 파싱, 검증, 소유권 확인, 비즈니스 로직 | DB 직접 접근(쿼리 함수 호출), 라우팅 |
| **Route**    | `withAuth` 적용, handler 호출          | 비즈니스 로직, DB 접근               |
| **Client**   | TQ mutation, 낙관적 업데이트, UI 상태  | 서버 로직                            |

### Result<T> 패턴

```typescript
// Database layer에서 반환
type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

// success(), failure() 생성자 사용
return success(data);
return failure(createDatabaseError(error.message, 'functionName', error));

// Handler에서 확인
if (!isSuccess(result)) return internalErrorResponse(result.error.message);
```

### Response Helpers

```typescript
successResponse(data, 201); // { success: true, data }
notFoundResponse('이벤트'); // { success: false, error: { code: 'NOT_FOUND', ... } }
forbiddenResponse();
validationErrorResponse('필드명');
internalErrorResponse('메시지');
errorResponse({ code, message, status }); // 커스텀 에러 (CONFLICT 등)
```

---

## 5. 상태 관리 구조

### Zustand: UI 상태만

```typescript
// dashboardStore.ts — 단일 스토어
type ContentView =
    | { kind: 'bio' }
    | { kind: 'page' }
    | { kind: 'page-detail'; entryId: string }
    | { kind: 'create'; entryType: EntryType }
    | { kind: 'detail'; entryId: string };

interface DashboardStore {
    contentView: ContentView; // 현재 보고 있는 패널
    sidebarSections: SidebarSections; // 사이드바 접힘 상태
    previewVersion: number; // 프리뷰 새로고침 트리거
    setView;
    triggerPreviewRefresh;
    toggleSection;
    reset;
}

// devtools 미들웨어로 액션 추적
// 5개 named selector로 참조 안정성 보장
export const selectContentView = (s: DashboardStore) => s.contentView;
export const selectSetView = (s: DashboardStore) => s.setView;
// ...
```

### TanStack Query: 서버 상태

```typescript
// use-editor-data.ts
const entryKeys = {
    all: ['entries'] as const,
    detail: (id: string) => ['entries', id] as const,
};

// EditorData = { user: User; contentEntries: ContentEntry[]; pageId: string | null }
function useEditorData(initialData?: EditorData) {
    return useSuspenseQuery({
        queryKey: entryKeys.all,
        queryFn: fetchEditorData,
        staleTime: 60_000, // 1분
        initialData, // SSR 데이터로 suspend 방지
    });
}

// use-user.ts — EditorData에서 파생
function useUser() {
    const { data } = useEditorData();
    return data.user;
}
```

### 데이터 흐름

```
[서버]
page.tsx (Server Component)
  └─ fetchEditorData() → SSR에서 user + entries + pageId 가져옴

[클라이언트]
StoreInitializer
  ├─ useEditorData(initialData) → TQ 캐시에 SSR 데이터 주입
  └─ useDashboardStore.reset() → UI 상태 초기화

컴포넌트들
  ├─ useEditorData() → { user, contentEntries, pageId }
  ├─ useUser() → user (EditorData에서 파생)
  ├─ useEntryDetail(id) → 개별 entry (리스트 캐시에서 초기값)
  └─ useDashboardStore(selectContentView) → UI 라우팅
```

---

## 6. Mutation 패턴

### makeOptimisticMutation 팩토리

```typescript
// optimistic-mutation.ts
function makeOptimisticMutation<TVariables>(config: {
    mutationFn: (vars: TVariables) => Promise<unknown>;
    onOptimisticUpdate: (prev: EditorData, vars: TVariables) => EditorData;
    triggersPreview?: boolean;
}) {
    return {
        mutationFn: config.mutationFn,
        onMutate: async (vars) => {
            await queryClient.cancelQueries({ queryKey: entryKeys.all });
            const snapshot = queryClient.getQueryData<EditorData>(entryKeys.all);
            queryClient.setQueryData(entryKeys.all, (prev) =>
                prev ? config.onOptimisticUpdate(prev, vars) : prev
            );
            return { snapshot };
        },
        onError: (_, __, context) => {
            if (context?.snapshot) queryClient.setQueryData(entryKeys.all, context.snapshot);
        },
        onSuccess: () => {
            if (config.triggersPreview) triggerPreviewRefresh();
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: entryKeys.all });
        },
    };
}
```

### 8개 Entry Mutations (use-mutations.ts)

| Mutation          | 동작                   | triggersPreview            |
| ----------------- | ---------------------- | -------------------------- |
| create            | 새 entry 추가          | ✅                         |
| update            | entry 수정 (debounced) | 조건부 (FIELD_CONFIG 확인) |
| remove            | entry 삭제             | 조건부 (canAddToView)      |
| addToDisplay      | Page에 추가            | ✅                         |
| removeFromDisplay | Page에서 제거          | ✅                         |
| toggleVisibility  | 공개/비공개 토글       | ✅                         |
| reorder           | 섹션 내 순서 변경      | ❌                         |
| reorderDisplay    | Page 내 순서 변경      | ✅                         |

### User Mutations (use-user.ts)

| Mutation      | 패턴                                                             |
| ------------- | ---------------------------------------------------------------- |
| updateProfile | `onSuccess`로 서버 확정 데이터 캐시 업데이트 (invalidation 없음) |
| uploadAvatar  | 응답의 `avatarUrl`로 캐시 직접 업데이트                          |
| deleteAvatar  | `onMutate` 낙관적(`avatarUrl: ''`) + `onError` 롤백              |

**User mutation은 `entryKeys.all` invalidation 안 함** — user 변경이 entries 데이터에 영향 없으므로.

---

## 7. Config 중심 설계

### 파일 역할

| 파일                  | 역할                                     | 소비자                                      |
| --------------------- | ---------------------------------------- | ------------------------------------------- |
| `entryConfig.ts`      | EntryType 정의 + 뱃지/라벨               | TypeBadge, CreateEntryPanel, dashboardStore |
| `entryFieldConfig.ts` | 필드 메타 + Zod 레지스트리 + 완성도 판단 | TreeItem, TreeSidebar, use-mutations        |
| `menuConfig.ts`       | 에디터 메뉴 선언 + 런타임 resolve        | EntryDetailView                             |
| `workflowOptions.ts`  | 생성/발행 옵션                           | CreateEventForm, CreateEntryPanel           |
| `entry.schemas.ts`    | Zod 스키마 (유일한 정의)                 | API 핸들러, RHF resolver, 완성도 판단       |

### 완성도 판단 흐름

```
entry.schemas.ts (Zod 스키마 정의)
    ↓
entryFieldConfig.ts (ENTRY_SCHEMAS 레지스트리)
    ↓
canCreate(entry)     → 생성 최소 조건 충족?
canAddToView(entry)  → Page 추가 조건 충족?
getMissingFieldLabels(entry, tier) → 부족한 필드 이름 목록
```

---

## 8. Error Boundary + Suspense

```
dashboard/layout.tsx
  └─ QueryProvider
       └─ ErrorBoundaryWithQueryReset    ← QueryErrorResetBoundary + ErrorBoundary
            └─ Suspense fallback={Skeleton}
                 └─ page.tsx
                      └─ useSuspenseQuery  ← data: T 확정
```

### 왜 QueryErrorResetBoundary가 필요한가

`useSuspenseQuery` 에러 → ErrorBoundary 캐치 → "다시 시도" 클릭
→ ErrorBoundary 리셋 → **TQ 캐시에 에러가 남아있음** → 즉시 또 에러

`QueryErrorResetBoundary`의 `reset()`이 캐시 에러 상태를 클리어해서 실제 refetch 가능.

### initialData가 있으면 Suspense가 안 걸리는 이유

SSR에서 `page.tsx`가 `fetchEditorData()`로 데이터를 가져옴
→ `StoreInitializer`에서 `initialData`로 `useEditorData`에 전달
→ TQ 캐시에 이미 데이터 존재 → suspend 안 함 → Skeleton 안 보임

---

## 9. 최종 파일 구조

```
src/app/dashboard/
├── page.tsx                     SSR: EditorData fetch → StoreInitializer
├── layout.tsx                   QueryProvider + ErrorBoundary + Suspense
│
├── config/
│   ├── entryConfig.ts           EntryType + 뱃지/라벨
│   ├── entryFieldConfig.ts      필드 메타 + 스키마 레지스트리 + 완성도
│   ├── menuConfig.ts            선언적 메뉴 액션
│   └── workflowOptions.ts       생성/발행 옵션
│
├── stores/
│   └── dashboardStore.ts        ContentView + sidebar + previewVersion (devtools)
│
├── lib/
│   └── previewTrigger.ts        shouldTriggerPreview (FIELD_CONFIG 기반)
│
├── hooks/
│   ├── index.ts                 barrel export
│   ├── use-editor-data.ts       entryKeys + useEditorData + useEntryDetail
│   ├── use-mutations.ts         8개 entry mutation
│   ├── use-user.ts              useUser + useUserMutations
│   ├── optimistic-mutation.ts   mutation 팩토리
│   ├── entries.api.ts           순수 fetch (mutation용)
│   ├── use-array-field.ts       배열 CRUD + stable key
│   └── use-create-event-form.ts RHF + 이벤트 폼 로직
│
├── actions/
│   └── upload.ts                포스터 업로드 Server Action
│
├── components/
│   ├── StoreInitializer.tsx     SSR data → TQ 캐시 + 스토어 초기화
│   ├── ErrorBoundary.tsx        QueryErrorResetBoundary + ErrorBoundary
│   ├── Skeleton.tsx             Suspense fallback
│   ├── PreviewPanel.tsx         iframe 프리뷰 (previewVersion 구독)
│   │
│   ├── TreeSidebar/
│   │   ├── index.tsx            DnD + 섹션 네비게이션
│   │   ├── TreeItem.tsx         엔트리 행 + 완성도 아이콘
│   │   ├── ViewSection.tsx      Page 섹션
│   │   ├── SectionItem.tsx      접이식 섹션
│   │   └── AccountSection.tsx   계정 설정 다이얼로그
│   │
│   └── ContentPanel/
│       ├── index.tsx            contentView.kind → 패널 라우팅
│       ├── EntryDetailView.tsx  에디터 셸 (debounced save + 메뉴)
│       ├── PageListView.tsx     Page 엔트리 목록
│       ├── BioDesignPanel.tsx   프로필 편집
│       ├── AvatarUpload.tsx     아바타 업로드/삭제
│       ├── HeaderStyleSection.tsx 헤더 스타일 설정
│       ├── CreateEntryPanel.tsx 엔트리 생성 패널
│       ├── CreateEventForm.tsx  이벤트 생성 폼 (RHF)
│       ├── EventImportSearch.tsx 이벤트 임포트
│       └── editors/
│           ├── types.ts         EntryEditorProps
│           ├── EventEditor.tsx
│           ├── MixsetEditor.tsx
│           ├── LinkEditor.tsx
│           └── ImageEditor.tsx

src/lib/
├── api/
│   ├── index.ts                 withAuth + response helpers + ownership 검증
│   ├── withAuth.ts              인증 미들웨어 (AuthContext 제공)
│   ├── responses.ts             successResponse, errorResponse 등
│   ├── ownership.ts             verifyEntryOwnership, verifyPageOwnership 등
│   └── handlers/
│       ├── index.ts             barrel export
│       ├── entry.handlers.ts    7개 entry 핸들러
│       ├── page.handlers.ts     handleUpdatePage
│       ├── user.handlers.ts     profile + avatar 핸들러
│       ├── venue.handlers.ts    handleCreateVenue + handleListVenues
│       ├── import.handlers.ts   RA venue import
│       ├── cron.handlers.ts     upcoming events refresh
│       └── auth.handlers.ts     인증 콜백
│
├── db/queries/
│   ├── entry.queries.ts         엔트리 CRUD
│   ├── page.queries.ts          페이지 CRUD
│   ├── user.queries.ts          유저 조회/수정
│   ├── event.queries.ts         이벤트 CRUD
│   ├── venue.queries.ts         베뉴 CRUD + slug 확인
│   ├── artist.queries.ts        아티스트 CRUD + 검색
│   ├── search.queries.ts        통합 검색
│   └── ...                      (event-stack, graph, stats, import, cron)
│
└── validations/
    └── entry.schemas.ts         Zod 스키마 (API + 클라이언트 공용)
```

---

## 10. 삭제된 것들

| 파일/개념                                             | 이유                                               |
| ----------------------------------------------------- | -------------------------------------------------- |
| `src/stores/userStore.ts`                             | TanStack Query로 이관 (EditorData.user)            |
| `src/stores/index.ts`                                 | userStore 삭제로 빈 파일                           |
| `src/app/dashboard/actions/entries.ts`                | TQ mutation으로 완전 대체 (import 0건)             |
| `src/app/dashboard/actions/user.ts`                   | API route로 이관 (avatar, profile)                 |
| `src/lib/db/queries/display-entry.queries.ts`         | page_view_items 더 이상 미사용 (import 0건)        |
| 3개 Zustand 스토어 병합                               | 단일 `useDashboardStore`로 통합                    |
| `activePanel` + `selectedEntryId` + `createPanelType` | `ContentView` discriminated union으로 대체         |
| `selectEntry()`, `openCreatePanel()` 등 편의 래퍼     | `setView()` 단일 메서드로 대체                     |
| 컴포넌트별 `isLoading`/`error` 분기                   | `useSuspenseQuery` + ErrorBoundary/Suspense로 대체 |
| `as` 타입 단언 다수                                   | 타입 가드 또는 타입 안전한 접근으로 교체           |
