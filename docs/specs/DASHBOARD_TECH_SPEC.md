# Dashboard Tech Spec

> 2026-02-28 기준 Dashboard 도메인의 아키텍처·데이터 흐름·상태 관리·컴포넌트 구조를 기술한다.

---

## 1. 개요

Dashboard는 DJ/아티스트가 자신의 퍼블릭 페이지를 편집하는 SPA 워크스페이스다.
3-column 레이아웃(TreeSidebar + ContentPanel + PreviewPanel)에서 엔트리(event·mixset·link)를 CRUD하고, 드래그 앤 드롭으로 페이지 구성을 관리한다.

**핵심 제약:**

- 4-layer 아키텍처 준수 (Client → Route → Handler → Database)
- 서버 상태는 TanStack Query, UI 상태는 Zustand 단일 스토어
- 모든 mutation은 optimistic update + 롤백 패턴
- SSR 초기 데이터 → 클라이언트 hydration 흐름

---

## 2. 기술 스택

| 영역         | 기술                    | 용도                               |
| ------------ | ----------------------- | ---------------------------------- |
| Framework    | Next.js 16 (App Router) | SSR + API Routes                   |
| Language     | TypeScript (strict)     | 전체                               |
| Database     | Supabase (PostgreSQL)   | 데이터 저장 + Auth + Storage       |
| Server State | TanStack Query 5        | 캐시·낙관적 업데이트·무효화        |
| UI State     | Zustand 5               | ContentView 라우팅·사이드바·프리뷰 |
| DnD          | dnd-kit                 | 사이드바·페이지뷰 드래그           |
| Validation   | Zod                     | API 검증 + 클라이언트 완성도 판단  |
| Form         | React Hook Form 7       | 이벤트 생성 폼                     |
| Styling      | Tailwind CSS 3.4        | 전체 UI                            |
| Deploy       | Vercel                  | 호스팅                             |

---

## 3. 아키텍처 레이어

### 3.1 레이어 다이어그램

```
┌──────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Components       │  │ Hooks (TQ)   │  │ Store (Zustand)│  │
│  │ TreeSidebar      │  │ useEditorData│  │ dashboardStore │  │
│  │ ContentPanel     │  │ useMutations │  │ (ContentView,  │  │
│  │ PreviewPanel     │  │ useUser      │  │  sidebar,      │  │
│  │                  │  │              │  │  previewVer)   │  │
│  └────────┬─────────┘  └──────┬───────┘  └────────────────┘  │
│           │  fetch()          │                               │
├───────────┼───────────────────┼───────────────────────────────┤
│  ROUTE LAYER                  │                               │
│  app/api/**/route.ts          │                               │
│  withAuth → handler 위임 (1-3줄)                              │
├───────────────────────────────┼───────────────────────────────┤
│  HANDLER LAYER                │                               │
│  lib/api/handlers/*.handlers.ts                               │
│  Parse → Validate → Verify → Logic → Transform → DB → Resp   │
├───────────────────────────────────────────────────────────────┤
│  DATABASE LAYER                                               │
│  lib/db/queries/*.queries.ts                                  │
│  Supabase 쿼리 → Result<T> 반환                              │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 레이어별 책임

| 레이어       | 파일 위치                          | 책임                                         | 금지                     |
| ------------ | ---------------------------------- | -------------------------------------------- | ------------------------ |
| **Client**   | `hooks/`, `stores/`, `components/` | UI 렌더링, 낙관적 업데이트, 사용자 인터랙션  | DB 직접 접근             |
| **Route**    | `app/api/**/route.ts`              | 인증(withAuth), 핸들러 위임                  | 비즈니스 로직            |
| **Handler**  | `lib/api/handlers/`                | 파싱, 검증, 소유권 확인, 비즈니스 로직, 응답 | DB 직접 호출 외의 인프라 |
| **Database** | `lib/db/queries/`                  | 쿼리 실행, `Result<T>` 반환                  | 비즈니스 로직, HTTP 응답 |

---

## 4. 데이터 모델

### 4.1 핵심 엔티티

```
User ─1:1─ Page ─1:N─ Entry
                         │
                    ┌────┼────┐
                  event mixset link
