# OAuth 사용자 동기화 흐름

## 문제 배경

OAuth(Google) 로그인 시 **Supabase Auth**의 `auth.users` 테이블에만 사용자가 생성되고, 애플리케이션 DB의 `public.users` 테이블에는 레코드가 생성되지 않아 대시보드 접근 시 404 에러 발생.

## 테이블 구조

```
┌─────────────────────┐     ┌─────────────────────┐
│   auth.users        │     │   public.users      │
│   (Supabase 관리)    │     │   (앱 관리)          │
├─────────────────────┤     ├─────────────────────┤
│ id (UUID)           │────▶│ auth_user_id (UUID) │
│ email               │     │ id (UUID)           │
│ user_metadata       │     │ email               │
│  - full_name        │     │ username            │
│  - avatar_url       │     │ display_name        │
└─────────────────────┘     │ avatar_url          │
                            └──────────┬──────────┘
                                       │ 1:1
                                       ▼
                            ┌─────────────────────┐
                            │   public.pages      │
                            ├─────────────────────┤
                            │ id (UUID)           │
                            │ user_id (FK)        │
                            │ slug                │
                            └─────────────────────┘
```

## 동기화 흐름

### 1. OAuth 콜백 (신규 로그인)

```
Google OAuth 완료
       ↓
/api/auth/callback
       ↓
┌──────────────────────────────────────┐
│ 1. exchangeCodeForSession(code)      │
│ 2. supabase.auth.getUser()           │
│ 3. syncUserFromAuth(authUser)        │
│    ├─ findUserByAuthId() → 있으면 반환 │
│    ├─ 없으면 createUser()            │
│    └─ createDefaultPage()            │
└──────────────────────────────────────┘
       ↓
Redirect → /dashboard
```

### 2. 대시보드 접근 (기존 세션)

```
/dashboard 접근
       ↓
┌──────────────────────────────────────┐
│ 1. getUser() → authUser              │
│ 2. getEditorDataByAuthUserId()       │
│    └─ findUserWithPagesByAuthId()    │
│                                      │
│ 3. NOT_FOUND인 경우:                  │
│    ├─ syncUserFromAuth(authUser)     │
│    └─ getEditorDataByAuthUserId()    │
└──────────────────────────────────────┘
       ↓
EditorClient 렌더링
```

## 파일 구조

```
src/
├── app/
│   ├── api/auth/callback/
│   │   └── route.ts              # OAuth 콜백 처리
│   └── dashboard/
│       └── page.tsx              # 대시보드 (폴백 동기화)
│
├── lib/
│   ├── api/handlers/
│   │   └── auth.handlers.ts      # syncUserFromAuth()
│   │
│   ├── db/queries/
│   │   ├── user.queries.ts       # findUserByAuthId, createUser, findUserWithPagesByAuthId
│   │   └── page.queries.ts       # createDefaultPage, findPageByUserId
│   │
│   └── services/
│       └── user.service.ts       # getEditorDataByAuthUserId
```

## 핵심 함수

### syncUserFromAuth (auth.handlers.ts)

```typescript
async function syncUserFromAuth(authUser: AuthUser): Promise<Result<User>>;
```

1. `findUserByAuthId(authUser.id)` - 기존 사용자 조회
2. 존재하면 그대로 반환
3. 없으면:
    - `createUser()` - users 테이블에 INSERT
    - `createDefaultPage()` - pages 테이블에 INSERT

### 사용자 생성 시 필드 매핑

| Auth 소스                  | DB 필드        | 생성 방식                                 |
| -------------------------- | -------------- | ----------------------------------------- |
| `authUser.id`              | `auth_user_id` | 직접 매핑                                 |
| `authUser.email`           | `email`        | 직접 매핑                                 |
| `authUser.email`           | `username`     | 이메일 앞부분 + 랜덤 숫자                 |
| `user_metadata.full_name`  | `display_name` | 우선순위: full_name > name > email 앞부분 |
| `user_metadata.avatar_url` | `avatar_url`   | 직접 매핑 (없으면 빈 문자열)              |

## 주의사항

### ID 구분

- `authUser.id` = Supabase Auth UUID (`auth.users.id`)
- `user.id` = 앱 DB UUID (`public.users.id`)
- `user.auth_user_id` = Auth ID 참조 (`public.users.auth_user_id`)

### 조회 시 사용하는 ID

| 상황               | 사용 ID       | 함수                          |
| ------------------ | ------------- | ----------------------------- |
| 인증된 사용자 조회 | `authUser.id` | `findUserByAuthId()`          |
| 대시보드 데이터    | `authUser.id` | `getEditorDataByAuthUserId()` |
| 공개 페이지        | `username`    | `findUserWithPages()`         |

## 에러 처리

| 상황                   | 처리                                       |
| ---------------------- | ------------------------------------------ |
| 콜백에서 동기화 실패   | 로그만 남기고 진행 (기존 사용자일 수 있음) |
| 대시보드에서 NOT_FOUND | 동기화 시도 후 재조회                      |
| 동기화 후에도 실패     | 404 페이지 표시                            |
| 페이지 생성 실패       | 사용자는 반환, 로그 남김                   |
