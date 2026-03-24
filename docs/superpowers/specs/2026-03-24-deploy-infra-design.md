# Deploy Infrastructure Design

Date: 2026-03-24
Branch: `infra/sentry-storybook-branch-protection`
Target: dev only (main untouched, except branch protection which is a GitHub setting)

## 1. Sentry (Error + Performance Monitoring)

### Setup Method

Vercel Marketplace integration — auto-creates Sentry account/project, injects env vars.

### Packages

- `@sentry/nextjs@^10` (Next.js 16 + App Router 지원. v9는 Next.js 16 미지원)

### Files to Create/Modify

- `instrumentation-client.ts` — 브라우저 SDK 초기화 (Next.js 16 file convention, 구 sentry.client.config.ts 대체)
- `sentry.server.config.ts` — Node.js SDK 초기화
- `instrumentation.ts` — Next.js instrumentation hook (서버 Sentry init + onRequestError)
- `src/app/global-error.tsx` — App Router 루트 에러 바운더리 (Sentry 리포트)
- `next.config.ts` — `withSentryConfig` 래핑

Note: `sentry.edge.config.ts`는 생략 — 프로젝트에 edge runtime 사용 없음.

### Configuration

- `tracesSampleRate: 0.5` (성능 트레이싱 50% 샘플링 — 무료 플랜 고려)
- 소스맵: Vercel 빌드 시 자동 업로드 (v10 기본값 `deleteSourcemapsAfterUpload: true`)
- dev 환경변수만 세팅 (SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN)

### Verification

- 배포 후 테스트 에러 발생시켜 Sentry 대시보드에서 수신 확인
- 성능 트레이싱 데이터 수신 확인

## 2. Main Branch Protection

### Level

Light protection — PR required, self-merge allowed.

### Rules (GitHub Settings)

- Require pull request before merging: ON
- Required approvals: 0
- Allow force pushes: OFF
- Allow deletions: OFF

### Scope Clarification

main 브랜치에 보호 규칙을 설정하는 것. 코드 변경이 아닌 GitHub 설정 변경이므로 "main untouched" 스코프와 충돌 없음.

### Implementation

`gh api`로 자동화.

## 3. Storybook Deployment (Vercel)

### Setup

- Vercel 새 프로젝트: 같은 repo, 이름 `storybook-dj-archive` (또는 유사)
- Production Branch: `dev`
- Build Command: `npm run build-storybook`
- Output Directory: `storybook-static`
- Install Command: `npm install` (기본)

### Code Changes

- `.gitignore`에 `storybook-static` 추가 (현재 없음)

### Runtime Dependencies

- 기존 34개 stories 확인 완료: supabase, server-only, next/headers 등 서버 의존성 없음
- Storybook 빌드에 문제 없을 것으로 판단

## Execution Order

1. Sentry 설정 (코드 변경 + Vercel Marketplace — 사용자 수동 작업 안내)
2. Branch protection (gh CLI)
3. Storybook 배포 (Vercel 프로젝트 생성 — 사용자 수동 작업 안내)

## Out of Scope

- GitHub Actions CI/CD
- main 브랜치 배포 변경
- Chromatic / 비주얼 리그레션 테스트
- Edge runtime Sentry 설정