```

### 4.2 DB 스키마 (주요 필드)

**users**

```
id              UUID PK
auth_user_id    UUID FK → auth.users.id
username        TEXT UNIQUE
email           TEXT
display_name    TEXT
bio             TEXT
avatar_url      TEXT
instagram       TEXT
soundcloud      TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**pages**

```
id              UUID PK
user_id         UUID FK → users.id
slug            TEXT UNIQUE
title           TEXT
bio             TEXT
avatar_url      TEXT
theme_color     TEXT DEFAULT '#000000'
is_public       BOOLEAN
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**entries**

```
id              UUID PK
page_id         UUID FK → pages.id
type            TEXT ('event' | 'mixset' | 'link')
position        INTEGER          -- Components 섹션 내 정렬 순서
display_order   INTEGER | NULL   -- NULL = 페이지에 미표시
is_visible      BOOLEAN          -- 페이지 내 임시 숨김
reference_id    UUID | NULL      -- events/mixsets 테이블 참조
data            JSONB            -- 타입별 엔트리 데이터
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### 4.3 EntryData (JSONB) 구조

| 타입       | Self-hosted                                                                                | Reference       |
| ---------- | ------------------------------------------------------------------------------------------ | --------------- |
| **event**  | `{ title, date, venue: { id?, name }, lineup: Artist[], posterUrl, description, links }`   | `{ event_id }`  |
| **mixset** | `{ title, tracklist, coverUrl, audioUrl, soundcloudUrl, releaseDate, genre, description }` | `{ mixset_id }` |
| **link**   | `{ title, url, icon }`                                                                     | —               |

### 4.4 도메인 타입 (camelCase)

```typescript
type EditorData = { user: User; contentEntries: ContentEntry[]; pageId: string };
type ContentEntry = EventEntry | PublicEventEntry | MixsetEntry | LinkEntry;
type EntryType = 'event' | 'mixset' | 'link';

// Result<T> 패턴
type Result<T> = Success<T> | Failure<AppError>;
type Success<T> = { success: true; data: T };
type Failure<E> = { success: false; error: E };
type AppError = { code: ErrorCode; message: string; cause?: unknown };
```

### 4.5 position vs display_order

```
position      — Components 사이드바 내 섹션별 정렬 (events, mixsets, links 각각)
display_order — Page 뷰에 노출될 때의 순서 (NULL이면 Page에 미포함)
is_visible    — Page에 포함되었지만 임시 숨김 (display_order ≠ null인 상태에서만 의미)
```

---

## 5. 상태 관리

### 5.1 서버 상태 — TanStack Query

**Query Keys:**

```typescript
entryKeys = {
    all: ['entries'], // useEditorData (전체 EditorData)
    detail: (id) => ['entries', id], // useEntryDetail (단일 엔트리)
};
```

**Queries:**

| Hook                          | 타입             | 데이터          | staleTime        |
| ----------------------------- | ---------------- | --------------- | ---------------- |
| `useEditorData(initialData?)` | useSuspenseQuery | EditorData      | 60s              |
| `useEntryDetail(id)`          | useSuspenseQuery | ContentEntry    | 캐시 초기값 사용 |
| `useUser()`                   | 파생             | EditorData.user | —                |

**Mutations (8개):**

| Mutation            | API                                | 프리뷰 트리거             |
| ------------------- | ---------------------------------- | ------------------------- |
| `create`            | POST /api/entries                  | always                    |
| `update`            | PATCH /api/entries/[id]            | 조건부 (필드 변경 감지)   |
| `remove`            | DELETE /api/entries/[id]           | 조건부 (페이지 노출 여부) |
| `addToDisplay`      | PATCH /api/entries/[id]            | always                    |
| `removeFromDisplay` | PATCH /api/entries/[id]            | always                    |
| `toggleVisibility`  | PATCH /api/entries/[id]            | always                    |
| `reorder`           | PATCH /api/entries/reorder         | never                     |
| `reorderDisplay`    | PATCH /api/entries/reorder-display | always                    |

**Optimistic Mutation 팩토리:**

