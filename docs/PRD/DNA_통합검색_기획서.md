# DJ Node Archive - 통합 검색 기능 기획서

## 📋 목차

1. [기능 개요](#1-기능-개요)
2. [유저 플로우](#2-유저-플로우)
3. [검색 대상 및 표시 정보](#3-검색-대상-및-표시-정보)
4. [검색 로직](#4-검색-로직)
5. [카테고리 전용 검색](#5-카테고리-전용-검색)
6. [API 설계](#6-api-설계)
7. [기술 구현 방안](#7-기술-구현-방안)
8. [엣지 케이스 및 예외 처리](#8-엣지-케이스-및-예외-처리)
9. [향후 확장 계획](#9-향후-확장-계획)

---

## 1. 기능 개요

### 한 줄 소개

하나의 검색창에서 Artists, Venues, Events를 동시에 탐색할 수 있는 실시간 통합 검색

### 핵심 특징

- **통합 검색**: 하나의 키워드로 세 가지 엔티티(Artists, Venues, Events) 동시 검색
- **실시간 자동완성**: 타이핑하면서 즉시 결과 표시
- **카테고리별 구분 표시**: RA와 유사하게 결과가 카테고리별로 나뉘어 표시
- **비로그인 사용 가능**: Discovery 페이지의 탐색 기능으로 누구나 접근 가능

### 진입점

- **Discovery 페이지 상단**에 검색바 배치
- 별도 모달이나 페이지 이동 없이 바로 검색 가능

---

## 2. 유저 플로우

### 2.1 통합 검색 플로우

```
Discovery 페이지 진입
    ↓
상단 검색바에 키워드 입력 (예: "cake")
    ↓
실시간 결과 표시 (타이핑 중 자동 갱신)
    ↓
┌─────────────────────────────────────────────┐
│  🔍 cake                                    │
├─────────────────────────────────────────────┤
│                                             │
│  Artists                                    │
│  ┌─────────────────────────────────────┐    │
│  │ 🎵 Cakebutcher        Seoul        │    │
│  │ 🎵 Cake               Russia       │    │
│  │ 🎵 Cotton Cake        UK           │    │
│  │ ...                                │    │
│  │ [더 보기 →]                         │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Venues                                     │
│  ┌─────────────────────────────────────┐    │
│  │ 📍 Cakeshop            Seoul       │    │
│  │ 📍 Cake Club           Berlin      │    │
│  │ 📍 Cake Shop           New York    │    │
│  │ ...                                │    │
│  │ [더 보기 →]                         │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Events                                     │
│  ┌─────────────────────────────────────┐    │
│  │ 📅 PIECE OF CAKE Vol.6             │    │
│  │    FRI, 13 MAR · Kyoto · West...   │    │
│  │ 📅 Cake Party                      │    │
│  │    SAT, 22 FEB · Seoul · Cake...   │    │
│  │ ...                                │    │
│  │ [더 보기 →]                         │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
    ↓
항목 클릭 → 해당 페이지로 이동
├─ Artist 클릭 → /username
├─ Venue 클릭 → /venue/{slug}
└─ Event 클릭 → 이벤트 상세 페이지
    ↓
[더 보기] 클릭 → 카테고리 전용 검색 페이지로 이동
├─ Artists 더 보기 → /search/artists?q=cake
├─ Venues 더 보기 → /search/venues?q=cake
└─ Events 더 보기 → /search/events?q=cake
```

### 2.2 카테고리 전용 검색 플로우

```
통합 검색에서 [더 보기] 클릭
    ↓
카테고리 전용 검색 페이지
(예: /search/venues?q=cake)
    ↓
┌─────────────────────────────────────────────┐
│  🔍 cake                    [Venues 검색]   │
├─────────────────────────────────────────────┤
│                                             │
│  📍 Cakeshop              Seoul             │
│  📍 Cake Club             Berlin            │
│  📍 Cake Shop             New York City     │
│  📍 Cake                  Berlin            │
│  📍 Cake                  Scotland          │
│  📍 Cake                  Sydney            │
│  📍 Cake Scottsdale       Arizona           │
│  📍 Cake Cabaret          Toronto           │
│  ...                                        │
│                                             │
│  [더 불러오기] (무한 스크롤 또는 페이지네이션)  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 3. 검색 대상 및 표시 정보

### 3.1 검색 대상 엔티티

| 카테고리 | 테이블             | 검색 필드                       |
| -------- | ------------------ | ------------------------------- |
| Artists  | `users`            | `username`, `display_name`      |
| Venues   | `venue_references` | `name`, `city`                  |
| Events   | `events`           | `title`, `data->>'lineup_text'` |

### 3.2 카테고리별 결과 표시 정보

#### Artists

```
┌──────────────────────────────────────┐
│ [아바타]  Display Name     Country   │
│           @username                  │
└──────────────────────────────────────┘
```

| 필드         | 소스                 | 비고                |
| ------------ | -------------------- | ------------------- |
| 아바타       | `users.avatar_url`   | 없으면 기본 아이콘  |
| Display Name | `users.display_name` |                     |
| Username     | `users.username`     | `@username` 형태    |
| Country      | 추후 확장 가능       | MVP에서는 생략 가능 |

#### Venues

```
┌──────────────────────────────────────┐
│ [아이콘]  Venue Name       City      │
│           N events                   │
└──────────────────────────────────────┘
```

| 필드       | 소스                      | 비고                     |
| ---------- | ------------------------- | ------------------------ |
| 아이콘     | 기본 장소 아이콘          |                          |
| Venue Name | `venue_references.name`   |                          |
| City       | `venue_references.city`   |                          |
| Event 수   | `events` 테이블에서 count | 해당 베뉴의 총 이벤트 수 |

#### Events

```
┌──────────────────────────────────────┐
│ [날짜]   Event Title                 │
│  FRI     City · Venue Name           │
│  13 MAR  Lineup text (truncated)     │
└──────────────────────────────────────┘
```

| 필드        | 소스                          | 비고                              |
| ----------- | ----------------------------- | --------------------------------- |
| 날짜        | `events.date`                 | 요일 + 일 + 월 형태 (FRI, 13 MAR) |
| Event Title | `events.title`                | 없으면 "Performance at {venue}"   |
| City        | `venue_references.city`       | 베뉴 조인                         |
| Venue Name  | `venue_references.name`       | 베뉴 조인                         |
| Lineup      | `events.data->>'lineup_text'` | 잘려서 표시 (max 50자)            |

### 3.3 결과 표시량

| 항목                           | 값                                                  |
| ------------------------------ | --------------------------------------------------- |
| 통합 검색 카테고리별 최대 표시 | **10건**                                            |
| 10건 초과 시                   | **[더 보기]** 링크 → 카테고리 전용 검색 페이지 이동 |
| 카테고리 전용 검색 페이지      | 무한 스크롤 또는 페이지네이션 (20건씩)              |

---

## 4. 검색 로직

### 4.1 관련도 정렬 기준

검색 결과는 **관련도순**으로 정렬하며, 관련도는 다음 기준으로 산정:

**1순위: 정확 일치 (Exact Match)**

- 검색어와 이름이 정확히 일치하는 결과가 최상단
- 예: "cakeshop" 검색 → "Cakeshop"이 "Cakeshop Seoul Party" 보다 먼저

**2순위: 접두사 일치 (Prefix Match)**

- 검색어로 시작하는 결과
- 예: "cake" 검색 → "Cakeshop", "Cakebutcher" 등

**3순위: 부분 일치 (Contains)**

- 검색어가 포함된 결과
- 예: "cake" 검색 → "Piece of Cake Vol.6"

### 4.2 실시간 검색 최적화

| 항목              | 값                                                      |
| ----------------- | ------------------------------------------------------- |
| 디바운스          | 입력 후 **300ms** 대기 후 요청                          |
| 최소 입력 글자 수 | **2자** 이상부터 검색 실행                              |
| 요청 취소         | 새 입력 발생 시 이전 요청 자동 취소 (AbortController)   |
| 캐싱              | 동일 키워드 결과를 클라이언트에서 짧은 시간 캐싱 (30초) |

### 4.3 검색 필드별 가중치

| 카테고리 | 필드                   | 가중치 | 이유                          |
| -------- | ---------------------- | ------ | ----------------------------- |
| Artists  | `display_name`         | 높음   | 유저가 주로 인식하는 이름     |
| Artists  | `username`             | 중간   | URL용 이름, 검색에도 활용     |
| Venues   | `name`                 | 높음   | 베뉴 이름이 핵심              |
| Venues   | `city`                 | 낮음   | 보조 검색 (같은 이름 구분용)  |
| Events   | `title`                | 높음   | 이벤트 제목                   |
| Events   | `data->>'lineup_text'` | 중간   | 아티스트 이름으로 이벤트 검색 |

---

## 5. 카테고리 전용 검색

### 5.1 전용 검색 페이지 URL 구조

```
/search/artists?q={keyword}
/search/venues?q={keyword}
/search/events?q={keyword}
```

### 5.2 전용 페이지 특징

- 통합 검색에서 [더 보기] 클릭 시 이동
- 해당 카테고리 결과만 전체 표시
- 검색바가 상단에 유지되어 키워드 수정 가능
- 무한 스크롤 또는 페이지네이션으로 20건씩 추가 로드
- 추후 필터 기능 확장 가능 (도시, 날짜 등)

### 5.3 카테고리별 향후 필터 옵션 (V2)

| 카테고리 | 필터                  |
| -------- | --------------------- |
| Artists  | 도시, 장르            |
| Venues   | 도시, 국가            |
| Events   | 날짜 범위, 도시, 베뉴 |

---

## 6. API 설계

### 6.1 통합 검색 API

#### GET `/api/search?q={keyword}`

통합 검색 결과 반환 (카테고리별 최대 10건 + 전체 건수)

**Request:**

```
GET /api/search?q=cake
```

**Response:**

```json
{
    "query": "cake",
    "results": {
        "artists": {
            "total_count": 15,
            "items": [
                {
                    "id": "uuid",
                    "username": "cakebutcher",
                    "display_name": "Cakebutcher",
                    "avatar_url": "https://...",
                    "url": "/cakebutcher"
                }
            ]
        },
        "venues": {
            "total_count": 23,
            "items": [
                {
                    "id": "uuid",
                    "name": "Cakeshop",
                    "slug": "cakeshop",
                    "city": "Seoul",
                    "event_count": 47,
                    "url": "/venue/cakeshop"
                }
            ]
        },
        "events": {
            "total_count": 8,
            "items": [
                {
                    "id": "uuid",
                    "title": "PIECE OF CAKE Vol.6",
                    "date": "2026-03-13",
                    "venue_name": "West Harlem",
                    "venue_city": "Kyoto",
                    "lineup_text": "DJ Soda, Ben Klock...",
                    "url": "/events/uuid"
                }
            ]
        }
    }
}
```

### 6.2 카테고리 전용 검색 API

#### GET `/api/search/artists?q={keyword}&page={n}&limit={n}`

#### GET `/api/search/venues?q={keyword}&page={n}&limit={n}`

#### GET `/api/search/events?q={keyword}&page={n}&limit={n}`

카테고리별 전체 결과를 페이지네이션으로 반환

**Request:**

```
GET /api/search/venues?q=cake&page=1&limit=20
```

**Response:**

```json
{
    "query": "cake",
    "category": "venues",
    "total_count": 23,
    "page": 1,
    "limit": 20,
    "has_next": true,
    "items": [
        {
            "id": "uuid",
            "name": "Cakeshop",
            "slug": "cakeshop",
            "city": "Seoul",
            "event_count": 47,
            "url": "/venue/cakeshop"
        }
    ]
}
```

---

## 7. 기술 구현 방안

### 7.1 검색 엔진 방식

**MVP: PostgreSQL 기반 검색**

Supabase(PostgreSQL)의 내장 검색 기능을 활용하여 별도 검색 엔진 없이 구현.

```sql
-- 관련도 정렬이 포함된 베뉴 검색 예시
SELECT
  vr.*,
  (SELECT COUNT(*) FROM events e WHERE e.venue_ref_id = vr.id) as event_count,
  CASE
    WHEN LOWER(vr.name) = LOWER(:query) THEN 1           -- 정확 일치
    WHEN LOWER(vr.name) LIKE LOWER(:query) || '%' THEN 2  -- 접두사 일치
    ELSE 3                                                 -- 부분 일치
  END as relevance
FROM venue_references vr
WHERE
  LOWER(vr.name) LIKE '%' || LOWER(:query) || '%'
  OR LOWER(vr.city) LIKE '%' || LOWER(:query) || '%'
ORDER BY relevance ASC, event_count DESC
LIMIT 10;
```

**향후 확장: Full-Text Search**

데이터가 커지면 PostgreSQL `tsvector` / `tsquery` 또는 외부 검색 엔진(Meilisearch, Typesense 등) 도입 검토.

### 7.2 실시간 검색 프론트엔드 구현

```
검색바 입력
    ↓
디바운스 (300ms)
    ↓
최소 2자 이상 확인
    ↓
이전 요청 취소 (AbortController)
    ↓
GET /api/search?q={keyword}
    ↓
결과 렌더링 (카테고리별 구분)
```

**주요 고려사항:**

- **디바운스 300ms**: 타이핑 중 불필요한 요청 방지
- **최소 2자**: 너무 짧은 키워드로 과도한 결과 방지
- **요청 취소**: 빠르게 타이핑할 때 이전 응답이 뒤늦게 도착하는 문제 방지
- **클라이언트 캐싱**: 같은 키워드 30초 내 재검색 시 캐시에서 반환

### 7.3 DB 인덱스

```sql
-- 검색 성능을 위한 인덱스
CREATE INDEX idx_users_display_name_lower ON users (LOWER(display_name));
CREATE INDEX idx_users_username_lower ON users (LOWER(username));
CREATE INDEX idx_venue_name_lower ON venue_references (LOWER(name));
CREATE INDEX idx_venue_city_lower ON venue_references (LOWER(city));

-- trigram 인덱스 (부분 일치 검색 성능 향상)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_users_display_name_trgm ON users USING gin (display_name gin_trgm_ops);
CREATE INDEX idx_venue_name_trgm ON venue_references USING gin (name gin_trgm_ops);
CREATE INDEX idx_events_title_trgm ON events USING gin (title gin_trgm_ops);
```

### 7.4 성능 목표

| 항목                         | 목표           |
| ---------------------------- | -------------- |
| 통합 검색 응답 시간          | **200ms 이내** |
| 카테고리 전용 검색 응답 시간 | **300ms 이내** |
| 동시 검색 요청 처리          | **50 req/s**   |

---

## 8. 엣지 케이스 및 예외 처리

### 8.1 입력 관련

| 케이스                  | 처리                                             |
| ----------------------- | ------------------------------------------------ |
| 1자 입력                | 검색 실행하지 않음, 결과 영역 비어있음           |
| 빈 문자열               | 검색 결과 영역 숨김, Discovery 기본 콘텐츠 표시  |
| 특수문자만 입력         | 특수문자 이스케이프 후 검색 (SQL injection 방지) |
| 매우 긴 키워드 (100자+) | 최대 100자까지만 검색어로 사용                   |
| 한글/일본어/영어 혼용   | 모두 지원 (LIKE 검색은 언어 무관)                |

### 8.2 결과 관련

| 케이스                         | 처리                                                      |
| ------------------------------ | --------------------------------------------------------- |
| 전체 결과 0건                  | "검색 결과가 없습니다" 메시지 표시                        |
| 특정 카테고리만 0건            | 해당 카테고리 섹션 자체를 숨김                            |
| 결과가 있는 카테고리 표시 순서 | Artists → Venues → Events 고정 순서 (결과 있는 것만 표시) |

### 8.3 시스템 관련

| 케이스           | 처리                                            |
| ---------------- | ----------------------------------------------- |
| API 타임아웃     | "검색에 실패했습니다. 다시 시도해주세요"        |
| 빠른 연속 타이핑 | 디바운스 + AbortController로 마지막 요청만 처리 |
| 네트워크 오류    | 조용히 실패, 재입력 시 재시도                   |

---

## 9. 향후 확장 계획

### 9.1 검색 고도화 (V2)

- **카테고리별 필터**: 도시, 날짜 범위, 장르 등
- **정렬 옵션**: 관련도순 외에 최신순, 인기순 선택 가능
- **검색 제안(Suggestions)**: "이것을 찾으셨나요?" 자동 추천
- **오타 보정**: fuzzy matching으로 비슷한 결과 제안

### 9.2 검색 인프라 확장

- **Full-Text Search**: PostgreSQL `tsvector` 도입으로 형태소 분석 기반 검색
- **외부 검색 엔진**: 데이터 10,000건 이상 시 Meilisearch 또는 Typesense 도입 검토
- **검색 로그 분석**: 인기 검색어, 검색 결과 없음 키워드 등 분석

### 9.3 추가 검색 대상 엔티티

- **Artist References** (외부 아티스트): Artist Import 기능 도입 후 검색 대상에 추가
- **Crews / Promoters**: 크루/프로모터 엔티티 분리 시 검색 대상에 추가

---

## 부록

### A. 기존 기획서와의 관계

| 기존 기획                               | 이 기획   | 관계                                                          |
| --------------------------------------- | --------- | ------------------------------------------------------------- |
| 5.1 #7 검색                             | 통합 검색 | 기존 기획의 구체화. 아티스트/베뉴 검색 + Events 검색 추가     |
| 5.1 #4 베뉴 시스템 (베뉴 검색/자동완성) | 통합 검색 | 이벤트 추가 시 베뉴 검색은 별도 유지. 통합 검색은 Discovery용 |
| 5.2 #2 디스커버리                       | 통합 검색 | Discovery 페이지의 핵심 기능으로 통합 검색이 들어감           |
| RA Venue Import 기획서                  | 통합 검색 | 검색 결과 없음 → Venue Import 유도로 자연스럽게 연결          |

### B. 의사결정 로그

| 항목              | 결정                                    | 이유                                                    |
| ----------------- | --------------------------------------- | ------------------------------------------------------- |
| 검색 대상         | Users, Venues, Events                   | MVP에 필요한 핵심 엔티티. Artist References는 추후 추가 |
| 검색 UI 구조      | 통합 검색 (카테고리별 동시 표시)        | RA와 유사한 UX. 한눈에 다양한 결과 탐색 가능            |
| 실시간 여부       | 실시간 자동완성                         | 탐색 경험 향상. 디바운스로 서버 부하 관리               |
| 진입점            | Discovery 페이지 상단 검색바            | 탐색 맥락에 자연스럽게 배치                             |
| 권한              | 비로그인 유저도 사용 가능               | Discovery는 공개 탐색 기능                              |
| 카테고리별 표시량 | 10건                                    | 충분한 미리보기 + 과도하지 않은 양                      |
| 더 보기 동작      | 카테고리 전용 검색 페이지로 이동        | 전용 페이지에서 필터/페이지네이션 등 확장 가능          |
| 결과 표시 정보    | RA와 유사하게                           | 구현 후 실제 사용하면서 조정 예정                       |
| 정렬 기준         | 관련도순 (정확일치 > 접두사 > 부분일치) | 직관적이고 유용한 결과 우선 표시                        |
| 검색 엔진         | MVP는 PostgreSQL LIKE + trigram         | 별도 인프라 없이 시작, 데이터 증가 시 확장              |
