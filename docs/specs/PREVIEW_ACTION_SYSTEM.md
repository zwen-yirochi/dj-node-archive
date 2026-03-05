# Preview Action System

## 개요

대시보드 PreviewPanel(iframe)의 URL 전환과 새로고침을 관리하는 시스템.

두 가지 관심사를 분리:

| 관심사       | 트리거                       | 담당                            |
| ------------ | ---------------------------- | ------------------------------- |
| **URL 전환** | `contentView` 변경 (Zustand) | PreviewPanel이 reactive 구독    |
| **새로고침** | mutation 성공                | `triggerPreviewRefresh(target)` |

## 아키텍처

```
┌─ contentView 변경 ─────────────────────────────┐
│  (Zustand: setView)                             │
│       ↓                                         │
│  usePreviewUrl() → iframe src prop 변경         │
│  (detail → /user/entryId, 나머지 → /user)       │
└─────────────────────────────────────────────────┘

┌─ mutation 성공 ─────────────────────────────────┐
│  optimistic-mutation.ts                         │
│       ↓                                         │
│  triggerPreviewRefresh(target)                  │
│       ↓                                         │
│  PreviewPanel handler                           │
│       ↓                                         │
│  target === 현재 view? → reload : 무시          │
└─────────────────────────────────────────────────┘
```

## 핵심 파일

| 파일                           | 역할                              |
| ------------------------------ | --------------------------------- |
| `hooks/use-preview-actions.ts` | PreviewAction 타입, dispatch 함수 |
| `hooks/optimistic-mutation.ts` | mutation config에서 target 전달   |
| `hooks/use-mutations.ts`       | mutation별 `previewTarget` 설정   |
| `components/PreviewPanel.tsx`  | contentView 구독 + action handler |

## PreviewTarget

```typescript
type PreviewTarget = 'userpage' | 'entry-detail';
```

- `'userpage'` — `/{username}` 페이지 (기본값)
- `'entry-detail'` — `/{username}/{entryId}` 페이지

## 현재 mutation별 설정

| Mutation            | triggersPreview     | previewTarget     | 설명                               |
| ------------------- | ------------------- | ----------------- | ---------------------------------- |
| `create`            | `true`              | `userpage` (기본) | 새 엔트리 생성 → 유저 페이지 반영  |
| `update`            | `hasPreviewField()` | `entry-detail`    | 필드 편집 → 상세 페이지 반영       |
| `remove`            | `wasVisibleEntry()` | `userpage` (기본) | 삭제 → 유저 페이지 반영            |
| `addToDisplay`      | `true`              | `userpage` (기본) | 디스플레이 추가 → 유저 페이지 반영 |
| `removeFromDisplay` | `true`              | `userpage` (기본) | 디스플레이 제거 → 유저 페이지 반영 |
| `toggleVisibility`  | `true`              | `userpage` (기본) | 공개/비공개 → 유저 페이지 반영     |
| `reorder`           | 없음                | —                 | 내부 순서 변경, 프리뷰 불필요      |
| `reorderDisplay`    | `true`              | `userpage` (기본) | 디스플레이 순서 → 유저 페이지 반영 |

---

## 비즈니스 로직 수정 가이드

### 1. 기존 mutation의 previewTarget 변경

`use-mutations.ts`에서 해당 mutation의 config에 `previewTarget` 추가/변경:

```typescript
// 예: remove가 entry-detail도 refresh해야 할 때
const remove = useMutation(
    m<string>({
        mutationFn: (id) => deleteEntry(id),
        optimisticUpdate: (id, entries) => entries.filter((e) => e.id !== id),
        triggersPreview: (id, snapshot) => wasVisibleEntry(snapshot, id),
        previewTarget: 'entry-detail', // ← 추가
    })
);
```

### 2. 하나의 mutation이 두 target 모두 refresh해야 할 때

현재 구조는 mutation당 하나의 target만 지원. 둘 다 필요하면 `onPreviewTrigger`를 직접 오버라이드:

```typescript
// use-mutations.ts
const onPreviewTriggerBoth = () => {
    triggerPreviewRefresh('userpage');
    triggerPreviewRefresh('entry-detail');
};

const someSpecialMutation = useMutation(
    makeOptimisticMutation(queryClient, snapshotRef, {
        ...config,
        onPreviewTrigger: onPreviewTriggerBoth,
    })
);
```

### 3. 새로운 PreviewTarget 추가

**Step 1.** `use-preview-actions.ts`에 타입 추가:

```typescript
export type PreviewTarget = 'userpage' | 'entry-detail' | 'new-target';
```

**Step 2.** `PreviewPanel.tsx`의 `viewToPreviewTarget()`에 매핑 추가:

```typescript
function viewToPreviewTarget(view: ContentView): PreviewTarget {
    if (view.kind === 'detail') return 'entry-detail';
    if (view.kind === 'new-kind') return 'new-target';
    return 'userpage';
}
```

**Step 3.** `usePreviewUrl()`에 URL 매핑 추가:

```typescript
function usePreviewUrl(username: string): string {
    const contentView = useDashboardStore(selectContentView);
    return useMemo(() => {
        if (contentView.kind === 'detail')
            return `/${username}/${contentView.entryId}?preview=true`;
        if (contentView.kind === 'new-kind') return `/some/new/path?preview=true`;
        return `/${username}?preview=true`;
    }, [username, contentView]);
}
```

**Step 4.** 관련 mutation에 `previewTarget: 'new-target'` 설정.

### 4. triggersPreview 조건 변경

`triggersPreview`는 boolean 또는 함수:

```typescript
// 항상 refresh
triggersPreview: true,

// 조건부 refresh
triggersPreview: (params, snapshot) => {
    // params: mutation에 전달된 인자
    // snapshot: mutation 직전의 entries 배열
    return someCondition(params, snapshot);
},

// refresh 안 함 (기본값)
// triggersPreview 생략
```

### 5. Entry detail stub 페이지에 실제 렌더링 추가

`src/app/(dna)/[user]/[entryId]/page.tsx`에서 타입별 분기:

```typescript
const entry = mapEntryToDomain(result.data);

switch (entry.type) {
    case 'event':
        return <EventDetailView entry={entry} />;
    case 'mixset':
        return <MixsetDetailView entry={entry} />;
    case 'link':
        return <LinkDetailView entry={entry} />;
    case 'custom':
        return <CustomDetailView entry={entry} />;
}
```

컴포넌트 위치: `src/app/(dna)/[user]/[entryId]/components/`

이 페이지에 실제 필드가 렌더되면 대시보드에서 해당 entry 편집 시 `update` mutation → `previewTarget: 'entry-detail'` → iframe reload로 실시간 반영됨.