```
onMutate: cancelQueries → 스냅샷 저장 → 낙관적 업데이트 적용
mutationFn: API 호출
onSuccess: triggersPreview 판단 → triggerPreviewRefresh()
onError: 스냅샷 롤백
onSettled: invalidateQueries (entryKeys.all)
```

### 5.2 UI 상태 — Zustand

**dashboardStore (단일 스토어):**

```typescript
interface DashboardStore {
    contentView: ContentView; // 뷰 라우팅
    sidebarSections: SidebarSections; // 섹션 접힘 상태
    previewVersion: number; // iframe 새로고침 트리거

    setView(view: ContentView): void;
    triggerPreviewRefresh(): void;
    toggleSection(section: SectionKey): void;
    reset(): void;
}

type ContentView =
    | { kind: 'bio' }
    | { kind: 'page' }
    | { kind: 'page-detail'; entryId: string }
    | { kind: 'create'; entryType: EntryType }
    | { kind: 'detail'; entryId: string };

type SectionKey = 'page' | 'events' | 'mixsets' | 'links';
```

### 5.3 상태 분리 원칙

```
TanStack Query: 서버와 동기화되는 데이터 (entries, user, page)
Zustand:        순수 UI 상태 (어떤 화면인지, 접힘 여부, 프리뷰 버전)
```

- user 데이터는 TanStack Query에서 파생 (`useUser() → useEditorData().data.user`)
- pageId도 TanStack Query에서 파생 (`useEditorData().data?.pageId`)
- Zustand에는 서버 데이터를 저장하지 않음

---

## 6. 컴포넌트 구조

### 6.1 레이아웃

```
DashboardLayout (layout.tsx)
├─ QueryProvider
└─ ErrorBoundaryWithQueryReset
   └─ Suspense(fallback=Skeleton)
      └─ DashboardPage (page.tsx — SSR)
         ├─ StoreInitializer          SSR data → TQ 캐시 hydration + 스토어 reset
         └─ 3-column flex
            ├─ TreeSidebar            좌측 네비게이션 (w-64)
            ├─ ContentPanel           중앙 편집 영역 (flex-1)
            └─ PreviewPanel           우측 iPhone 프리뷰 (w-[375px])
```

### 6.2 TreeSidebar (좌측)

```
TreeSidebar/index.tsx              DndContext 래퍼
├─ Header                          DNA 로고 + 홈 링크
├─ Bio Design 버튼                 → setView({ kind: 'bio' })
├─ SectionItem(page)               Page 섹션 (접힘 가능)
│  └─ ViewSection                  드롭존 + display_order 있는 엔트리 목록
│     └─ TreeItem[]                개별 엔트리 (visibility 토글, 제거)
├─ SectionItem(events)             이벤트 섹션
│  └─ SortableContext → TreeItem[]
├─ SectionItem(mixsets)            믹스셋 섹션
│  └─ SortableContext → TreeItem[]
├─ SectionItem(links)              링크 섹션
│  └─ SortableContext → TreeItem[]
└─ AccountSection                  프로필 편집 + 로그아웃
```

**DnD 동작:**

| 소스 → 타겟               | 동작          | Mutation         |
| ------------------------- | ------------- | ---------------- |
| 섹션 엔트리 → ViewSection | 페이지에 추가 | `addToDisplay`   |
| ViewSection 내부          | 순서 변경     | `reorderDisplay` |
| 섹션 내부                 | 순서 변경     | `reorder`        |

### 6.3 ContentPanel (중앙)

