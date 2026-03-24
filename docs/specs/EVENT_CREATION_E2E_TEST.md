# Event Creation E2E Test Scenarios

Dashboard에서 Event 생성 기능에 대한 E2E 테스트 시나리오입니다.

## 관련 컴포넌트

- `src/app/dashboard/components/ContentPanel/CreateEntryPanel.tsx`
- `src/app/dashboard/components/ContentPanel/CreateEventForm.tsx`
- `src/app/dashboard/constants/entry.ts` - 검증 규칙, 타입 정의
- `src/app/dashboard/services/search.ts` - Venue/Artist 검색 API

---

## 1. 기본 생성 플로우

### 1.1 Private 이벤트 생성 (최소 필수)

**단계:**

1. Dashboard 접속
2. TreeSidebar에서 Event 섹션의 + 버튼 클릭
3. Source: "Create new" 선택
4. Title 입력 ("Test Event")
5. Poster 이미지 업로드
6. Visibility: Private 선택 (기본값)
7. Create Event 클릭

**예상 결과:**

- 이벤트 생성 성공 Toast 표시
- CreatePanel 닫힘
- TreeSidebar Event 섹션에 새 이벤트 표시
- 새 이벤트 자동 선택됨

### 1.2 Publish 이벤트 생성 (전체 필드)

**단계:**

1. 모든 필드 입력:
    - Title: "Summer Festival 2024"
    - Poster: 이미지 업로드
    - Date: 2024-08-15
    - Venue: 검색하여 선택 또는 직접 입력
    - Lineup: 아티스트 2명 이상 추가
    - Description: 이벤트 설명 입력
2. Visibility: Publish 선택
3. Create Event 클릭

**예상 결과:**

- 이벤트 생성 성공
- Preview Panel에 새 이벤트 반영

### 1.3 생성 후 선택 상태

**전제:** 이벤트 생성 완료

**예상 결과:**

- 새 이벤트가 자동으로 선택됨
- ContentPanel에 해당 이벤트의 편집 폼 표시

---

## 2. 폼 검증 (Validation)

### 2.1 Title 필수 검증

**동작:** Title 필드를 비운 상태로 blur (포커스 해제)

**예상 결과:** "Title is required" 에러 메시지 표시

### 2.2 Title 최소 길이

**동작:** Title에 "A" (1글자) 입력 후 blur

**예상 결과:** "Title must be at least 2 characters" 에러 메시지

### 2.3 Title 최대 길이

**동작:** Title에 101자 이상 입력

**예상 결과:** "Title must be 100 characters or less" 에러 메시지

### 2.4 Poster 필수 검증

**동작:** Poster 없이 제출 시도

**예상 결과:** "Poster image is required" 에러 메시지

### 2.5 Create 버튼 비활성화 조건

**조건:** Title 또는 Poster 중 하나라도 없음

**예상 결과:** Create Event 버튼 disabled 상태

### 2.6 Create 버튼 활성화 조건

**조건:** Title (2자 이상) + Poster 모두 있음

**예상 결과:** Create Event 버튼 enabled 상태

---

## 3. Publish vs Private 검증

### 3.1 Publish 불가 상태 표시

**조건:** Title + Poster만 입력된 상태

**예상 결과:**

- Publish 옵션의 description이 "Fill all fields to enable publishing"으로 변경

### 3.2 Publish 선택 시도 (불완전 상태)

**동작:** 필수 필드만 있는 상태에서 Publish 클릭

**예상 결과:**

- Toast: "Cannot publish" / "All fields must be filled to publish."
- Private 상태 유지

### 3.3 Publish 가능 상태

**조건:** 모든 필드 입력 완료

**예상 결과:**

- Publish 옵션 정상 선택 가능
- description 원래대로 표시

### 3.4 Private → Publish 전환

**동작:**

1. 모든 필드 입력
2. Visibility를 Private에서 Publish로 변경

**예상 결과:** 정상 전환, Publish 상태로 제출 가능

---

## 4. 검색 기능 (Venue & Lineup)

### 4.1 Venue 검색

**동작:** Venue 필드에 "Club" 입력

**예상 결과:**

- API 호출 (`/api/venues/search?q=Club`)
- 드롭다운에 검색 결과 표시 (이름 + 도시)

### 4.2 Venue 선택

**동작:** 검색 결과에서 venue 선택

**예상 결과:**

- 필드에 선택한 venue.name 표시
- venue.id 저장

### 4.3 Venue 직접 입력

**동작:** 검색 결과 없이 새 이름 입력 후 blur

**예상 결과:**

- venue.id 없이 venue.name만 저장
- 새 venue로 처리

### 4.4 Lineup 검색

**동작:** Lineup 필드에 아티스트 이름 입력

**예상 결과:**

- API 호출 (`/api/artists/search?q=...&type=all`)
- Platform user (subtitle: "Platform user") 표시
- Artist reference (subtitle: "Artist reference") 표시

### 4.5 Lineup 다중 추가

**동작:** 여러 아티스트 순차 선택

**예상 결과:**

- 태그 형태로 누적 표시
- 각 태그에 X 버튼

### 4.6 Lineup 태그 제거

