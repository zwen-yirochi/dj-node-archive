# Git 브랜치 전략

## 브랜치 구조 (GitHub Flow 기반 간소화)

### 메인 브랜치

- `main`: 프로덕션 배포 브랜치 (항상 배포 가능한 상태)

### 작업 브랜치

- `feat/기능명`: 새로운 기능 개발
- `fix/버그명`: 버그 수정
- `refactor/내용`: 리팩토링
- `docs/내용`: 문서 작업
- `chore/내용`: 설정, 빌드 관련

## 워크플로우

1. **이슈 생성** (선택사항이지만 권장)
    - GitHub Issues에 작업 내용 등록
    - 라벨 지정 (bug, enhancement, documentation 등)

2. **브랜치 생성**

```bash
   git checkout -b feat/user-authentication
```

3. **개발 및 커밋**

```bash
   git add .
   git commit
   # (커밋 템플릿이 열림)
```

4. **푸시 및 PR**

```bash
   git push origin feat/user-authentication
```

- GitHub에서 PR 생성
- 셀프 리뷰 후 머지

5. **브랜치 삭제**

```bash
   git branch -d feat/user-authentication
```

## 커밋 컨벤션

### 기본 형식

```
<타입>: <제목>

<본문> (선택)

<꼬리말> (선택)
```

### 예시

```
feat: 사용자 로그인 기능 구현

- JWT 토큰 기반 인증 시스템 추가
- Supabase Auth 연동
- 로그인 폼 UI 구현

Resolves: #12
```

## 릴리즈 전략

- `main` 브랜치에 머지 = 프로덕션 배포
- Vercel 자동 배포 활용
- 필요시 `git tag`로 버전 관리

```bash
  git tag v1.0.0
  git push origin v1.0.0
```