```
ContentPanel/index.tsx             contentView.kind 기반 라우팅
│
├─ kind: 'bio'
│  └─ BioDesignPanel (lazy)        프로필 편집 (이름, 바이오, 아바타, 헤더)
│     ├─ AvatarUpload              아바타 업로드/삭제
│     └─ HeaderStyleSection        헤더 스타일 설정
│
├─ kind: 'page'
│  └─ PageListView                 페이지 엔트리 관리 (DndContext 별도)
│     └─ SortableItem[]            드래그 정렬 + visibility 토글 + 제거
│
├─ kind: 'page-detail' | 'detail'
│  └─ Suspense + ErrorBoundary
│     └─ EntryDetailView (lazy)    에디터 셸
│        ├─ TypeBadge              타입 뱃지
│        ├─ 메뉴 (menuConfig)     "..." 드롭다운
│        └─ Editor (타입별)
│           ├─ EventEditor
│           ├─ MixsetEditor
│           └─ LinkEditor
│
└─ kind: 'create'
   └─ CreateEntryPanel (lazy)
      ├─ event → OptionSelector (import | create)
      │  ├─ EventImportSearch     RA 이벤트 검색·임포트
      │  └─ CreateEventForm       RHF + Zod resolver
      └─ mixset | link → 타이틀 입력 → 생성
```

### 6.4 PreviewPanel (우측)

```
PreviewPanel.tsx
├─ iPhone 프레임 UI
├─ iframe src=/{username}?preview=true
├─ previewVersion 감지 → iframe reload
├─ IntersectionObserver → 가시성 체크
└─ 링크 복사 + 외부 링크 버튼
```

---

## 7. API 엔드포인트

### 7.1 인증 보호 (Dashboard)

| Method | Endpoint                         | Handler                       | 설명                           |
| ------ | -------------------------------- | ----------------------------- | ------------------------------ |
| GET    | `/api/editor/data`               | —                             | EditorData 조회                |
| POST   | `/api/entries`                   | `handleCreateEntry`           | 엔트리 생성                    |
| GET    | `/api/entries/[id]`              | `handleGetEntry`              | 단일 엔트리 조회               |
| PATCH  | `/api/entries/[id]`              | `handleUpdateEntry`           | 엔트리 수정 (3가지 모드)       |
| DELETE | `/api/entries/[id]`              | `handleDeleteEntry`           | 엔트리 삭제                    |
| PATCH  | `/api/entries/reorder`           | `handleReorderEntries`        | 섹션 내 정렬 (position)        |
| PATCH  | `/api/entries/reorder-display`   | `handleReorderDisplayEntries` | 페이지 내 정렬 (display_order) |
| GET    | `/api/entries/max-display-order` | `handleGetMaxDisplayOrder`    | 최대 display_order 조회        |
| PATCH  | `/api/users/[id]`                | `handleUpdateProfile`         | 프로필 수정                    |
| POST   | `/api/users/[id]/avatar`         | `handleUploadAvatar`          | 아바타 업로드                  |
| DELETE | `/api/users/[id]/avatar`         | `handleDeleteAvatar`          | 아바타 삭제                    |
| PATCH  | `/api/pages/[id]`                | `handleUpdatePage`            | 페이지 설정 수정               |

### 7.2 공개 API

| Method | Endpoint                       | 설명          |
| ------ | ------------------------------ | ------------- |
| GET    | `/api/(public)/artists`        | 아티스트 목록 |
| GET    | `/api/(public)/artists/search` | 아티스트 검색 |
| GET    | `/api/(public)/events`         | 이벤트 목록   |
| GET    | `/api/(public)/events/[id]`    | 이벤트 상세   |
| GET    | `/api/(public)/venues`         | 베뉴 목록     |
| GET    | `/api/(public)/venues/search`  | 베뉴 검색     |
| GET    | `/api/(public)/search/*`       | 통합 검색     |
| GET    | `/api/(public)/graph/explore`  | 그래프 탐색   |

### 7.3 기타

| Method | Endpoint                     | 설명                 |
| ------ | ---------------------------- | -------------------- |
| GET    | `/api/auth/callback`         | OAuth 콜백           |
| POST   | `/api/cron/refresh-upcoming` | 크론 잡              |
| POST   | `/api/import/venue/preview`  | 베뉴 임포트 미리보기 |
| POST   | `/api/import/venue/confirm`  | 베뉴 임포트 확정     |
| GET    | `/api/user/[username]/page`  | 퍼블릭 페이지 데이터 |

---

## 8. 데이터 흐름

### 8.1 초기 로딩 (SSR → CSR Hydration)

