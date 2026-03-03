# Guest Login + Demo Deployment Design

> 작성일: 2026-03-03
> 목적: 포트폴리오 제출용 대시보드 데모 배포

## 배경

- 대시보드를 포트폴리오로 제출해야 하는 상황
- 면접관/리뷰어가 Google 로그인 없이 대시보드를 체험할 수 있어야 함
- GitHub Pages는 정적 호스팅이라 Next.js 서버 기능(API Routes, Server Actions, 미들웨어) 사용 불가 → **Vercel 무료 티어로 별도 배포**

## 결정사항

| 항목        | 결정                                    |
| ----------- | --------------------------------------- |
| 게스트 권한 | 풀 기능 (임시 계정)                     |
| 데이터 전략 | 고정 데모 계정 1개를 모든 게스트가 공유 |
| 배포 환경   | 같은 Supabase DB + 별도 Vercel 프로젝트 |
| 인증 방식   | `signInWithPassword` via Server Action  |

## 아키텍처

```
┌─────────────────────────────────────────────────┐
│  GitHub Repository (동일)                        │
├────────────────────┬────────────────────────────┤
│  Vercel 프로덕션    │  Vercel 데모               │
│  djnodearchive.com │  xxx-demo.vercel.app       │
│                    │                            │
│  환경변수:          │  환경변수:                  │
│  DEMO_MODE 없음     │  NEXT_PUBLIC_DEMO_MODE=true│
│  → 게스트 버튼 없음  │  DEMO_ACCOUNT_EMAIL=...   │
│                    │  DEMO_ACCOUNT_PASSWORD=... │
├────────────────────┴────────────────────────────┤
│  Supabase (공유)                                 │
│  - 동일 DB, 동일 Auth, 동일 RLS                   │
│  - 데모 계정: Auth User + users/pages/entries 시드 │
└─────────────────────────────────────────────────┘
```

## 구현 상세

### 1. Supabase 설정 (수동, 1회)

#### 1-1. Email Auth Provider 활성화

Supabase Dashboard → Authentication → Providers → Email → Enable

> 현재 Google OAuth만 활성화되어 있음. Email provider를 추가해야 `signInWithPassword` 사용 가능.

#### 1-2. 데모 Auth 유저 생성

Supabase Dashboard → Authentication → Users → "Add user"

- Email: `demo@djnodearchive.com`
- Password: 강력한 비밀번호 생성 후 환경변수에 저장

#### 1-3. 시드 데이터

데모 Auth 유저의 `id`(UUID)를 확인한 후:

1. `users` 테이블: `auth_user_id` = Auth UUID, `username`, `display_name` 등 설정
2. `pages` 테이블: 해당 user의 기본 페이지 생성
3. `entries` 테이블: 다양한 타입의 엔트리 시드 (event, mixset, link 등)

> `syncUserFromAuth`는 OAuth callback에서만 호출됨. `signInWithPassword`는 이 경로를 타지 않으므로 시드 데이터가 반드시 사전에 존재해야 함.
> 단, `dashboard/page.tsx`에 fallback sync 로직이 있어서 (`NOT_FOUND` 시 `syncUserFromAuth` 재시도) Auth 유저만 있으면 최소한 빈 대시보드는 열림.

### 2. 환경변수

| 변수명                  | 접두사         | 용도                  | 프로덕션     | 데모                     |
| ----------------------- | -------------- | --------------------- | ------------ | ------------------------ |
| `NEXT_PUBLIC_DEMO_MODE` | `NEXT_PUBLIC_` | 게스트 버튼 표시 여부 | ❌ 없음      | `true`                   |
| `DEMO_ACCOUNT_EMAIL`    | (없음)         | 데모 계정 이메일      | ❌ 없음      | `demo@djnodearchive.com` |
| `DEMO_ACCOUNT_PASSWORD` | (없음)         | 데모 계정 비밀번호    | ❌ 없음      | `(비밀번호)`             |
| `NEXT_PUBLIC_SITE_URL`  | `NEXT_PUBLIC_` | OAuth redirect origin | 프로덕션 URL | 데모 URL                 |

**보안 포인트:**

- `DEMO_ACCOUNT_EMAIL`과 `DEMO_ACCOUNT_PASSWORD`는 `NEXT_PUBLIC_` 접두사가 **없으므로** 클라이언트 번들에 포함되지 않음
- Server Action 내에서만 `process.env`로 접근 → 서버에서만 실행됨

### 3. 코드 변경

#### 3-1. `src/app/actions/auth.ts` — `loginAsGuest()` 추가

```typescript
export async function loginAsGuest() {
    const email = process.env.DEMO_ACCOUNT_EMAIL;
    const password = process.env.DEMO_ACCOUNT_PASSWORD;

    if (!email || !password) {
        redirect('/login?error=guest_unavailable');
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        redirect('/login?error=guest_failed');
    }

    redirect('/dashboard');
}
```

**동작 흐름:**

1. Server Action에서 `createClient()` 호출 → `@supabase/ssr`의 cookie-based 서버 클라이언트
2. `signInWithPassword` 성공 → 세션 토큰이 쿠키에 자동 설정 (Server Action에서 `cookies()`는 writable)
3. `redirect('/dashboard')` → 브라우저가 새 쿠키와 함께 dashboard로 이동
4. 미들웨어가 `supabase.auth.getUser()`로 세션 확인 → 통과
5. `dashboard/page.tsx`가 `getEditorDataByAuthUserId(authUser.id)` → 데모 유저 데이터 로드

