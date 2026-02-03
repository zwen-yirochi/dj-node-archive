# Git 브랜치 전략

## 브랜치 구조

```
main     <- 프로덕션 (PR 병합만)
  └── dev    <- 개발 통합 브랜치 (기능 브랜치 → dev → main)
        └── feature branches
```

## 브랜치 네이밍

```
feat/<issue-number>-<short-description>   # 새 기능
fix/<issue-number>-<short-description>    # 버그 수정
refactor/<issue-number>-<description>     # 리팩토링
docs/<issue-number>-<description>         # 문서
```

예시:

- `feat/42-user-authentication`
- `fix/55-login-redirect-error`

## 워크플로우

1. `dev`에서 feature 브랜치 생성
2. 작업 완료 후 `dev`로 PR
3. `dev` → `main` PR (릴리스 시)

## 커밋

`/github-commit` 스킬 사용 → Conventional Commits 형식 자동 생성
