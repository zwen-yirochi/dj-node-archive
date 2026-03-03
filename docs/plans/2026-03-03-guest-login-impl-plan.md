# Guest Login Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 로그인 페이지에 게스트 로그인 버튼을 추가하여 포트폴리오 데모 배포에서 Google OAuth 없이 대시보드를 체험할 수 있게 한다.

**Architecture:** 고정 데모 계정 1개를 Supabase Email Auth로 사전 생성하고, Server Action에서 `signInWithPassword`로 로그인. `NEXT_PUBLIC_DEMO_MODE` 환경변수로 게스트 버튼 표시를 제어하여 프로덕션/데모 배포를 동일 코드베이스로 분리.

**Tech Stack:** Next.js Server Actions, Supabase Auth (`signInWithPassword`), 환경변수 기반 조건부 렌더링

**Design Doc:** `docs/plans/2026-03-03-guest-login-demo-deploy-design.md`

---

### Task 1: `loginAsGuest` Server Action 추가

**Files:**

- Modify: `src/app/actions/auth.ts`

**Step 1: `loginAsGuest` 함수 추가**

`logout` 함수 위에 추가:

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

**Step 2: Commit**

```
feat(auth): add loginAsGuest server action
```

---

### Task 2: 로그인 페이지에 게스트 버튼 추가

**Files:**

- Modify: `src/app/login/page.tsx`

**Step 1: import에 `loginAsGuest` 추가**

```typescript
import { loginAsGuest, loginWithGoogle } from '@/app/actions/auth';
```

**Step 2: 에러 메시지에 guest 케이스 추가**

기존 에러 분기에 `guest_unavailable`과 `guest_failed` 추가:

```typescript
{
    error === 'auth_failed'
        ? 'Authentication failed. Please try again.'
        : error === 'oauth_failed'
          ? 'OAuth login failed. Please try again.'
          : error === 'guest_unavailable'
            ? 'Guest login is not available.'
            : error === 'guest_failed'
              ? 'Guest login failed. Please try again.'
              : 'An error occurred. Please try again.';
}
```

**Step 3: Google 로그인 form 아래에 게스트 버튼 추가**

Google 로그인 `</form>` 과 `<p>` (약관 텍스트) 사이에 추가:

```tsx
{
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
        <form action={loginAsGuest}>
            <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
                Try as Guest
            </button>
        </form>
    );
}
```

**Step 4: Commit**

```
feat(login): add conditional guest login button
```

---

### Task 3: 로컬 환경변수 추가 + 테스트

**Files:**

- Modify: `.env.local`

**Step 1: `.env.local`에 데모 환경변수 추가**

```
NEXT_PUBLIC_DEMO_MODE=true
DEMO_ACCOUNT_EMAIL=demo@djnodearchive.com
DEMO_ACCOUNT_PASSWORD=(Supabase에서 생성한 비밀번호)
```

> 이 단계는 Supabase에서 Email Auth 활성화 + 데모 계정 생성 이후에 실행.
> `.env.local`은 `.gitignore`에 포함되어 있으므로 커밋되지 않음.

**Step 2: 로컬에서 dev 서버 실행 후 확인**

```bash
pnpm dev
```

확인사항:

- `/login` 페이지에 "Try as Guest" 버튼이 보이는지
- 클릭 시 `/dashboard`로 이동하는지
- 대시보드에서 데모 계정 데이터가 표시되는지

---

### Task 4: Supabase 설정 (수동)

> 이 태스크는 Supabase 대시보드에서 수동으로 진행. 코드 변경 없음.

**Step 1: Email Auth Provider 활성화**

Supabase Dashboard → Authentication → Providers → Email → Enable

**Step 2: 데모 계정 생성**

Supabase Dashboard → Authentication → Users → "Add user"

- Email: `demo@djnodearchive.com`
- Password: 강력한 비밀번호 생성

**Step 3: Auth 유저 UUID 확인**

생성된 유저의 `id` (UUID)를 복사

**Step 4: 앱 DB에 데모 유저 시드**

`dashboard/page.tsx`의 fallback sync 로직이 있으므로, 게스트 로그인만 하면 `users` + `pages` 테이블에 자동 생성됨. 추가 시드 엔트리는 대시보드에서 직접 생성하면 됨.

---

### Task 5: Vercel 데모 프로젝트 배포 (수동)

> 이 태스크는 Vercel 대시보드에서 수동으로 진행. 코드 변경 없음.

**Step 1: Vercel 새 프로젝트 생성**

Vercel Dashboard → "Add New Project" → 같은 GitHub 레포 선택

**Step 2: 환경변수 설정**

| 변수                            | 값                       |
| ------------------------------- | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | 프로덕션과 동일          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 프로덕션과 동일          |
| `NEXT_PUBLIC_SITE_URL`          | 데모 Vercel URL          |
| `NEXT_PUBLIC_DEMO_MODE`         | `true`                   |
| `DEMO_ACCOUNT_EMAIL`            | `demo@djnodearchive.com` |
| `DEMO_ACCOUNT_PASSWORD`         | 생성한 비밀번호          |
| `SUPABASE_SERVICE_ROLE_KEY`     | 프로덕션과 동일          |
| `CRON_SECRET`                   | 별도 시크릿              |

**Step 3: 배포 확인**

- 데모 URL에서 "Try as Guest" 버튼 보이는지
- 게스트 로그인 → 대시보드 정상 작동하는지
- 프로덕션 URL에서 게스트 버튼이 안 보이는지