#### 3-2. `src/app/login/page.tsx` — 게스트 버튼 추가

```tsx
{
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
        <form action={loginAsGuest}>
            <button type="submit" className="...">
                게스트로 체험하기
            </button>
        </form>
    );
}
```

> `process.env.NEXT_PUBLIC_DEMO_MODE`는 빌드 타임에 인라인되므로, 프로덕션 빌드에서는 이 블록 자체가 dead code로 제거됨.

### 4. 변경 파일 요약

| 파일                      | 변경 내용                                    | 줄 수 |
| ------------------------- | -------------------------------------------- | ----- |
| `src/app/actions/auth.ts` | `loginAsGuest()` Server Action 추가          | ~15줄 |
| `src/app/login/page.tsx`  | 게스트 버튼 조건부 렌더링 + 에러 메시지 추가 | ~10줄 |

**기존 코드 수정 없음.** 순수 추가만.

## 보안 분석

### URL 조작 / 권한 탈취 방지

데모 유저가 URL을 조작해서 다른 유저의 데이터에 접근하려는 시나리오:

| 공격 벡터                                       | 방어                                          | 위치                   |
| ----------------------------------------------- | --------------------------------------------- | ---------------------- |
| `/api/entries/[다른유저의entryId]` PATCH/DELETE | `verifyEntryOwnership(entryId, userId)` → 403 | `lib/api/ownership.ts` |
| `/api/pages/[다른유저의pageId]` PATCH           | `verifyPageOwnership(pageId, userId)` → 403   | `lib/api/ownership.ts` |
| `/api/users/[다른유저의userId]` PATCH           | `userId !== context.user.id` → 403            | `user.handlers.ts`     |
| 브라우저에서 직접 Supabase API 호출             | RLS 정책이 `auth.uid()` 기반으로 필터링       | Supabase RLS           |

**결론: 데모 유저는 자기 데이터만 CRUD 가능. 다른 유저 데이터 접근 불가.**

### 데모 계정 비밀번호 보안

- 비밀번호는 `DEMO_ACCOUNT_PASSWORD` 서버 환경변수에만 존재
- 프로덕션에 이 환경변수가 없으므로, 프로덕션에서 데모 로그인 불가
- 로그인 페이지에 이메일/비밀번호 입력 폼이 없으므로, 데모 사이트에서도 직접 입력 로그인 불가
- 게스트 버튼을 통해서만 로그인 가능 (Server Action 경유)

### 데모 데이터 무결성

- 모든 게스트가 같은 데모 계정을 공유하므로, 한 게스트가 데이터를 수정/삭제하면 다음 게스트에게도 영향
- **대응 방안 (선택):**
    - 수동 리셋: 시드 SQL 스크립트 준비 → 데이터 망가지면 실행
    - 자동 리셋: Supabase cron 또는 Vercel cron으로 주기적 리셋 (현재 cron 인프라 있음)
    - 포트폴리오 시연 직전에 수동 리셋이면 충분할 수 있음

## Vercel 데모 프로젝트 배포 절차

1. Vercel Dashboard → "Add New Project"
2. 같은 GitHub 레포 선택
3. Project Settings:
    - Framework: Next.js (자동 감지)
    - Root Directory: `.` (기본값)
    - Build Command: 기본값
4. Environment Variables 설정:
    - `NEXT_PUBLIC_SUPABASE_URL` — 프로덕션과 동일
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 프로덕션과 동일
    - `NEXT_PUBLIC_SITE_URL` — 데모 Vercel URL
    - `NEXT_PUBLIC_DEMO_MODE` — `true`
    - `DEMO_ACCOUNT_EMAIL` — 데모 계정 이메일
    - `DEMO_ACCOUNT_PASSWORD` — 데모 계정 비밀번호
    - `SUPABASE_SERVICE_ROLE_KEY` — 프로덕션과 동일 (cron용)
    - `CRON_SECRET` — 별도 값 설정

> **주의:** 같은 레포에서 두 Vercel 프로젝트가 배포되므로, main 브랜치에 push하면 양쪽 다 배포됨. 이것이 원하는 동작임 (코드는 동일, 환경변수만 다름).

## 위키 노출

데모 배포에서 위키(`(dna)` 라우트)도 그대로 노출한다.

- 같은 Supabase DB를 공유하므로 프로덕션 유저들의 공개 데이터도 보임 (원래 공개 데이터라 문제 없음)
- 대시보드에서 수정 → 위키에 반영되는 플로우를 시연할 수 있어서 포트폴리오로서 더 풍성함
- 별도 라우트 차단 없음

## 구현 순서

1. Supabase Email Auth 활성화 + 데모 계정 생성
2. `auth.ts`에 `loginAsGuest()` 추가
3. `login/page.tsx`에 게스트 버튼 추가
4. 로컬에서 `DEMO_MODE=true`로 테스트
5. 데모 시드 데이터 준비
6. Vercel 데모 프로젝트 생성 + 환경변수 설정
7. 배포 확인
