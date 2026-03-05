# TanStack Query 코드리뷰

> 프로젝트 내 TanStack Query(v5) 사용 패턴을 파일별로 분석한 학습 문서.

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [Query Keys — 캐시 주소 설계](#2-query-keys--캐시-주소-설계)
3. [SSR → Client Hydration](#3-ssr--client-hydration)
4. [Query Hooks — 데이터 읽기](#4-query-hooks--데이터-읽기)
5. [Optimistic Mutation Factory](#5-optimistic-mutation-factory)
6. [Entry Mutations (8개)](#6-entry-mutations-8개)
7. [User Mutations (3개)](#7-user-mutations-3개)
8. [Preview Trigger 시스템](#8-preview-trigger-시스템)
9. [Consumer 컴포넌트 사용 패턴](#9-consumer-컴포넌트-사용-패턴)
10. [QueryProvider 설정](#10-queryprovider-설정)
11. [개선 포인트 & 메모](#11-개선-포인트--메모)

---

## 1. 아키텍처 개요

```
서버 (SSR)                     클라이언트
┌────────────┐   initialData   ┌─────────────────────────┐
│ page.tsx   │ ───────────────▶│ StoreInitializer.tsx     │
│ (서버 fetch)│                 │  ├─ useEntries(initial)  │ ─▶ ['entries'] 캐시
│            │                 │  ├─ useUserQuery(initial) │ ─▶ ['user'] 캐시
│            │                 │  └─ setPageId(id)         │ ─▶ Zustand store
└────────────┘                 └─────────────────────────┘
                                          │
                    ┌─────────────────────┼────────────────────┐
                    ▼                     ▼                    ▼
             useEntries()          useUser()           selectPageId
             useEntryDetail()      useUserMutations()  (Zustand)
             useEntryMutations()
```

**3가지 도메인이 독립적으로 캐시/갱신:**

| 도메인  | 캐시 키          | 타입             | 갱신 주기     |
| ------- | ---------------- | ---------------- | ------------- |
| Entries | `['entries']`    | `ContentEntry[]` | staleTime 1분 |
| User    | `['user']`       | `User`           | staleTime 5분 |
| PageId  | Zustand `pageId` | `string \| null` | 세션 내 불변  |

**왜 분리했는가?** 이전에는 `EditorData = { user, contentEntries, pageId }` 가 `['entries']` 하나에 묶여 있었다. 이 구조의 문제:

- entry 수정 → user를 구독하는 컴포넌트(BioDesignPanel, AccountSection)도 리렌더
- user만 독립 invalidate 불가
- optimistic mutation이 항상 전체 EditorData를 spread해야 함

---

## 2. Query Keys — 캐시 주소 설계

📁 `hooks/use-editor-data.ts:18-25`

```typescript
export const userKeys = {
    all: ['user'] as const,
};

export const entryKeys = {
    all: ['entries'] as const,
    detail: (id: string) => ['entries', id] as const,
};
```

### 핵심 개념

**Query Key = 캐시의 주소.** TanStack Query는 이 키로 데이터를 저장/조회/무효화한다.

| 키                | 용도            | 무효화 범위                                      |
| ----------------- | --------------- | ------------------------------------------------ |
| `['entries']`     | 전체 entry 목록 | `invalidateQueries({ queryKey: entryKeys.all })` |
| `['entries', id]` | 특정 entry 상세 | 상위 `['entries']` 무효화 시 함께 무효화         |
| `['user']`        | 사용자 정보     | entry와 완전히 독립                              |

### `as const`를 쓰는 이유

```typescript
// as const 없이
{
    all: ['entries'];
} // 타입: { all: string[] }

// as const 사용
{
    all: ['entries'] as const;
} // 타입: { all: readonly ['entries'] }
```

TanStack Query의 `queryKey` 타입이 `readonly unknown[]`이므로, `as const`로 리터럴 타입을 보존해야 타입 안전성이 보장된다.

### 계층형 키의 효과

```typescript
entryKeys.all = ['entries'];
entryKeys.detail = ['entries', '123'];
```

`invalidateQueries({ queryKey: ['entries'] })` 를 호출하면 **prefix match**로 `['entries']`와 `['entries', '123']` 모두 무효화된다. 목록 수정 후 상세도 자동으로 refetch되는 구조.

---

## 3. SSR → Client Hydration

📁 `components/StoreInitializer.tsx`

```typescript
export default function StoreInitializer({ initialData }: StoreInitializerProps) {
    const initialized = useRef(false);

    // TanStack Query hydration: SSR 데이터를 분리된 캐시에 주입
    useEntries(initialData.contentEntries);
    useUserQuery(initialData.user);

    // UI Store 초기화 + pageId 설정
    useLayoutEffect(() => {
        if (!initialized.current) {
            useDashboardStore.getState().reset();
            useDashboardStore.getState().setPageId(initialData.pageId);
            initialized.current = true;
        }
    }, [initialData]);

    return null;
}
```

### 흐름

1. **서버**: `page.tsx`에서 `getEditorDataByAuthUserId()` 호출 → `EditorData` 반환
2. **클라이언트**: `StoreInitializer`가 받아서 3개로 분배:
    - `useEntries(initialData.contentEntries)` → `['entries']` 캐시에 seed
    - `useUserQuery(initialData.user)` → `['user']` 캐시에 seed
    - `setPageId(initialData.pageId)` → Zustand store에 저장

### `initialData` vs `placeholder` 차이

```typescript
useSuspenseQuery({
    queryKey: entryKeys.all,
    queryFn: fetchEntries,
    initialData: initialEntries, // ← "이미 유효한 데이터"
    initialDataUpdatedAt: Date.now(), // ← "이 시점에 최신이었다"
    staleTime: 60_000,
});
```

- **`initialData`**: 캐시에 실제 데이터로 저장됨. `staleTime` 동안 refetch하지 않음.
- **`placeholderData`**: 캐시에 저장되지 않고, 진짜 데이터가 올 때까지 임시로 보여줌.

SSR에서 `initialData`를 쓰는 이유: 서버에서 이미 확정된 데이터이므로, 클라이언트 마운트 시 skeleton flash 없이 즉시 UI를 그릴 수 있다.

### `initialDataUpdatedAt`이 필요한 이유

```typescript
initialDataUpdatedAt: initialEntries ? Date.now() : undefined,
```

TanStack Query는 `initialData`가 언제 생성됐는지 모른다. `initialDataUpdatedAt`이 없으면 "시간 정보 없음 → stale" 로 판단해서 마운트 즉시 refetch한다. `Date.now()`를 넣으면 "방금 생성됨 → fresh" 로 판단하여 `staleTime` 동안 refetch를 건너뛴다.

---

## 4. Query Hooks — 데이터 읽기

### `useEntries()`

📁 `hooks/use-editor-data.ts:56-64`

```typescript
export function useEntries(initialEntries?: ContentEntry[]) {
    return useSuspenseQuery({
        queryKey: entryKeys.all,
        queryFn: fetchEntries,
        initialData: initialEntries,
        initialDataUpdatedAt: initialEntries ? Date.now() : undefined,
        staleTime: 60_000, // 1분
    });
}
```

- `useSuspenseQuery`를 사용 → 데이터가 없으면 가장 가까운 `<Suspense>` 경계에서 로딩 UI를 보여줌
- **반환 타입이 항상 `data: ContentEntry[]`** (undefined 불가) — Suspense가 로딩을 대신 처리하므로

### `useUserQuery()`

📁 `hooks/use-editor-data.ts:66-74`

```typescript
export function useUserQuery(initialUser?: User) {
    return useSuspenseQuery({
        queryKey: userKeys.all,
        queryFn: fetchUser,
        initialData: initialUser,
        initialDataUpdatedAt: initialUser ? Date.now() : undefined,
        staleTime: 5 * 60_000, // 5분
    });
}
```

- User 데이터는 entries보다 변경 빈도가 낮으므로 staleTime 5분

### `useEntryDetail()` — 캐시 파생

📁 `hooks/use-editor-data.ts:76-91`

```typescript
export function useEntryDetail(id: string) {
    const queryClient = useQueryClient();

    return useSuspenseQuery({
        queryKey: entryKeys.detail(id), // ['entries', '123']
        queryFn: () => fetchEntryDetail(id),
        initialData: () => {
            // ['entries'] 캐시에서 해당 항목을 꺼내온다
            const entries = queryClient.getQueryData<ContentEntry[]>(entryKeys.all);
            return entries?.find((e) => e.id === id);
        },
        initialDataUpdatedAt: () => {
            // 목록 캐시의 업데이트 시점을 그대로 사용
            return queryClient.getQueryState(entryKeys.all)?.dataUpdatedAt;
        },
        staleTime: 60_000,
    });
}
```

**핵심**: 목록(`['entries']`)에 이미 있는 데이터를 상세(`['entries', id]`) 캐시의 `initialData`로 재활용.

1. 유저가 목록에서 항목을 클릭 → `useEntryDetail('123')` 호출
2. `['entries', '123']` 캐시가 비어있음 → `initialData()` 실행
3. `['entries']` 캐시에서 `id === '123'`인 항목을 `find` → 즉시 반환
4. `staleTime`이 지나면 백그라운드에서 `fetchEntryDetail(id)` 호출하여 최신 데이터로 교체

이 패턴 덕분에 목록 → 상세 전환 시 네트워크 요청 없이 즉시 UI를 그릴 수 있다.

### `useUser()` — 편의 래퍼

📁 `hooks/use-user.ts:19-22`

```typescript
export function useUser(): User {
    const { data } = useUserQuery();
    return data;
}
```

`useUserQuery()`의 반환값에서 `data`만 추출하는 편의 훅. 컴포넌트에서 `const user = useUser()` 로 간결하게 사용.

---

## 5. Optimistic Mutation Factory

📁 `hooks/optimistic-mutation.ts`

### 인터페이스

```typescript
export interface OptimisticMutationConfig<TParams> {
    mutationFn: (params: TParams, entries: ContentEntry[] | undefined) => Promise<unknown>;
    optimisticUpdate: (params: TParams, entries: ContentEntry[]) => ContentEntry[];
    triggersPreview?: boolean | ((params: TParams, snapshot: ContentEntry[]) => boolean);
    onPreviewTrigger?: () => void;
}
```

| 속성               | 설명                                                                            |
| ------------------ | ------------------------------------------------------------------------------- |
| `mutationFn`       | API 호출 함수. 두 번째 인자로 `snapshotRef.current` (mutation 직전 데이터) 전달 |
| `optimisticUpdate` | 캐시를 어떻게 변경할지 선언. `(params, 현재entries) → 새entries`                |
| `triggersPreview`  | `true`면 항상, 함수면 조건부로 미리보기 새로고침                                |
| `onPreviewTrigger` | 실제 새로고침 실행 콜백 (use-mutations에서 주입)                                |

### 팩토리 함수

```typescript
export function makeOptimisticMutation<TParams>(
    queryClient: QueryClient,
    snapshotRef: { current: ContentEntry[] | undefined },
    config: OptimisticMutationConfig<TParams>
): UseMutationOptions<unknown, Error, TParams, { previous?: ContentEntry[] }>;
```

**반환하는 옵션 객체의 실행 순서:**

```
1. onMutate   ─ cancel → snapshot → optimistic update
2. mutationFn ─ API 호출 (snapshotRef 참조 가능)
3. onSuccess  ─ 미리보기 새로고침 판단
4. onError    ─ snapshot으로 롤백
5. onSettled  ─ snapshotRef 초기화 + invalidate
```

### 각 단계 상세

**onMutate — 낙관적 업데이트:**

```typescript
onMutate: async (params: TParams) => {
    // 1. 진행 중인 refetch 취소 (optimistic 데이터를 덮어쓰지 않도록)
    await queryClient.cancelQueries({ queryKey: entryKeys.all });

    // 2. 롤백용 스냅샷 저장
    const previous = queryClient.getQueryData<ContentEntry[]>(entryKeys.all);
    snapshotRef.current = previous;

    // 3. 캐시를 즉시 변경 (UI가 바로 반영)
    if (previous) {
        queryClient.setQueryData<ContentEntry[]>(
            entryKeys.all,
            config.optimisticUpdate(params, previous)
        );
    }

    // 4. context로 반환 (onError에서 롤백에 사용)
    return { previous };
},
```

**onSuccess — 미리보기 트리거:**

```typescript
onSuccess: (_data, params) => {
    if (!config.triggersPreview || !config.onPreviewTrigger) return;
    const shouldRefresh =
        typeof config.triggersPreview === 'function'
            ? config.triggersPreview(params, snapshotRef.current!)
            : true;
    if (shouldRefresh) {
        config.onPreviewTrigger();
    }
},
```

**onError — 롤백:**

```typescript
onError: (_err, _vars, ctx) => {
    if (ctx?.previous) {
        queryClient.setQueryData(entryKeys.all, ctx.previous);
    }
},
```

**onSettled — 정리:**

```typescript
onSettled: () => {
    snapshotRef.current = undefined;
    queryClient.invalidateQueries({ queryKey: entryKeys.all });
},
```

성공이든 실패든 항상 실행. `invalidateQueries`로 서버의 최신 데이터를 다시 가져온다.

### `snapshotRef` 패턴

```
시간 →  onMutate          mutationFn
        ─────────────────────────────────
캐시    [A, B, C]  →  [A, B', C]  (optimistic)
        snapshot   →  snapshotRef.current = [A, B, C]
```

`mutationFn`의 두 번째 인자 `entries`는 **mutation 직전의 원본 데이터**다. `onMutate`가 캐시를 이미 변경한 상태이므로, `queryClient.getQueryData()`를 호출하면 optimistic 데이터가 나온다. `snapshotRef`를 통해 원본 데이터를 참조할 수 있다.

이 패턴이 필요한 대표 케이스: `addToDisplay` mutation에서 현재 최대 `displayOrder`를 계산할 때 → 변경 전 원본에서 계산해야 정확하다.

---

## 6. Entry Mutations (8개)

📁 `hooks/use-mutations.ts`

### 훅 구조

```typescript
export function useEntryMutations() {
    const queryClient = useQueryClient();
    const snapshotRef = useRef<ContentEntry[] | undefined>(undefined);

    const onPreviewTrigger = () => triggerPreviewRefresh();

    // 팩토리 shorthand: 모든 mutation에 공통 의존성 바인딩
    const m = <T>(config: OptimisticMutationConfig<T>) =>
        makeOptimisticMutation(queryClient, snapshotRef, { ...config, onPreviewTrigger });

    // ... 8개 mutation ...

    return {
        create,
        update,
        remove,
        addToDisplay,
        removeFromDisplay,
        toggleVisibility,
        reorder,
        reorderDisplay,
    };
}
```

`m()` 헬퍼가 `queryClient`, `snapshotRef`, `onPreviewTrigger`를 클로저로 캡처하여, 각 mutation은 고유 로직만 선언하면 된다.

### 8개 Mutation 정리

#### CRUD

| Mutation | 파라미터                            | optimisticUpdate                                  | triggersPreview           |
| -------- | ----------------------------------- | ------------------------------------------------- | ------------------------- |
| `create` | `{ pageId, entry, publishOption? }` | `[...entries, entry]`                             | `true` (항상)             |
| `update` | `{ entry, changedFields? }`         | `entries.map(e => e.id === entry.id ? entry : e)` | 함수: `hasPreviewField()` |
| `remove` | `string` (id)                       | `entries.filter(e => e.id !== id)`                | 함수: `wasVisibleEntry()` |

#### Display (Page 표시)

| Mutation            | 파라미터           | optimisticUpdate          | triggersPreview |
| ------------------- | ------------------ | ------------------------- | --------------- |
| `addToDisplay`      | `string` (entryId) | displayOrder 계산 후 추가 | `true`          |
| `removeFromDisplay` | `string` (entryId) | `displayOrder: null` 설정 | `true`          |
| `toggleVisibility`  | `string` (entryId) | `isVisible` 토글          | `true`          |

#### Reorder (순서 변경)

| Mutation         | 파라미터                              | optimisticUpdate           | triggersPreview      |
| ---------------- | ------------------------------------- | -------------------------- | -------------------- |
| `reorder`        | `{ updates: { id, position }[] }`     | position 일괄 업데이트     | 없음 (사이드바 순서) |
| `reorderDisplay` | `{ updates: { id, displayOrder }[] }` | displayOrder 일괄 업데이트 | `true` (공개 순서)   |

### 주요 패턴: `mutationFn`의 두 번째 인자

```typescript
addToDisplay: m<string>({
    mutationFn: (entryId, entries) => {
        // entries = snapshotRef.current (mutation 직전 원본)
        const orders = (entries ?? [])
            .filter((e) => typeof e.displayOrder === 'number')
            .map((e) => e.displayOrder!);
        const next = orders.length > 0 ? Math.max(...orders) + 1 : 0;
        return updateEntry({ id: entryId, displayOrder: next, isVisible: true });
    },
    // ...
});
```

`mutationFn`이 현재 entries 목록에 의존하는 경우 (displayOrder 계산 등), 두 번째 인자 `entries`를 사용한다. 이 값은 `onMutate`에서 캡처한 `snapshotRef.current`이며, optimistic update 전의 원본 데이터이다.

### Preview Trigger Helpers

📁 `hooks/use-mutations.ts:170-182`

```typescript
/** 변경된 필드 중 프리뷰에 영향을 주는 필드가 있는지 판단 */
function hasPreviewField(type: ContentEntry['type'], changedFields?: string[]): boolean {
    if (!changedFields?.length) return false;
    const fields: FieldConfig[] | undefined = FIELD_CONFIG[type];
    if (!fields) return false;
    return changedFields.some((key) => fields.find((f) => f.key === key)?.triggersPreview);
}

/** 삭제 대상이 공개 페이지에 표시 중인지 판단 */
function wasVisibleEntry(snapshot: ContentEntry[], id: string): boolean {
    const entry = snapshot.find((e) => e.id === id);
    return !!entry && canAddToView(entry);
}
```

**`hasPreviewField`의 작동 방식:**

1. `update` mutation이 `{ entry, changedFields: ['title', 'description'] }` 로 호출됨
2. `FIELD_CONFIG[entry.type]`에서 해당 타입의 필드 설정을 조회
3. `changedFields` 중 `triggersPreview: true`인 필드가 있으면 → 미리보기 새로고침

이전에는 `isEqual()`로 변경 전/후 데이터를 deep compare했지만, editor가 이미 어떤 필드가 변경되었는지 알고 있으므로 `changedFields`를 직접 전달하는 방식으로 단순화했다.

---

## 7. User Mutations (3개)

📁 `hooks/use-user.ts:60-123`

### 구조

```typescript
export function useUserMutations() {
    const queryClient = useQueryClient();

    const updateProfile = useMutation({ ... });
    const uploadAvatar = useMutation({ ... });
    const deleteAvatar = useMutation({ ... });

    return { updateProfile, uploadAvatar, deleteAvatar };
}
```

entry mutation과 달리 팩토리를 사용하지 않고 **직접 작성**한 이유:

- 3개뿐이라 추상화 비용 > 이득
- 각 mutation의 캐시 조작 패턴이 다름 (onSuccess에서 서버 응답으로 덮어쓰기 등)

### `updateProfile` — 풀 옵티미스틱 패턴

```typescript
const updateProfile = useMutation({
    mutationFn: ({ userId, updates }) => patchProfile(userId, updates),
    onMutate: async ({ updates }) => {
        await queryClient.cancelQueries({ queryKey: userKeys.all });
        const previous = queryClient.getQueryData<User>(userKeys.all);
        if (previous) {
            queryClient.setQueryData<User>(userKeys.all, { ...previous, ...updates });
        }
        return { previous };
    },
    onSuccess: (serverUser) => {
        // 서버 응답으로 확정 (서버 사이드 변환이 있을 수 있으므로)
        queryClient.setQueryData<User>(userKeys.all, serverUser);
    },
    onError: (_err, _vars, ctx) => {
        if (ctx?.previous) {
            queryClient.setQueryData(userKeys.all, ctx.previous);
        }
    },
});
```

독립 `['user']` 키를 사용하므로 `User` 타입을 직접 조작. 이전에는 `['entries']` 키 안의 `EditorData` 전체를 spread해야 했다:

```typescript
// Before: queryClient.setQueryData<EditorData>(entryKeys.all, { ...prev, user: { ...prev.user, ...updates } })
// After:  queryClient.setQueryData<User>(userKeys.all, { ...prev, ...updates })
```

### `uploadAvatar` — onSuccess만 사용

```typescript
const uploadAvatar = useMutation({
    mutationFn: ({ userId, formData }) => postAvatar(userId, formData),
    onSuccess: (data) => {
        queryClient.setQueryData<User>(userKeys.all, (prev) =>
            prev ? { ...prev, avatarUrl: data.avatarUrl } : prev
        );
    },
});
```

파일 업로드는 낙관적 업데이트가 어려움 (URL을 미리 알 수 없음) → 서버 응답 후 캐시 업데이트.

### `deleteAvatar` — 낙관적 삭제

```typescript
const deleteAvatar = useMutation({
    mutationFn: ({ userId }) => removeAvatar(userId),
    onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: userKeys.all });
        const previous = queryClient.getQueryData<User>(userKeys.all);
        if (previous) {
            queryClient.setQueryData<User>(userKeys.all, { ...previous, avatarUrl: '' });
        }
        return { previous };
    },
    onError: (_err, _vars, ctx) => {
        if (ctx?.previous) queryClient.setQueryData(userKeys.all, ctx.previous);
    },
});
```

삭제 결과는 예측 가능(`avatarUrl: ''`) → 낙관적 업데이트 적용.

---

## 8. Preview Trigger 시스템

📁 `hooks/use-preview-refresh.ts`

```typescript
const previewRefreshRef = { current: () => {} };

export function useRegisterPreviewRefresh(callback: () => void) {
    useEffect(() => {
        previewRefreshRef.current = callback;
        return () => {
            previewRefreshRef.current = () => {};
        };
    }, [callback]);
}

export function triggerPreviewRefresh() {
    previewRefreshRef.current();
}
```

**콜백 Ref 패턴**: Zustand 상태 대신 모듈-레벨 ref로 이벤트 전달.

```
PreviewPanel                           Mutation
────────────                           ────────
useRegisterPreviewRefresh(reload)  ←─  triggerPreviewRefresh()
     │                                       │
     ▼                                       │
previewRefreshRef.current = reload           │
                                             ▼
                             onSuccess → config.triggersPreview 판단
                                             │
                                             ▼
                             onPreviewTrigger() → triggerPreviewRefresh()
                                             │
                                             ▼
                             previewRefreshRef.current() → iframe reload
```

### 3계층 판단 구조

```
FIELD_CONFIG (config)     →  어떤 필드가 프리뷰에 영향을 주는가?
  ↓
hasPreviewField (util)    →  변경된 필드 중 프리뷰 필드가 있는가?
  ↓
triggersPreview (mutation)→  이 mutation이 프리뷰를 새로고침 해야 하는가?
```

📁 `config/entryFieldConfig.ts:33-55`

```typescript
export const FIELD_CONFIG: Record<EntryType, FieldConfig[]> = {
    event: [
        { key: 'title', label: '제목', triggersPreview: true },
        { key: 'description', label: '설명', triggersPreview: false },
        // ...
    ],
    // ...
};
```

각 필드의 `triggersPreview` 플래그가 유일한 설정 소스. mutation의 `hasPreviewField()`가 이 Config를 조회하여 판단한다.

---

## 9. Consumer 컴포넌트 사용 패턴

### TreeSidebar — entries + user

📁 `components/TreeSidebar/index.tsx:55-56`

```typescript
const { data: entries } = useEntries();
const user = useUser();
```

`useEntries()`는 `ContentEntry[]`를 반환. 이전에는 `data.contentEntries`로 접근했지만, 캐시가 순수 배열이므로 바로 사용.

### EntryDetailView — entryDetail + mutations

📁 `components/ContentPanel/EntryDetailView.tsx:90-93`

```typescript
const { data: entry } = useEntryDetail(entryId);
const { update: updateMutation, remove: deleteMutation } = useEntryMutations();
```

`useEntryDetail`이 목록 캐시에서 파생되므로, 목록 → 상세 전환 시 즉시 렌더링.

### EventImportSearch — pageId from Zustand

📁 `components/ContentPanel/EventImportSearch.tsx:34`

```typescript
const pageId = useDashboardStore(selectPageId);
```

이전에는 `useEditorData().data.pageId`. 세션 내 불변값이므로 Zustand가 적합.

### EntryDetailView — changedFields 전달

📁 `components/ContentPanel/EntryDetailView.tsx:100-128`

```typescript
const handleSave = useCallback(
    async (updated: ContentEntry, changedFields: string[]) => {
        await updateMutation.mutateAsync({ entry: updated, changedFields });
    },
    [updateMutation]
);

const handleUpdate = (updates: Partial<ContentEntry>) => {
    const updated = { ...localEntry, ...updates } as ContentEntry;
    setLocalEntry(updated);
    debouncedSave(updated, Object.keys(updates)); // ← 변경된 키를 추출
};
```

editor가 `handleUpdate({ title: '새 제목' })` 호출 시:

1. `Object.keys(updates)` → `['title']`
2. `debouncedSave`가 디바운스 중 필드를 누적 (`pendingFieldsRef`)
3. 디바운스 완료 시 `handleSave(entry, ['title'])` 호출
4. mutation의 `triggersPreview`가 `hasPreviewField('event', ['title'])` 실행
5. `FIELD_CONFIG.event`에서 `title.triggersPreview === true` → 미리보기 새로고침

---

## 10. QueryProvider 설정

📁 `components/providers/QueryProvider.tsx`

```typescript
const [queryClient] = useState(
    () =>
        new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: 5 * 60 * 1000, // 5분
                    gcTime: 10 * 60 * 1000, // 10분
                },
            },
        })
);
```

| 옵션        | 값   | 의미                                   |
| ----------- | ---- | -------------------------------------- |
| `staleTime` | 5분  | 이 시간 동안 refetch하지 않음 (기본값) |
| `gcTime`    | 10분 | 캐시에서 완전히 삭제되기까지 대기 시간 |

### staleTime 오버라이드

- `useEntries()`: `staleTime: 60_000` (1분) — entries는 자주 변경되므로 전역 5분보다 짧게
- `useUserQuery()`: `staleTime: 5 * 60_000` (5분) — 전역 기본값과 동일

---

## 11. 개선 포인트 & 메모

### 현재 잘 된 점

- **캐시 키 분리**: user/entries/pageId가 독립적으로 갱신 → 불필요한 리렌더 방지
- **Optimistic Mutation Factory**: 8개 mutation의 보일러플레이트를 한 곳에서 관리
- **Config-driven preview trigger**: `FIELD_CONFIG.triggersPreview` + `changedFields` 전달로 불필요한 deep compare 제거
- **SSR hydration**: `initialData` + `initialDataUpdatedAt` 조합으로 skeleton flash 방지
- **캐시 파생**: `useEntryDetail`이 목록에서 `initialData`를 꺼내 쓰는 패턴

### 향후 검토할 점

1. **`fetchEntries()`와 `fetchUser()`가 같은 API 엔드포인트를 호출**
    - 두 함수 모두 `/api/editor/data` 호출 후 각자 필요한 부분만 추출
    - 동시 호출 시 같은 요청이 2번 발생할 수 있음
    - 해결 방안: API 분리 (`/api/entries`, `/api/user`) 또는 공통 fetch + select 패턴

2. **`useSuspenseQuery` + Error Boundary 구성**
    - Suspense 경계와 Error Boundary가 잘 배치되어 있는지 확인 필요
    - fetch 실패 시 fallback UI가 적절한지 검증

3. **`staleTime` 전략 재검토**
    - 전역 5분 vs entries 1분 — 의도적 차이인지, 통일이 나은지
    - mutation `onSettled`의 `invalidateQueries`가 staleTime과 어떻게 상호작용하는지 (invalidate = stale 마킹 → 즉시 refetch)