```
page.tsx (Server Component)
  │
  ├─ getUser()                        Supabase auth
  ├─ syncUserFromAuth()               auth → users 동기화
  └─ getEditorDataByAuthUserId()      users + pages + entries 조회
     │
     └─ initialData: EditorData
        │
        ▼
StoreInitializer (Client Component)
  ├─ useEditorData(initialData)       TQ 캐시에 initialData 주입
  └─ useDashboardStore.reset()        UI 상태 초기화
```

### 8.2 엔트리 생성 흐름

```
CreateEntryPanel
  │
  ├─ 타이틀 입력 (mixset/link) 또는 CreateEventForm (event)
  └─ createMutation.mutate({ pageId, entry, publishOption })
     │
     ├─ [onMutate] 낙관적: entries 배열에 신규 엔트리 추가
     ├─ [mutationFn] POST /api/entries
     │    ├─ withAuth → handleCreateEntry
     │    ├─ Zod 검증 (createEntryRequestSchema)
     │    ├─ verifyPageOwnership
     │    ├─ getMaxPosition → position 계산
     │    ├─ [event + publish] → events 테이블에도 생성
     │    ├─ mapEntryToDatabase → createEntry
     │    └─ 201 Created
     ├─ [onSuccess] triggerPreviewRefresh
     ├─ [onError] 스냅샷 롤백
     └─ [onSettled] invalidateQueries
```

### 8.3 엔트리 수정 흐름 (Debounced)

```
EntryDetailView
  │
  ├─ 필드 변경 → localEntry 업데이트 (즉시 UI 반영)
  └─ useDebouncedSave (800ms)
     └─ updateMutation.mutate({ id, entry })
        │
        ├─ [onMutate] 낙관적: TQ 캐시 업데이트
        ├─ [mutationFn] PATCH /api/entries/[id]
        │    ├─ verifyEntryOwnership
        │    ├─ Zod 검증
        │    └─ updateEntry (DB)
        ├─ [onSuccess] shouldTriggerPreview(prev, next)
        │    └─ FIELD_CONFIG[type] 기반 프리뷰 필드 변경 감지
        │       └─ Yes → previewVersion++
        └─ [onSettled] invalidateQueries
```

### 8.4 프리뷰 새로고침 흐름

```
Mutation onSuccess
  └─ triggersPreview 판단 (boolean | (params, snapshot) => boolean)
     │
     ├─ 항상: create, addToDisplay, removeFromDisplay, toggleVisibility, reorderDisplay
     ├─ 조건부: update (FIELD_CONFIG.triggersPreview 필드 변경 시)
     ├─ 조건부: remove (display_order가 있었던 엔트리일 때)
     └─ never: reorder (사이드바 순서만 변경)
     │
     └─ triggerPreviewRefresh()
        └─ previewVersion++
           └─ PreviewPanel 감지 → iframe.contentWindow.location.reload()
```

### 8.5 DnD: 사이드바 → 페이지 추가

```
TreeSidebar DndContext.onDragEnd
  │
  ├─ 드롭 타겟 = ViewSection?
  │  ├─ canAddToView(entry) 검증 (Zod safeParse)
  │  │  └─ 실패 → 드롭 무시 (미완성 엔트리)
  │  └─ addToDisplayMutation.mutate({ id, displayOrder: maxOrder + 1 })
  │
  ├─ 같은 섹션 내 드롭?
  │  └─ reorderMutation.mutate({ updates: [...newPositions] })
  │
  └─ ViewSection 내부 드롭?
     └─ reorderDisplayMutation.mutate({ updates: [...newDisplayOrders] })
```

---

## 9. Config 시스템

### 9.1 Config 파일 목록

| 파일                  | 단일 책임                                   | 주요 소비자                                 |
| --------------------- | ------------------------------------------- | ------------------------------------------- |
| `entryConfig.ts`      | `EntryType` 정의 + 뱃지·라벨                | TypeBadge, CreateEntryPanel, dashboardStore |
| `entryFieldConfig.ts` | 필드 메타 + 스키마 레지스트리 + 완성도 헬퍼 | previewTrigger, TreeItem, DnD 드롭 검증     |
| `menuConfig.ts`       | 선언적 메뉴 액션 + 런타임 resolve           | EntryDetailView                             |
| `workflowOptions.ts`  | 생성/발행 옵션                              | CreateEventForm, CreateEntryPanel           |
| `entry.schemas.ts`    | Zod 스키마 (API + 클라이언트 공용)          | 핸들러 검증, RHF resolver, 완성도 판단      |

