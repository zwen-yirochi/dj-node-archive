# CORTEX Design System QA Guide

> Branch: `feat/cortex-design-system`
> 작성일: 2025-02-13

---

## 체크리스트

### Landing `/`

- [ ] TopNav 렌더 (DNA: 로고, Archive/Discovery 링크)
- [ ] Hero 타이틀 + 설명 텍스트
- [ ] CTA 버튼 2개 (시작하기, 탐색하기) → 각각 `/login`, `/discover` 이동
- [ ] Feature AsciiBox 3개 (공연 기록, 아티스트 연결, 쉬운 공유)
- [ ] Discovery CTA 섹션
- [ ] Footer

### Discovery `/discover`

- [ ] 검색 필드 동작
- [ ] 도시 필터 태그 동작
- [ ] 베뉴 목록 (NodeItem) 렌더 + 클릭 → `/venues/{slug}` 이동
- [ ] 빈 검색 결과 → "// NO RESULTS" 표시
- [ ] 모바일: PathBar 숨김

### User Profile `/{username}`

- [ ] 프로필 이미지 원본 톤 렌더
- [ ] displayName, username, bio 표시
- [ ] 태그 (DJ, Events, Mixset) 조건부 표시
- [ ] 소셜 링크 (Instagram, SoundCloud)
- [ ] ShareButton → 클릭 시 SHARE↔COPIED 토글 (크기 고정)
- [ ] StatsRow (Events, Venues, Other, Total)
- [ ] MetaTable 2열 (모바일 1열)
- [ ] Event History — 모바일: EntryCard 리스트 / 데스크탑: 카드 그리드(상위 3) + Timeline
- [ ] EntryCard 베뉴 accent-blue + [VN-XXXX] 코드
- [ ] Other Entries (Mixset, Link)
- [ ] 이벤트 카드 클릭 → `/event/{id}` 이동
- [ ] Footer

### Venue Detail `/venues/{slug}`

- [ ] 베뉴 이름 + VN-XXXX 코드
- [ ] Source: RA 뱃지 (해당 시)
- [ ] 위치 정보 (address, city, country)
- [ ] 외부 링크 (Instagram, Website, Google Maps, RA)
- [ ] StatsRow (Events, Upcoming, Artists, Source)
- [ ] MetaTable (Venue Info + External Links)
- [ ] Upcoming Events 섹션 (미래 이벤트 있을 때)
- [ ] Event History 섹션 — 5개씩 페이지네이션 ("+ N more events" 버튼)
- [ ] 이벤트 없을 때 → AsciiBox "NO EVENTS RECORDED"
- [ ] 이벤트 클릭 → `/event/{id}` 이동
- [ ] Footer

### Event Detail `/event/{id}`

- [ ] 포스터 이미지 렌더 (없으면 "// NO POSTER")
- [ ] 이벤트 제목 + 날짜 (YYYY.MM.DD // DAY)
- [ ] 베뉴 accent-blue + [VN-XXXX] 코드
- [ ] MetaTable (Event Info + Archive Status)
- [ ] Lineup 리스트 (번호 + ART 뱃지)
- [ ] Description (있을 때)
- [ ] External Links (있을 때)
- [ ] Footer

### 미변경 페이지 (Side Effect 확인)

- [ ] `/dashboard` — 기존 에디터 정상 동작, 스타일 변화 없음
- [ ] `/login` — 기존 로그인 정상 동작, 스타일 변화 없음

### 크로스 브라우저 / 반응형

- [ ] 모바일 (375px~) — 레이아웃 깨짐 없음
- [ ] 태블릿 (768px~) — md 브레이크포인트 전환 정상
- [ ] 데스크탑 (1080px~) — max-w-cortex 적용

---

## 피드백 템플릿

QA 후 아래 형식으로 전달하면 바로 수정 작업 가능합니다.

```
## QA 피드백

### 버그 (기능 오류)
1. **페이지**: `/venues/xxx`
   **현상**: 더보기 버튼 클릭해도 이벤트가 추가 안됨
   **기대**: 5개씩 추가 로드

### UI/디자인 수정
1. **페이지**: `/{user}` 모바일
   **현상**: EntryCard 썸네일이 너무 작음
   **기대**: 높이 100px 이상
   **스크린샷**: (있으면 첨부)

### 데이터 이슈
1. **페이지**: `/event/xxx`
   **현상**: 라인업이 빈 배열로 표시됨
   **실제 DB**: lineup에 3명 있음

### 추가 요청
1. **페이지**: `/venues/{slug}`
   **내용**: 베뉴 이미지도 보여줬으면 좋겠음
```

### 피드백 우선순위 태그 (선택)

- `[P0]` 페이지 깨짐 / 에러 / 이동 불가
- `[P1]` 기능 오작동 / 데이터 안 보임
- `[P2]` UI 수정 / 크기·여백·색상 조정
- `[P3]` 추가 기능 요청 / 개선 아이디어

---

## 페이지별 테스트 URL 예시

| 페이지       | URL                                           |
| ------------ | --------------------------------------------- |
| Landing      | `http://localhost:3000/`                      |
| Discovery    | `http://localhost:3000/discover`              |
| User Profile | `http://localhost:3000/{실제 username}`       |
| Venue Detail | `http://localhost:3000/venues/{실제 slug}`    |
| Event Detail | `http://localhost:3000/event/{실제 event id}` |
| Dashboard    | `http://localhost:3000/dashboard`             |
| Login        | `http://localhost:3000/login`                 |
| Demo         | `http://localhost:3000/demo`                  |
