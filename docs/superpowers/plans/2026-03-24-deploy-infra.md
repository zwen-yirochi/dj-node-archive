# Deploy Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sentry 에러/성능 모니터링, main 브랜치 보호, Storybook Vercel 배포를 설정한다.

**Architecture:** Sentry는 `@sentry/nextjs@^9`으로 Next.js 16 App Router에 통합. Vercel Marketplace로 환경변수 자동 주입. Branch protection은 gh API로 설정. Storybook은 Vercel 별도 프로젝트로 dev 브랜치 추적.

**Tech Stack:** @sentry/nextjs ^9, Next.js 16, Vercel, gh CLI

---

## File Map

| Action | Path                        | Responsibility                                            |
| ------ | --------------------------- | --------------------------------------------------------- |
| Create | `instrumentation-client.ts` | 브라우저 Sentry SDK 초기화 (Next.js 16 file convention)   |
| Create | `sentry.server.config.ts`   | Node.js Sentry SDK 초기화                                 |
| Create | `instrumentation.ts`        | Next.js instrumentation hook (서버 init + onRequestError) |
| Create | `src/app/global-error.tsx`  | App Router 루트 에러 바운더리                             |
| Modify | `next.config.ts`            | withSentryConfig 래핑                                     |
| Modify | `.gitignore`                | storybook-static 추가                                     |

Note: `instrumentation-client.ts`는 Next.js 15.3+의 file convention. Next.js가 자동으로 로드하므로 `instrumentation.ts`에서 import하지 않는다.

---

### Task 1: Install @sentry/nextjs

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install @sentry/nextjs@^9
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('@sentry/nextjs')" && echo "OK"
```

Expected: `OK` (no errors)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @sentry/nextjs dependency"
```

---

### Task 2: Create Sentry config files

**Files:**

- Create: `instrumentation-client.ts` (project root)
- Create: `sentry.server.config.ts` (project root)
- Create: `instrumentation.ts` (project root)

- [ ] **Step 1: Create instrumentation-client.ts** (project root)

Next.js 16 file convention — 자동으로 브라우저에서 로드됨.

```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.5,
    debug: false,
});
```

- [ ] **Step 2: Create sentry.server.config.ts** (project root)

```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.5,
    debug: false,
});
```

- [ ] **Step 3: Create instrumentation.ts** (project root)

`register()`는 서버 시작 시 호출. `onRequestError`는 서버 요청 에러 캐치.
`SENTRY_AUTH_TOKEN`은 환경변수에서 자동으로 읽힘 (withSentryConfig에 명시 불필요).

```ts
import * as Sentry from '@sentry/nextjs';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config');
    }
}

export const onRequestError = Sentry.captureRequestError;
```

- [ ] **Step 4: Commit**

```bash
git add instrumentation-client.ts sentry.server.config.ts instrumentation.ts
git commit -m "feat(sentry): add client, server, and instrumentation configs"
```

---

### Task 3: Create global-error.tsx

**Files:**

- Create: `src/app/global-error.tsx`

- [ ] **Step 1: Create the error boundary**

```tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html>
            <body>
                <h2>Something went wrong!</h2>
                <button onClick={() => reset()}>Try again</button>
            </body>
        </html>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/global-error.tsx
git commit -m "feat(sentry): add global error boundary with Sentry reporting"
```

---

### Task 4: Wrap next.config.ts with Sentry

**Files:**

- Modify: `next.config.ts`

- [ ] **Step 1: Update next.config.ts**

Current file exports a plain `nextConfig`. Wrap with `withSentryConfig`:

```ts
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            {
                protocol: 'https',
                hostname: 'api.dicebear.com',
            },
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
};

export default withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,
});
```

- [ ] **Step 2: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds. Sentry warnings about missing DSN are OK in local (env vars not set locally).

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(sentry): wrap next.config with withSentryConfig"
```

---

### Task 5: Set up main branch protection

**Files:** None (GitHub API only)

- [ ] **Step 1: Create branch protection rule via gh API**

```bash
gh api repos/zwen-yirochi/dj-node-archive/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_pull_request_reviews": {
    "required_approving_review_count": 0
  },
  "enforce_admins": false,
  "required_status_checks": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

- [ ] **Step 2: Verify protection is active**

```bash
gh api repos/zwen-yirochi/dj-node-archive/branches/main/protection \
  --jq '{required_pull_request_reviews: .required_pull_request_reviews.required_approving_review_count, allow_force_pushes: .allow_force_pushes.enabled, allow_deletions: .allow_deletions.enabled}'
```

Expected: `{"required_pull_request_reviews":0,"allow_force_pushes":false,"allow_deletions":false}`

---

### Task 6: Add storybook-static to .gitignore and prep for Vercel deploy

**Files:**

- Modify: `.gitignore`

- [ ] **Step 1: Add storybook-static to .gitignore**

Append to `.gitignore` under a new `# storybook` section:

```
# storybook
/storybook-static
```

- [ ] **Step 2: Verify local Storybook build works**

```bash
npm run build-storybook
```

Expected: Build succeeds, `storybook-static/` directory created.

- [ ] **Step 3: Verify storybook-static is ignored**

```bash
git status
```

Expected: `storybook-static/` does NOT appear in untracked files.

- [ ] **Step 4: Clean up build output**

```bash
rm -rf storybook-static
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore
git commit -m "chore: add storybook-static to .gitignore"
```

- [ ] **Step 6: User action — Create Vercel Storybook project**

사용자가 Vercel 대시보드에서 수행할 작업:

1. Vercel Dashboard → "Add New Project"
2. 같은 repo (`zwen-yirochi/dj-node-archive`) 선택
3. Project Name: `storybook-dj-archive`
4. Framework Preset: "Other"
5. Build Command: `npm run build-storybook`
6. Output Directory: `storybook-static`
7. Production Branch: `dev`
8. Deploy

---

### Task 7: User action — Vercel Marketplace Sentry integration

사용자가 Vercel 대시보드에서 수행할 작업:

- [ ] **Step 1: Install Sentry integration**

1. Vercel Dashboard → Integrations → "Sentry" 검색
2. "Add Integration" → Sentry 계정 생성/연결
3. dev 프로젝트 선택하여 연결
4. 환경변수 자동 주입 확인: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

- [ ] **Step 2: Trigger deploy and verify**

1. 이 브랜치를 dev에 머지하면 Vercel dev 프로젝트 자동 배포
2. 배포 완료 후 사이트에서 브라우저 콘솔에 `throw new Error('Sentry test')` 실행
3. Sentry 대시보드에서 에러 수신 확인
4. Performance 탭에서 트레이싱 데이터 확인

---

## Execution Order

1. Task 1 → 2 → 3 → 4 (Sentry 코드 작업, 순차)
2. Task 5 (Branch protection, 독립)
3. Task 6 (Storybook gitignore, 독립)
4. Task 7 (Vercel 설정 — 코드 작업 완료 후 사용자 수동)

Task 5와 Task 6은 독립적이므로 병렬 실행 가능.