### 9.2 완성도 검증 2-tier

| Tier     | 용도                  | 검증 수준                                                                                  |
| -------- | --------------------- | ------------------------------------------------------------------------------------------ |
| `create` | 엔트리 생성 최소 조건 | event: title + posterUrl, mixset: title, link: title + url                                 |
| `view`   | Page에 추가 가능 조건 | event: + date + venue + lineup + description, mixset: + coverUrl + audio, link: + URL 형식 |

### 9.3 프리뷰 트리거 필드

| 타입   | triggersPreview: true                                        | triggersPreview: false |
| ------ | ------------------------------------------------------------ | ---------------------- |
| event  | title, date, venue, posterUrl, lineup                        | description, links     |
| mixset | title, coverUrl, audioUrl, soundcloudUrl, releaseDate, genre | tracklist, description |
| link   | title, url, icon                                             | —                      |

---

## 10. 인증 & 소유권

### 10.1 인증 미들웨어 (withAuth)

```typescript
export function withAuth(handler) {
    return async (request, context) => {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return unauthorizedResponse();
        const params = await context.params;
        return handler(request, { user, supabase, params });
    };
}
```

### 10.2 소유권 검증 체인

```
Entry 소유권: entry.page_id → pages.user_id → users.auth_user_id === request.user.id
Page 소유권:  pages.user_id → users.auth_user_id === request.user.id
User 소유권:  findUserByAuthId(auth_user_id).id === params.id
```

| 함수                                             | 반환                                      | 용도                     |
| ------------------------------------------------ | ----------------------------------------- | ------------------------ |
| `verifyEntryOwnership(entryId, authUserId)`      | `{ ok, pageId } \| { ok: false, reason }` | 단일 엔트리              |
| `verifyEntriesOwnership(entryIds[], authUserId)` | 동일                                      | 배치 (reorder)           |
| `verifyPageOwnership(pageId, authUserId)`        | 동일                                      | 페이지 수정, 엔트리 생성 |

### 10.3 응답 헬퍼

| 함수                              | HTTP    | 용도                 |
| --------------------------------- | ------- | -------------------- |
| `successResponse(data, status?)`  | 200/201 | 성공                 |
| `unauthorizedResponse()`          | 401     | 미인증               |
| `forbiddenResponse()`             | 403     | 소유권 실패          |
| `notFoundResponse(resource)`      | 404     | 리소스 없음          |
| `validationErrorResponse(field)`  | 400     | 필드 누락            |
| `zodValidationErrorResponse(err)` | 400     | Zod 검증 실패 (상세) |
| `internalErrorResponse(message?)` | 500     | DB/서버 오류         |

---

## 11. 에러 처리

### 11.1 DB 레이어 → Result\<T\>

```typescript
try {
  const { data, error } = await supabase.from('table')...
  if (error) {
    if (error.code === 'PGRST116') return failure(createNotFoundError(...))
    return failure(createDatabaseError(error.message, 'fn', error))
  }
  return success(data)
} catch (err) {
  return failure(createDatabaseError('message', 'fn', err))
}
```

### 11.2 Handler 레이어 → HTTP 응답

```typescript
const result = await dbQuery();
if (!isSuccess(result)) return internalErrorResponse(result.error.message);
return successResponse(result.data);
```

### 11.3 Client 레이어 → ErrorBoundary + 롤백

```
ErrorBoundaryWithQueryReset
  └─ QueryErrorResetBoundary + react-error-boundary
     └─ "Retry" 버튼 → TQ 캐시 리셋 + 재렌더링

Mutation 실패:
  onError → 스냅샷 롤백 (낙관적 업데이트 되돌림)
  onSettled → invalidateQueries (서버 상태 재동기화)
```

---