**동작:** 특정 아티스트 태그의 X 버튼 클릭

**예상 결과:** 해당 아티스트 lineup에서 제거

---

## 5. 이미지 업로드

### 5.1 이미지 업로드 성공

**동작:** 유효한 이미지 파일 선택

**예상 결과:**

- 클라이언트에서 압축 (browser-image-compression)
- Supabase Storage 업로드
- 미리보기 표시

### 5.2 큰 이미지 압축

**동작:** 5MB 이상 이미지 업로드

**예상 결과:**

- 1MB 이하로 압축
- WebP 포맷 변환
- 최대 1200px 리사이즈

### 5.3 이미지 교체

**동작:** 이미지가 있는 상태에서 다른 이미지 업로드

**예상 결과:** 새 이미지로 교체, 미리보기 업데이트

### 5.4 이미지 삭제

**동작:** 이미지 삭제 버튼 클릭

**예상 결과:**

- posterUrl 초기화
- 필수 검증 트리거 (blur 시)

---

## 6. 취소 및 초기화

### 6.1 Cancel 클릭

**동작:** 일부 필드 입력 후 Cancel 버튼 클릭

**예상 결과:**

- 폼 초기화 (`reset()` 호출)
- CreatePanel 닫힘

### 6.2 재진입 시 초기 상태

**동작:** Cancel 후 다시 Create new 선택

**예상 결과:** 모든 필드가 빈 상태로 표시

---

## 7. 에러 처리

### 7.1 서버 에러 (일반)

**조건:** API 500 응답

**예상 결과:**

- Toast 에러 메시지 표시
- 폼 상단에 root 에러 배너 표시
- 폼 데이터 유지

### 7.2 서버 에러 (필드별)

**조건:** 에러 메시지에 "title" 포함

**예상 결과:** title 필드에 에러 메시지 표시

### 7.3 네트워크 에러

**조건:** 오프라인 상태에서 제출

**예상 결과:**

- 에러 메시지 표시
- 폼 데이터 유지

### 7.4 에러 후 재시도

**동작:** 에러 발생 후 수정하여 재제출

**예상 결과:**

- 이전 에러 클리어 (`clearErrors('root')`)
- 정상 제출 처리

---

## 8. UX / 상태 관리

### 8.1 제출 중 로딩

**동작:** Create Event 클릭

**예상 결과:**

- 버튼에 스피너 표시
- 버튼 disabled 상태

### 8.2 중복 제출 방지

**동작:** 로딩 중 버튼 다시 클릭

**예상 결과:** 클릭 무시됨 (isSubmitting 체크)

### 8.3 mode: onTouched - 터치 전

**조건:** 필드를 한 번도 터치하지 않음

**예상 결과:** 에러 메시지 미표시

### 8.4 mode: onTouched - blur 후

**동작:** 필드 blur (포커스 해제)

**예상 결과:** 검증 실행, 에러 있으면 표시

### 8.5 실시간 재검증

**동작:** 에러 상태에서 올바른 값 입력

**예상 결과:** 입력과 동시에 에러 해제 (onChange 트리거)

---

## 테스트 우선순위

### P0 (필수 - MVP)

| ID  | 시나리오             |
| --- | -------------------- |
| 1.1 | Private 이벤트 생성  |
| 1.2 | Publish 이벤트 생성  |
| 2.1 | Title 필수 검증      |
| 2.4 | Poster 필수 검증     |
| 2.5 | Create 버튼 비활성화 |
| 5.1 | 이미지 업로드 성공   |

### P1 (중요)

| ID      | 시나리오          |
| ------- | ----------------- |
| 3.1-3.4 | Publish 로직 전체 |
| 4.1-4.5 | 검색 기능         |
| 6.1     | 취소 기능         |
| 8.1     | 로딩 상태         |

### P2 (권장)

| ID       | 시나리오         |
| -------- | ---------------- |
| 2.2, 2.3 | Title 길이 검증  |
| 5.2-5.4  | 이미지 세부 기능 |
| 7.x      | 에러 처리 전체   |
| 8.x      | UX 세부 사항     |

---

## 테스트 데이터

```typescript
// 최소 Private 이벤트
const minimalEvent = {
    title: 'Test Event',
    posterUrl: 'https://example.com/poster.jpg',
};

// 완전한 Publish 이벤트
const fullEvent = {
    title: 'Summer Festival 2024',
    posterUrl: 'https://example.com/poster.jpg',
    date: '2024-08-15',
    venue: { id: 'venue-1', name: 'Club Example' },
    lineup: [
        { id: 'artist-1', name: 'DJ One' },
        { id: 'artist-2', name: 'DJ Two' },
    ],
    description: 'Annual summer music festival featuring top DJs.',
};
```

---

## 관련 검증 규칙

```typescript
// src/app/dashboard/constants/entry.ts
export const EVENT_VALIDATION_RULES = {
    title: {
        required: 'Title is required',
        minLength: { value: 2, message: 'Title must be at least 2 characters' },
        maxLength: { value: 100, message: 'Title must be 100 characters or less' },
    },
    posterUrl: {
        required: 'Poster image is required',
    },
};
```