## 12. 파일 구조

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx                     SSR: EditorData fetch
│   │   ├── layout.tsx                   QueryProvider + ErrorBoundary + Suspense
│   │   ├── actions/
│   │   │   └── upload.ts                포스터 업로드 Server Action
│   │   ├── config/
│   │   │   ├── entryConfig.ts           EntryType + 뱃지·라벨
│   │   │   ├── entryFieldConfig.ts      필드 메타 + 스키마 레지스트리 + 완성도 헬퍼
│   │   │   ├── menuConfig.ts            에디터 메뉴 액션
│   │   │   └── workflowOptions.ts       생성/발행 옵션
│   │   ├── stores/
│   │   │   └── dashboardStore.ts        ContentView + sidebar + previewVersion
│   │   ├── lib/
│   │   │   └── previewTrigger.ts        shouldTriggerPreview
│   │   ├── hooks/
│   │   │   ├── index.ts                 barrel export
│   │   │   ├── entries.api.ts           순수 fetch 함수 (mutation용)
│   │   │   ├── optimistic-mutation.ts   makeOptimisticMutation 팩토리
│   │   │   ├── use-editor-data.ts       entryKeys + useEditorData + useEntryDetail
│   │   │   ├── use-mutations.ts         8개 entry mutation
│   │   │   ├── use-user.ts             useUser + useUserMutations
│   │   │   ├── use-array-field.ts       배열 필드 CRUD
│   │   │   └── use-create-event-form.ts RHF + 이벤트 폼
│   │   ├── services/
│   │   │   └── search.ts               검색 서비스
│   │   └── components/
│   │       ├── index.tsx                컴포넌트 exports
│   │       ├── StoreInitializer.tsx     SSR data → TQ hydration
│   │       ├── ErrorBoundary.tsx        QueryErrorResetBoundary 래핑
│   │       ├── Skeleton.tsx             3-column 로딩 스켈레톤
│   │       ├── PreviewPanel.tsx         iPhone 프리뷰 iframe
│   │       ├── TreeSidebar/
│   │       │   ├── index.tsx            DndContext + 섹션 네비게이션
│   │       │   ├── AccountSection.tsx   프로필 편집 + 로그아웃
│   │       │   ├── SectionItem.tsx      접힘 가능 섹션 컨테이너
│   │       │   ├── TreeItem.tsx         엔트리 행 + 상태 아이콘
│   │       │   └── ViewSection.tsx      Page 드롭존
│   │       └── ContentPanel/
│   │           ├── index.tsx            contentView.kind 기반 라우팅
│   │           ├── BioDesignPanel.tsx    프로필 에디터 (debounced save)
│   │           ├── AvatarUpload.tsx      아바타 업로드/삭제
│   │           ├── HeaderStyleSection.tsx 헤더 스타일
│   │           ├── PageListView.tsx      페이지 엔트리 정렬
│   │           ├── EntryDetailView.tsx   에디터 셸 (debounced save + 메뉴)
│   │           ├── CreateEntryPanel.tsx  엔트리 생성 분기
│   │           ├── CreateEventForm.tsx   이벤트 생성 (RHF)
│   │           ├── EventImportSearch.tsx RA 이벤트 임포트
│   │           └── editors/
│   │               ├── types.ts         EntryEditorProps 인터페이스
│   │               ├── EventEditor.tsx
│   │               ├── MixsetEditor.tsx
│   │               ├── LinkEditor.tsx
│   │               └── ImageEditor.tsx
│   │
│   └── api/
│       ├── auth/callback/route.ts
│       ├── editor/data/route.ts
│       ├── entries/
│       │   ├── route.ts                 POST (create)
│       │   ├── [id]/route.ts            GET, PATCH, DELETE
│       │   ├── reorder/route.ts         PATCH
│       │   ├── reorder-display/route.ts PATCH
│       │   └── max-display-order/route.ts GET
│       ├── pages/[id]/route.ts          PATCH
│       ├── users/[id]/
│       │   ├── route.ts                 PATCH (profile)
│       │   └── avatar/route.ts          POST, DELETE
│       ├── import/venue/
│       │   ├── preview/route.ts
│       │   └── confirm/route.ts
│       ├── user/[username]/page/route.ts
│       ├── cron/refresh-upcoming/route.ts
│       └── (public)/                    인증 불필요
│           ├── artists/...
│           ├── events/...
│           ├── venues/...
│           ├── search/...
│           └── graph/explore/route.ts
│
├── lib/
│   ├── api/
│   │   ├── index.ts                     barrel export
│   │   ├── withAuth.ts                  인증 미들웨어
│   │   ├── responses.ts                 응답 헬퍼
│   │   ├── ownership.ts                 소유권 검증
│   │   ├── fetch-utils.ts               fetch 유틸
│   │   └── handlers/
│   │       ├── index.ts                 barrel export
│   │       ├── entry.handlers.ts        엔트리 비즈니스 로직
│   │       ├── user.handlers.ts         유저 프로필/아바타
│   │       ├── page.handlers.ts         페이지 설정
│   │       ├── venue.handlers.ts        베뉴 CRUD
│   │       ├── import.handlers.ts       베뉴 임포트
│   │       ├── auth.handlers.ts         인증 관련
│   │       └── cron.handlers.ts         크론 잡
│   ├── db/queries/
│   │   ├── entry.queries.ts             엔트리 CRUD
│   │   ├── user.queries.ts              유저 조회/수정
│   │   ├── page.queries.ts              페이지 조회/수정
│   │   ├── event.queries.ts             이벤트 조회
│   │   ├── event-stack.queries.ts       이벤트 스택
│   │   ├── artist.queries.ts            아티스트 조회
│   │   ├── venue.queries.ts             베뉴 조회
│   │   ├── search.queries.ts            검색
│   │   ├── graph.queries.ts             그래프 탐색
│   │   ├── import.queries.ts            임포트
│   │   ├── stats.queries.ts             통계
│   │   └── cron.queries.ts              크론
│   ├── services/
│   │   ├── user.service.ts              EditorData 조합 (React cache)
│   │   └── ra.service.ts                Resident Advisor API
│   ├── supabase/
│   │   ├── client.ts                    브라우저 클라이언트
│   │   ├── server.ts                    서버 클라이언트
│   │   ├── service.ts                   서비스 롤 클라이언트
│   │   └── middleware.ts                인증 미들웨어
│   ├── validations/
│   │   ├── entry.schemas.ts             엔트리 Zod 스키마
│   │   └── import.schemas.ts            임포트 Zod 스키마
│   ├── mappers.ts                       DB ↔ Domain 매핑
│   ├── formatters.ts                    포맷팅 유틸
│   └── utils.ts                         범용 유틸
│
├── types/
│   ├── index.ts                         barrel export
│   ├── database.ts                      DB 타입 (snake_case)
│   ├── domain.ts                        도메인 타입 (camelCase) + 타입 가드
│   ├── result.ts                        Result<T> + AppError + 유틸 함수
│   ├── search.ts                        검색 타입
│   ├── graph.ts                         그래프 타입
│   ├── ra.ts                            RA 서비스 타입
│   └── ui.ts                            UI 타입
│
└── components/
    ├── providers/QueryProvider.tsx       TanStack Query 설정
    ├── ErrorBoundary.tsx                 글로벌 에러 바운더리
    ├── Background.tsx                    배경 컴포넌트
    ├── dna/                             DNA 디자인 시스템 (25+ 컴포넌트)
    ├── ui/                              shadcn/ui 기반 (20+ 컴포넌트)
    ├── venue/                           베뉴 관련 (4 컴포넌트)
    └── graph/                           그래프 뷰 (2 컴포넌트)
```

---

## 13. 통계 요약

| 카테고리                                 | 파일 수   |
| ---------------------------------------- | --------- |
| Dashboard 컴포넌트                       | 26        |
| Dashboard 훅                             | 8         |
| Dashboard Config                         | 4         |
| API Route 파일                           | 24        |
| Handler 파일                             | 8         |
| DB Query 파일                            | 12        |
| 타입 정의                                | 8         |
| 서비스                                   | 2         |
| Validation 스키마                        | 2         |
| 공유 컴포넌트 (dna + ui + venue + graph) | 55+       |
| **Dashboard 관련 총합**                  | **~150+** |
