# Database Schema Specification

**Project**: DJ Node Archive  
**Version**: 1.0.0  
**Last Updated**: 2026-02-05  
**Database**: PostgreSQL 14+ (Supabase)  
**Authors**: Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Data Model Diagram](#data-model-diagram)
4. [Table Specifications](#table-specifications)
5. [JSONB Schema Definitions](#jsonb-schema-definitions)
6. [Relationships & Constraints](#relationships--constraints)
7. [Indexing Strategy](#indexing-strategy)
8. [Query Patterns](#query-patterns)
9. [Migration Strategy](#migration-strategy)
10. [Appendix](#appendix)

---

## 1. Overview

### 1.1 Purpose

DJ Node Archive는 DJ/아티스트를 위한 Link-in-Bio 스타일 페이지와 이벤트/믹스 아카이브를 제공하는 플랫폼입니다. 이 문서는 데이터베이스 스키마의 구조, 제약조건, 관계, 그리고 쿼리 패턴을 정의합니다.

### 1.2 Core Concepts

#### Wiki-Style Architecture

- **Venues**와 **Artists**는 위키처럼 운영됩니다
- 누구나 레퍼런스를 추가할 수 있습니다 (unclaimed 상태)
- 실제 소유자가 나타나면 "클레임"하여 관리 권한을 획득합니다

#### Entry System

- 사용자 페이지의 콘텐츠는 **Entries** 테이블로 관리됩니다
- Entry는 3가지 타입이 있습니다: `link`, `event`, `mixset`
- Entry는 position으로 정렬되며, is_visible로 표시 여부를 제어합니다

#### Reference Pattern

- **Event**와 **Mixset**은 참조형과 자체형 두 가지 방식으로 저장됩니다
- 참조형: 별도 테이블에 데이터 저장, entry에서 ID로 참조
- 자체형: entry.data에 모든 정보 저장 (테이블 참조 없음)

#### Backlink System (Graph View)

- **Mentions** 테이블로 엔티티 간 연결을 추적합니다
- 옵시디언 스타일 그래프 뷰 구현을 위한 기반입니다
- Venue → Events, Artist → Events, Event → Users 등의 백링크 제공

### 1.3 Technology Stack

- **Database**: PostgreSQL 14+
- **Platform**: Supabase
- **Extensions**: uuid-ossp
- **Features Used**: JSONB, Row Level Security (RLS), Triggers, Indexes

---

## 2. Architecture Principles

### 2.1 Design Principles

1. **Flexibility through JSONB**
    - 구조화된 데이터와 비구조화 데이터의 균형
    - 스키마 변경 없이 필드 추가 가능
    - 복잡한 JOIN 없이 관련 데이터 조회

2. **Optional References**
    - venue_id, artist_id는 선택적으로 참조
    - DB에 없는 엔티티도 문자열로 저장 가능
    - 점진적으로 데이터 정규화 가능

3. **Denormalization for Performance**
    - 자주 함께 조회되는 데이터는 JSONB로 저장
    - 읽기 성능 우선, 쓰기 시 일관성 보장은 애플리케이션에서

4. **Graph-First Mindset**
    - 모든 엔티티 간 연결을 추적
    - Mentions 테이블로 관계 그래프 구성
    - 백링크, 네트워크 분석 가능

### 2.2 Naming Conventions

- **Tables**: 소문자, 복수형 (users, events, mentions)
- **Columns**: 소문자, snake_case (created_at, venue_id)
- **Foreign Keys**: `{table}_id` 형식 (user_id, page_id)
- **Timestamps**: `created_at`, `updated_at` (timestamptz)
- **Booleans**: `is_*` 접두사 (is_public, is_visible)
- **JSONB fields**: `data`, `venue`, `lineup`, `tracklist`

### 2.3 Data Types

| Type          | Usage                           | Example                                |
| ------------- | ------------------------------- | -------------------------------------- |
| `uuid`        | Primary keys, foreign keys      | `11111111-1111-1111-1111-111111111111` |
| `varchar(n)`  | Text with length limit          | `varchar(200)` for titles              |
| `text`        | Unlimited text                  | Bio, description, URLs                 |
| `jsonb`       | Structured/semi-structured data | Venue, lineup, data                    |
| `timestamptz` | Timestamp with timezone         | `2024-03-15 23:00:00+00`               |
| `integer`     | Numeric values                  | position, duration_minutes             |
| `boolean`     | True/false flags                | is_public, is_visible                  |

---

## 3. Data Model Diagram

```
┌─────────────┐
│    users    │
│  (가입자)    │
└──────┬──────┘
       │ 1
       │
       │ 1
┌──────┴──────┐       ┌──────────────┐
│    pages    │       │   venues     │
│  (페이지)    │       │   (베뉴)     │
└──────┬──────┘       └──────┬───────┘
       │ 1                   │
       │                     │ claimed_by
       │ N                   │ (optional)
┌──────┴──────┐             │
│   entries   │             │
│ (콘텐츠)     │         ┌───┴────┐
└──────┬──────┘         │ users  │
       │                └────────┘
       │ references
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌────────┐ ┌─────────┐     ┌──────────┐
│ events │ │ mixsets │     │ artists  │
└───┬────┘ └─────────┘     └────┬─────┘
    │                           │
    │ venue: {venue_id?, name}  │ claimed_by
    │ lineup: [{artist_id?, name}]  (optional)
    │                           │
    └───────────┬───────────────┘
                │
                ▼
        ┌───────────────┐
        │   mentions    │
        │  (백링크)      │
        │ source→target │
        └───────────────┘
```

### 3.1 Relationship Types

- **1:1**: users ↔ pages
- **1:N**: pages → entries, users → events, users → mixsets
- **N:M**: events ↔ users (through entries with event_id)
- **Optional N:1**: venues → users (claimed_by), artists → users (claimed_by)
- **Graph**: All entities → mentions (source/target)

---

## 4. Table Specifications

### 4.1 users

**Purpose**: 가입한 사용자 정보 저장

**Columns**:

| Column       | Type         | Constraints                            | Description           |
| ------------ | ------------ | -------------------------------------- | --------------------- |
| id           | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() | 사용자 고유 ID        |
| auth_user_id | uuid         | UNIQUE                                 | Supabase Auth UUID    |
| email        | varchar(255) | UNIQUE, NOT NULL                       | 이메일 (로그인용)     |
| username     | varchar(100) | NOT NULL                               | 실제 이름 (중복 가능) |
| display_name | varchar(50)  | UNIQUE, NOT NULL                       | URL slug (고유)       |
| avatar_url   | text         | NULL                                   | 프로필 이미지 URL     |
| bio          | text         | NULL                                   | 자기소개              |
| instagram    | varchar(100) | NULL                                   | Instagram 핸들        |
| soundcloud   | varchar(100) | NULL                                   | SoundCloud 핸들       |
| created_at   | timestamptz  | DEFAULT now()                          | 생성 시각             |
| updated_at   | timestamptz  | DEFAULT now()                          | 수정 시각             |

**Indexes**:

- PRIMARY KEY on `id`
- UNIQUE on `email`, `auth_user_id`, `display_name`
- INDEX on `display_name` (lookup)

**Notes**:

- `username`: 구글 계정 이름 등 (중복 가능)
- `display_name`: URL이 되므로 고유해야 함 (예: `/djjohn`)
- `display_name` 변경 시 pages.slug도 동기화 필요 (트리거 또는 애플리케이션)

**Example**:

```json
{
    "id": "11111111-1111-1111-1111-111111111111",
    "email": "john@example.com",
    "username": "John Doe",
    "display_name": "djjohn",
    "instagram": "@djjohn"
}
```

---

### 4.2 pages

**Purpose**: 사용자별 Link-in-Bio 페이지 (1:1 관계)

**Columns**:

| Column      | Type         | Constraints                              | Description                            |
| ----------- | ------------ | ---------------------------------------- | -------------------------------------- |
| id          | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid()   | 페이지 고유 ID                         |
| user_id     | uuid         | UNIQUE, NOT NULL, FK → users(id) CASCADE | 소유자                                 |
| slug        | varchar(50)  | UNIQUE, NOT NULL                         | URL slug (users.display_name과 동기화) |
| title       | varchar(200) | NULL                                     | 페이지 제목                            |
| bio         | text         | NULL                                     | 페이지 소개                            |
| avatar_url  | text         | NULL                                     | 페이지 대표 이미지                     |
| theme_color | varchar(7)   | DEFAULT '#000000'                        | 테마 색상 (HEX)                        |
| created_at  | timestamptz  | DEFAULT now()                            | 생성 시각                              |
| updated_at  | timestamptz  | DEFAULT now()                            | 수정 시각                              |

**Indexes**:

- PRIMARY KEY on `id`
- UNIQUE on `user_id`, `slug`
- INDEX on `slug` (public page lookup)

**Notes**:

- `slug`는 `users.display_name`과 동기화됩니다
- User 삭제 시 CASCADE로 Page도 함께 삭제
- 1 User당 1 Page만 존재

**Example**:

```json
{
    "id": "33333333-3333-3333-3333-333333333333",
    "user_id": "11111111-1111-1111-1111-111111111111",
    "slug": "djjohn",
    "title": "DJ John",
    "theme_color": "#FF6B6B"
}
```

---

### 4.3 venues

**Purpose**: 베뉴 정보 (위키 방식, 클레임 가능)

**Columns**:

| Column          | Type         | Constraints                            | Description      |
| --------------- | ------------ | -------------------------------------- | ---------------- |
| id              | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() | 베뉴 고유 ID     |
| name            | varchar(200) | NOT NULL                               | 베뉴 이름        |
| slug            | varchar(100) | UNIQUE, NOT NULL                       | URL slug         |
| city            | varchar(100) | NULL                                   | 도시             |
| country         | varchar(100) | NULL                                   | 국가             |
| address         | text         | NULL                                   | 주소             |
| google_maps_url | text         | NULL                                   | Google Maps 링크 |
| instagram       | varchar(100) | NULL                                   | Instagram 핸들   |
| website         | text         | NULL                                   | 공식 웹사이트    |
| claimed_by      | uuid         | NULL, FK → users(id) SET NULL          | 클레임한 사용자  |
| created_at      | timestamptz  | DEFAULT now()                          | 생성 시각        |
| updated_at      | timestamptz  | DEFAULT now()                          | 수정 시각        |

**Indexes**:

- PRIMARY KEY on `id`
- UNIQUE on `slug`
- INDEX on `claimed_by` (unclaimed venues filtering)

**Notes**:

- 초기에는 `claimed_by = NULL` (누구나 추가 가능)
- 베뉴 소유자가 클레임하면 `claimed_by`에 user_id 저장
- User 삭제 시 `claimed_by`는 NULL로 변경 (SET NULL)

**Claim Workflow**:

1. 사용자가 베뉴 레퍼런스 추가 → `claimed_by = NULL`
2. 실제 베뉴 소유자가 클레임 요청
3. 승인 후 → `claimed_by = user_id`
4. 이후 해당 사용자만 수정 가능

**Example**:

```json
{
    "id": "44444444-4444-4444-4444-444444444444",
    "name": "Berghain",
    "slug": "berghain",
    "city": "Berlin",
    "country": "Germany",
    "claimed_by": null
}
```

---

### 4.4 artists

**Purpose**: 아티스트 정보 (위키 방식, 클레임 가능)

**Columns**:

| Column     | Type         | Constraints                            | Description      |
| ---------- | ------------ | -------------------------------------- | ---------------- |
| id         | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() | 아티스트 고유 ID |
| name       | varchar(200) | NOT NULL                               | 아티스트 이름    |
| slug       | varchar(100) | UNIQUE, NOT NULL                       | URL slug         |
| bio        | text         | NULL                                   | 약력             |
| instagram  | varchar(100) | NULL                                   | Instagram 핸들   |
| soundcloud | varchar(100) | NULL                                   | SoundCloud 핸들  |
| spotify    | varchar(100) | NULL                                   | Spotify ID       |
| claimed_by | uuid         | NULL, FK → users(id) SET NULL          | 클레임한 사용자  |
| created_at | timestamptz  | DEFAULT now()                          | 생성 시각        |
| updated_at | timestamptz  | DEFAULT now()                          | 수정 시각        |

**Indexes**:

- PRIMARY KEY on `id`
- UNIQUE on `slug`
- INDEX on `claimed_by` (unclaimed artists filtering)

**Notes**:

- venues와 동일한 클레임 메커니즘
- 아티스트 본인 또는 매니지먼트가 클레임 가능

**Example**:

```json
{
    "id": "55555555-5555-5555-5555-555555555555",
    "name": "Nina Kraviz",
    "slug": "nina-kraviz",
    "instagram": "@ninakraviz",
    "claimed_by": null
}
```

---

### 4.5 events

**Purpose**: 이벤트 정보 (참조 가능한 공유 데이터)

**Columns**:

| Column     | Type         | Constraints                            | Description               |
| ---------- | ------------ | -------------------------------------- | ------------------------- |
| id         | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() | 이벤트 고유 ID            |
| title      | varchar(300) | NOT NULL                               | 이벤트 제목               |
| slug       | varchar(150) | UNIQUE, NOT NULL                       | URL slug                  |
| date       | timestamptz  | NOT NULL                               | 이벤트 날짜/시간          |
| venue      | jsonb        | NOT NULL                               | 베뉴 정보 (선택적 참조)   |
| lineup     | jsonb        | DEFAULT '[]'::jsonb                    | 라인업 (선택적 참조 배열) |
| data       | jsonb        | DEFAULT '{}'::jsonb                    | 추가 데이터               |
| is_public  | boolean      | DEFAULT false                          | 공개 여부                 |
| created_by | uuid         | NOT NULL, FK → users(id) CASCADE       | 작성자                    |
| created_at | timestamptz  | DEFAULT now()                          | 생성 시각                 |
| updated_at | timestamptz  | DEFAULT now()                          | 수정 시각                 |

**Indexes**:

- PRIMARY KEY on `id`
- UNIQUE on `slug`
- INDEX on `date` (time-based queries)
- INDEX on `is_public` (public event filtering)
- INDEX on `created_by` (user's events)

**Notes**:

- `is_public = true`: 다른 사용자가 검색/추가 가능 (위키)
- `is_public = false`: 본인 페이지에만 표시
- User 삭제 시 CASCADE로 Event도 함께 삭제

**JSONB Schema**: See [Section 5.1](#51-eventsvenue)

**Example**:

```json
{
    "id": "66666666-6666-6666-6666-666666666666",
    "title": "Klubnacht",
    "date": "2024-03-15T23:00:00Z",
    "venue": {
        "venue_id": "44444444-4444-4444-4444-444444444444",
        "name": "Berghain"
    },
    "lineup": [
        {
            "artist_id": "55555555-5555-5555-5555-555555555555",
            "name": "Nina Kraviz"
        },
        {
            "name": "Ben Klock"
        }
    ],
    "is_public": true
}
```

---

### 4.6 mixsets

**Purpose**: 믹스/세트 정보 (추후 구현, 기본 구조만)

**Columns**:

| Column           | Type         | Constraints                            | Description     |
| ---------------- | ------------ | -------------------------------------- | --------------- |
| id               | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() | 믹스셋 고유 ID  |
| title            | varchar(300) | NOT NULL                               | 믹스셋 제목     |
| slug             | varchar(150) | UNIQUE, NOT NULL                       | URL slug        |
| date             | timestamptz  | NULL                                   | 녹음/공연 날짜  |
| duration_minutes | integer      | NULL                                   | 재생 시간 (분)  |
| tracklist        | jsonb        | DEFAULT '[]'::jsonb                    | 트랙리스트      |
| audio_url        | text         | NULL                                   | 오디오 파일 URL |
| cover_url        | text         | NULL                                   | 커버 이미지 URL |
| soundcloud_url   | text         | NULL                                   | SoundCloud 링크 |
| mixcloud_url     | text         | NULL                                   | Mixcloud 링크   |
| created_by       | uuid         | NOT NULL, FK → users(id) CASCADE       | 작성자          |
| created_at       | timestamptz  | DEFAULT now()                          | 생성 시각       |
| updated_at       | timestamptz  | DEFAULT now()                          | 수정 시각       |

**Indexes**:

- PRIMARY KEY on `id`
- UNIQUE on `slug`
- INDEX on `created_by` (user's mixsets)

**Notes**:

- 현재는 기본 구조만 정의
- Tracklist, 태깅 등 추후 확장 예정

**JSONB Schema**: See [Section 5.3](#53-mixsetstracklist)

**Example**:

```json
{
    "id": "77777777-7777-7777-7777-777777777777",
    "title": "Berlin Closing Set",
    "duration_minutes": 120,
    "tracklist": [{ "track": "Track 1", "artist": "Artist 1", "time": "00:00" }]
}
```

---

### 4.7 entries

**Purpose**: 페이지 콘텐츠 (Link-in-Bio 아이템들)

**Columns**:

| Column     | Type        | Constraints                                           | Description            |
| ---------- | ----------- | ----------------------------------------------------- | ---------------------- |
| id         | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid()                | Entry 고유 ID          |
| page_id    | uuid        | NOT NULL, FK → pages(id) CASCADE                      | 소속 페이지            |
| type       | varchar(20) | NOT NULL, CHECK (type IN ('link', 'event', 'mixset')) | Entry 타입             |
| position   | integer     | NOT NULL                                              | 정렬 순서 (0부터 시작) |
| is_visible | boolean     | DEFAULT true                                          | 표시 여부              |
| data       | jsonb       | NOT NULL                                              | 타입별 데이터          |
| created_at | timestamptz | DEFAULT now()                                         | 생성 시각              |
| updated_at | timestamptz | DEFAULT now()                                         | 수정 시각              |

**Constraints**:

- UNIQUE(page_id, position) - 같은 페이지 내 position 중복 불가

**Indexes**:

- PRIMARY KEY on `id`
- INDEX on `page_id` (page entries lookup)
- INDEX on `type` (type filtering)
- COMPOSITE INDEX on `(page_id, position)` (ordered retrieval)

**Notes**:

- Page 삭제 시 CASCADE로 Entry도 함께 삭제
- `position` 재정렬 시 애플리케이션에서 처리
- `is_visible = false`: 생성했지만 페이지에 표시 안 함

**Type-specific Data Schema**: See [Section 5.4](#54-entriesdata)

**Example - Link Entry**:

```json
{
    "id": "88888888-8888-8888-8888-888888888881",
    "page_id": "33333333-3333-3333-3333-333333333333",
    "type": "link",
    "position": 0,
    "is_visible": true,
    "data": {
        "url": "https://instagram.com/djjohn",
        "title": "Instagram",
        "icon": "instagram"
    }
}
```

**Example - Event Entry (참조형)**:

```json
{
    "id": "88888888-8888-8888-8888-888888888882",
    "page_id": "33333333-3333-3333-3333-333333333333",
    "type": "event",
    "position": 1,
    "is_visible": true,
    "data": {
        "event_id": "66666666-6666-6666-6666-666666666666",
        "custom_title": "My Amazing Show"
    }
}
```

---

### 4.8 mentions

**Purpose**: 엔티티 간 연결 추적 (백링크, 그래프 뷰)

**Columns**:

| Column      | Type        | Constraints                                                                                | Description     |
| ----------- | ----------- | ------------------------------------------------------------------------------------------ | --------------- |
| id          | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid()                                                     | Mention 고유 ID |
| source_type | varchar(20) | NOT NULL, CHECK (source_type IN ('event', 'entry', 'page'))                                | 소스 타입       |
| source_id   | uuid        | NOT NULL                                                                                   | 소스 ID         |
| target_type | varchar(20) | NOT NULL, CHECK (target_type IN ('venue', 'artist', 'event', 'user'))                      | 타겟 타입       |
| target_id   | uuid        | NOT NULL                                                                                   | 타겟 ID         |
| context     | varchar(50) | NOT NULL, CHECK (context IN ('venue', 'lineup', 'description_mention', 'event_reference')) | 연결 컨텍스트   |
| created_at  | timestamptz | DEFAULT now()                                                                              | 생성 시각       |

**Constraints**:

- UNIQUE(source_type, source_id, target_type, target_id, context) - 중복 방지

**Indexes**:

- PRIMARY KEY on `id`
- COMPOSITE INDEX on `(target_type, target_id)` (backlink queries)
- COMPOSITE INDEX on `(source_type, source_id)` (forward link queries)
- INDEX on `context` (context filtering)

**Notes**:

- 애플리케이션에서 Event/Entry 생성 시 자동 생성
- 옵시디언 스타일 그래프 뷰의 기반 데이터
- 삭제는 애플리케이션에서 처리 (CASCADE 아님)

**Context Values**:

| Context             | Description           | Example                     |
| ------------------- | --------------------- | --------------------------- |
| venue               | Event가 Venue를 참조  | Event.venue.venue_id        |
| lineup              | Event가 Artist를 참조 | Event.lineup[].artist_id    |
| description_mention | Description에서 @멘션 | "@Berghain", "@Nina_Kraviz" |
| event_reference     | Entry가 Event를 참조  | Entry.data.event_id         |

**Example**:

```json
{
    "id": "99999999-9999-9999-9999-999999999991",
    "source_type": "event",
    "source_id": "66666666-6666-6666-6666-666666666666",
    "target_type": "venue",
    "target_id": "44444444-4444-4444-4444-444444444444",
    "context": "venue"
}
```

**Graph Query Examples**:

```sql
-- Berghain의 모든 백링크
SELECT * FROM mentions
WHERE target_type = 'venue'
  AND target_id = '44444444-4444-4444-4444-444444444444';

-- Event에서 참조하는 모든 엔티티
SELECT * FROM mentions
WHERE source_type = 'event'
  AND source_id = '66666666-6666-6666-6666-666666666666';
```

---

## 5. JSONB Schema Definitions

### 5.1 events.venue

**Purpose**: 베뉴 정보 (선택적 참조)

**Schema**:

```typescript
interface EventVenue {
    venue_id?: string; // venues 테이블 참조 (선택)
    name: string; // 베뉴 이름 (필수)
}
```

**Examples**:

참조형 (DB에 베뉴 있음):

```json
{
    "venue_id": "44444444-4444-4444-4444-444444444444",
    "name": "Berghain"
}
```

자체형 (DB에 베뉴 없음):

```json
{
    "name": "My Local Club"
}
```

**Business Logic**:

- `venue_id` 있으면 → mentions 테이블에 추가
- `venue_id` 없으면 → 문자열로만 표시
- 나중에 베뉴 추가되면 `venue_id` 업데이트 가능

---

### 5.2 events.lineup

**Purpose**: 라인업 정보 (선택적 참조 배열)

**Schema**:

```typescript
interface EventPerformer {
    artist_id?: string; // artists 테이블 참조 (선택)
    name: string; // 아티스트 이름 (필수)
}

type EventLineup = EventPerformer[];
```

**Example**:

```json
[
    {
        "artist_id": "55555555-5555-5555-5555-555555555555",
        "name": "Nina Kraviz"
    },
    {
        "name": "Ben Klock"
    },
    {
        "artist_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "name": "Marcel Dettmann"
    }
]
```

**Business Logic**:

- 각 performer의 `artist_id` 있으면 → mentions 테이블에 추가
- 순서 유지 (배열 순서 = 공연 순서)
- 빈 배열 가능 (라인업 미정)

**Query Pattern**:

```sql
-- Nina Kraviz가 참여한 이벤트 검색
SELECT * FROM events
WHERE lineup @> '[{"artist_id": "55555555-5555-5555-5555-555555555555"}]';
```

---

### 5.3 events.data

**Purpose**: 이벤트 추가 정보

**Schema**:

```typescript
interface EventData {
    poster_url?: string; // 포스터 이미지
    description?: string; // 설명 (마크다운 가능, @멘션 가능)
    links?: EventLink[]; // 외부 링크
}

interface EventLink {
    title: string; // 링크 제목
    url: string; // 링크 URL
}
```

**Example**:

```json
{
    "poster_url": "https://example.com/posters/klubnacht.jpg",
    "description": "Amazing night @Berghain with @Nina_Kraviz\n\nMain floor: Techno\nPanorama Bar: House",
    "links": [
        {
            "title": "Tickets",
            "url": "https://example.com/tickets"
        },
        {
            "title": "Facebook Event",
            "url": "https://facebook.com/events/123"
        }
    ]
}
```

**Business Logic**:

- `description`에서 `@{entity_name}` 파싱 → mentions 테이블에 추가
- `links`는 선택적 (티켓, 스트리밍 등)

---

### 5.4 mixsets.tracklist

**Purpose**: 믹스셋 트랙리스트

**Schema**:

```typescript
interface Track {
    track: string; // 트랙명
    artist: string; // 아티스트명
    time: string; // 재생 시간 (MM:SS)
}

type Tracklist = Track[];
```

**Example**:

```json
[
    {
        "track": "Ghosts in My Machine",
        "artist": "Nina Kraviz",
        "time": "00:00"
    },
    {
        "track": "Spastik",
        "artist": "Plastikman",
        "time": "05:30"
    },
    {
        "track": "Bells & Circles",
        "artist": "I Hate Models",
        "time": "12:00"
    }
]
```

**Future Extensions**:

- 트랙별 artist_id 참조
- BPM, key, label 정보
- Beatport/Spotify 링크

---

### 5.5 entries.data

**Purpose**: Entry 타입별 데이터

#### 5.5.1 Type: 'link'

자체 데이터만 (테이블 참조 없음)

**Schema**:

```typescript
interface LinkEntryData {
    url: string; // 링크 URL (필수)
    title: string; // 링크 제목 (필수)
    icon?: string; // 아이콘 (선택)
}
```

**Example**:

```json
{
    "url": "https://instagram.com/djjohn",
    "title": "Instagram",
    "icon": "instagram"
}
```

#### 5.5.2 Type: 'event' (참조형)

Events 테이블 참조

**Schema**:

```typescript
interface EventReferenceData {
    event_id: string; // events.id (필수)
    custom_title?: string; // 커스텀 제목 (선택)
}
```

**Example**:

```json
{
    "event_id": "66666666-6666-6666-6666-666666666666",
    "custom_title": "My Amazing Performance"
}
```

**Business Logic**:

- `event_id`로 events 테이블 JOIN
- `custom_title` 있으면 원본 title 대신 사용
- mentions 테이블에 추가 (context: 'event_reference')

#### 5.5.3 Type: 'event' (자체형)

자체 데이터 (테이블 참조 없음)

**Schema**:

```typescript
interface EventSelfData {
    title: string;
    date: string; // ISO 8601
    venue: {
        venue_id?: string;
        name: string;
    };
    lineup?: Array<{
        artist_id?: string;
        name: string;
    }>;
    poster_url?: string;
    description?: string;
    links?: Array<{
        title: string;
        url: string;
    }>;
}
```

**Example**:

```json
{
    "title": "Underground Party",
    "date": "2024-04-20T22:00:00Z",
    "venue": {
        "name": "Secret Location"
    },
    "lineup": [{ "name": "DJ Mystery" }],
    "description": "Private event"
}
```

**Business Logic**:

- 프라이빗 이벤트 (다른 사용자 검색 불가)
- 필드 충분하면 나중에 퍼블리싱 가능 (events 테이블로 이동)

**구분 로직**:

```typescript
function isReferenceEvent(data: any): boolean {
    return 'event_id' in data;
}
```

#### 5.5.4 Type: 'mixset'

Mixsets 테이블 참조

**Schema**:

```typescript
interface MixsetEntryData {
    mixset_id: string; // mixsets.id (필수)
}
```

**Example**:

```json
{
    "mixset_id": "77777777-7777-7777-7777-777777777777"
}
```

---

## 6. Relationships & Constraints

### 6.1 Foreign Key Relationships

| Child Table | Column     | Parent Table | Parent Column | On Delete | On Update |
| ----------- | ---------- | ------------ | ------------- | --------- | --------- |
| pages       | user_id    | users        | id            | CASCADE   | CASCADE   |
| entries     | page_id    | pages        | id            | CASCADE   | CASCADE   |
| venues      | claimed_by | users        | id            | SET NULL  | CASCADE   |
| artists     | claimed_by | users        | id            | SET NULL  | CASCADE   |
| events      | created_by | users        | id            | CASCADE   | CASCADE   |
| mixsets     | created_by | users        | id            | CASCADE   | CASCADE   |

### 6.2 Unique Constraints

| Table    | Columns                                                   | Reason                |
| -------- | --------------------------------------------------------- | --------------------- |
| users    | email                                                     | 로그인 식별자         |
| users    | auth_user_id                                              | Supabase Auth 연동    |
| users    | display_name                                              | URL slug              |
| pages    | user_id                                                   | 1 User당 1 Page       |
| pages    | slug                                                      | URL 고유성            |
| venues   | slug                                                      | URL 고유성            |
| artists  | slug                                                      | URL 고유성            |
| events   | slug                                                      | URL 고유성            |
| mixsets  | slug                                                      | URL 고유성            |
| entries  | (page_id, position)                                       | 페이지 내 순서 고유성 |
| mentions | (source_type, source_id, target_type, target_id, context) | 중복 방지             |

### 6.3 Check Constraints

**entries.type**:

```sql
CHECK (type IN ('link', 'event', 'mixset'))
```

**mentions.source_type**:

```sql
CHECK (source_type IN ('event', 'entry', 'page'))
```

**mentions.target_type**:

```sql
CHECK (target_type IN ('venue', 'artist', 'event', 'user'))
```

**mentions.context**:

```sql
CHECK (context IN ('venue', 'lineup', 'description_mention', 'event_reference'))
```

### 6.4 Cascade Rules

**User 삭제 시**:

- pages → CASCADE 삭제
- entries → CASCADE 삭제 (through pages)
- events → CASCADE 삭제
- mixsets → CASCADE 삭제
- venues.claimed_by → SET NULL
- artists.claimed_by → SET NULL

**Page 삭제 시**:

- entries → CASCADE 삭제

**Event/Mixset 삭제 시**:

- entries는 삭제 안 됨 (data.event_id만 남음, 404 처리 필요)
- mentions는 애플리케이션에서 수동 삭제

---

## 7. Indexing Strategy

### 7.1 Primary Key Indexes

모든 테이블의 `id` 컬럼에 자동 생성

### 7.2 Unique Indexes

Unique 제약조건에 자동 생성:

- users: email, auth_user_id, display_name
- pages: user_id, slug
- venues: slug
- artists: slug
- events: slug
- mixsets: slug
- entries: (page_id, position)
- mentions: (source_type, source_id, target_type, target_id, context)

### 7.3 Foreign Key Indexes

Foreign key 컬럼에 인덱스 생성:

- pages.user_id
- entries.page_id
- venues.claimed_by
- artists.claimed_by
- events.created_by
- mixsets.created_by

### 7.4 Query Optimization Indexes

**Lookup Indexes**:

```sql
CREATE INDEX idx_users_display_name ON users(display_name);
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_artists_slug ON artists(slug);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_mixsets_slug ON mixsets(slug);
```

**Filter Indexes**:

```sql
CREATE INDEX idx_entries_type ON entries(type);
CREATE INDEX idx_events_is_public ON events(is_public);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_mentions_context ON mentions(context);
```

**Composite Indexes** (ordered retrieval):

```sql
CREATE INDEX idx_entries_page_position ON entries(page_id, position);
CREATE INDEX idx_mentions_target ON mentions(target_type, target_id);
CREATE INDEX idx_mentions_source ON mentions(source_type, source_id);
```

### 7.5 JSONB Indexes (Future)

JSONB 필드 검색 최적화 (필요 시 추가):

```sql
-- events.lineup에서 artist_id 검색
CREATE INDEX idx_events_lineup_artist
ON events USING GIN ((lineup -> 'artist_id'));

-- events.venue에서 venue_id 검색
CREATE INDEX idx_events_venue_id
ON events USING GIN ((venue -> 'venue_id'));
```

---

## 8. Query Patterns

### 8.1 Page Content Retrieval

**Use Case**: 사용자 페이지 조회 (slug 기반)

```sql
-- 1. Page 조회
SELECT p.*, u.username, u.avatar_url
FROM pages p
JOIN users u ON u.id = p.user_id
WHERE p.slug = 'djjohn';

-- 2. Entries 조회 (position 순서)
SELECT *
FROM entries
WHERE page_id = '33333333-3333-3333-3333-333333333333'
  AND is_visible = true
ORDER BY position;

-- 3. 참조형 Entry의 데이터 조회
-- Type: event (참조형)
SELECT e.*, ev.*
FROM entries e
JOIN events ev ON ev.id = (e.data->>'event_id')::uuid
WHERE e.id = '88888888-8888-8888-8888-888888888882';

-- Type: mixset
SELECT e.*, m.*
FROM entries e
JOIN mixsets m ON m.id = (e.data->>'mixset_id')::uuid
WHERE e.id = '88888888-8888-8888-8888-888888888883';
```

**Optimization**:

- Page slug로 페이지 조회 → user_id 획득
- Entries 일괄 조회 (position 정렬)
- 참조형 entry들의 ID 수집 → 일괄 JOIN

### 8.2 Venue Backlinks

**Use Case**: Berghain 페이지에서 "이 베뉴의 이벤트" 조회

```sql
-- 방법 1: Mentions 테이블 사용
SELECT e.*
FROM mentions m
JOIN events e ON e.id = m.source_id
WHERE m.target_type = 'venue'
  AND m.target_id = '44444444-4444-4444-4444-444444444444'
  AND m.context = 'venue'
ORDER BY e.date DESC;

-- 방법 2: Events 테이블 직접 검색 (JSONB)
SELECT *
FROM events
WHERE venue->>'venue_id' = '44444444-4444-4444-4444-444444444444'
ORDER BY date DESC;
```

**Recommendation**: Mentions 테이블 사용 (인덱스 활용)

### 8.3 Artist Events

**Use Case**: Nina Kraviz가 참여한 이벤트 조회

```sql
-- 방법 1: Mentions 테이블 사용
SELECT e.*
FROM mentions m
JOIN events e ON e.id = m.source_id
WHERE m.target_type = 'artist'
  AND m.target_id = '55555555-5555-5555-5555-555555555555'
  AND m.context = 'lineup'
ORDER BY e.date DESC;

-- 방법 2: Events 테이블 직접 검색 (JSONB)
SELECT *
FROM events
WHERE lineup @> '[{"artist_id": "55555555-5555-5555-5555-555555555555"}]'
ORDER BY date DESC;
```

**Recommendation**: Mentions 테이블 사용

### 8.4 Public Events Search

**Use Case**: 퍼블릭 이벤트 검색 (페이지에 추가 가능)

```sql
-- 기본 검색 (최신순)
SELECT *
FROM events
WHERE is_public = true
ORDER BY date DESC
LIMIT 20;

-- 날짜 필터 (다가오는 이벤트)
SELECT *
FROM events
WHERE is_public = true
  AND date >= now()
ORDER BY date ASC
LIMIT 20;

-- 제목 검색
SELECT *
FROM events
WHERE is_public = true
  AND title ILIKE '%techno%'
ORDER BY date DESC;

-- 베뉴 필터
SELECT *
FROM events
WHERE is_public = true
  AND venue->>'venue_id' = '44444444-4444-4444-4444-444444444444'
ORDER BY date DESC;
```

### 8.5 User's Created Content

**Use Case**: 사용자가 만든 모든 콘텐츠 조회

```sql
-- Events
SELECT * FROM events
WHERE created_by = '11111111-1111-1111-1111-111111111111'
ORDER BY date DESC;

-- Mixsets
SELECT * FROM mixsets
WHERE created_by = '11111111-1111-1111-1111-111111111111'
ORDER BY date DESC;

-- Claimed Venues
SELECT * FROM venues
WHERE claimed_by = '11111111-1111-1111-1111-111111111111';

-- Claimed Artists
SELECT * FROM artists
WHERE claimed_by = '11111111-1111-1111-1111-111111111111';
```

### 8.6 Graph View Queries

**Use Case**: 옵시디언 스타일 그래프 데이터

```sql
-- 특정 엔티티의 모든 연결 (양방향)
SELECT
  source_type, source_id, target_type, target_id, context
FROM mentions
WHERE source_id = '66666666-6666-6666-6666-666666666666'
   OR target_id = '66666666-6666-6666-6666-666666666666';

-- 2-hop 연결 (Event → Venue → Events)
WITH event_venue AS (
  SELECT target_id as venue_id
  FROM mentions
  WHERE source_id = '66666666-6666-6666-6666-666666666666'
    AND target_type = 'venue'
)
SELECT DISTINCT e.*
FROM event_venue ev
JOIN mentions m ON m.target_id = ev.venue_id
JOIN events e ON e.id = m.source_id
WHERE m.target_type = 'venue';

-- 엔티티별 연결 개수 (인기도)
SELECT target_type, target_id, COUNT(*) as mention_count
FROM mentions
GROUP BY target_type, target_id
ORDER BY mention_count DESC
LIMIT 20;
```

### 8.7 Position Reordering

**Use Case**: Entry 순서 변경 (drag & drop)

```sql
-- 방법 1: 개별 UPDATE (간단하지만 느림)
UPDATE entries SET position = 0 WHERE id = 'entry-1';
UPDATE entries SET position = 1 WHERE id = 'entry-2';
UPDATE entries SET position = 2 WHERE id = 'entry-3';

-- 방법 2: 일괄 UPDATE (권장)
UPDATE entries AS e
SET position = c.new_position
FROM (VALUES
  ('entry-1'::uuid, 0),
  ('entry-2'::uuid, 1),
  ('entry-3'::uuid, 2)
) AS c(id, new_position)
WHERE e.id = c.id;

-- 방법 3: 간격 두고 저장 (10, 20, 30...)
-- 중간 삽입 시 재정렬 최소화
UPDATE entries SET position = 15 WHERE id = 'new-entry';
```

**Recommendation**: 방법 2 (일괄 UPDATE)

---

## 9. Migration Strategy

### 9.1 Initial Setup

```sql
-- 1. 확장 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 테이블 생성 (순서 중요: 의존성)
CREATE TABLE users (...);
CREATE TABLE pages (...);
CREATE TABLE venues (...);
CREATE TABLE artists (...);
CREATE TABLE events (...);
CREATE TABLE mixsets (...);
CREATE TABLE entries (...);
CREATE TABLE mentions (...);

-- 3. 인덱스 생성
CREATE INDEX ...;

-- 4. RLS 정책 적용 (선택)
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...;
```

### 9.2 Data Migration (from old schema)

**Step 1: Backup**

```bash
pg_dump -h localhost -U postgres -d djnode > backup_before_migration.sql
```

**Step 2: Map Old → New**

| Old Table         | Old Column | New Table | New Column           | Note              |
| ----------------- | ---------- | --------- | -------------------- | ----------------- |
| artist_references | \*         | artists   | \*                   | claimed_by = NULL |
| venue_references  | \*         | venues    | \*                   | claimed_by = NULL |
| page_view_items   | \*         | entries   | position, is_visible | Merge to entries  |
| event_performers  | \*         | events    | lineup (jsonb)       | Convert to array  |

**Step 3: Migrate Data**

```sql
-- Example: artist_references → artists
INSERT INTO artists (id, name, slug, instagram, claimed_by)
SELECT id, name, slug, instagram, NULL
FROM artist_references;

-- Example: event_performers → events.lineup
UPDATE events e
SET lineup = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'artist_id', ep.artist_id,
      'name', a.name
    )
  )
  FROM event_performers ep
  LEFT JOIN artists a ON a.id = ep.artist_id
  WHERE ep.event_id = e.id
);
```

**Step 4: Verify**

```sql
-- Row count 확인
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'pages', COUNT(*) FROM pages
UNION ALL
SELECT 'venues', COUNT(*) FROM venues
-- ...

-- 데이터 샘플링
SELECT * FROM entries LIMIT 10;
SELECT * FROM events LIMIT 10;
```

**Step 5: Generate Mentions**

```sql
-- 애플리케이션 또는 스크립트로 mentions 생성
-- Example (Pseudo-code):
FOR each event IN events:
  IF event.venue.venue_id IS NOT NULL:
    INSERT INTO mentions (source_type, source_id, target_type, target_id, context)
    VALUES ('event', event.id, 'venue', event.venue.venue_id, 'venue');

  FOR each performer IN event.lineup:
    IF performer.artist_id IS NOT NULL:
      INSERT INTO mentions (...) VALUES (...);
```

### 9.3 Rollback Plan

```sql
-- 1. 새 스키마 드롭
DROP TABLE mentions CASCADE;
DROP TABLE entries CASCADE;
-- ...

-- 2. 백업 복원
psql -h localhost -U postgres -d djnode < backup_before_migration.sql

-- 3. 애플리케이션 코드 원복
git checkout old_version
```

### 9.4 Zero-Downtime Migration (Advanced)

1. **Dual Write**: 새/구 스키마 동시 쓰기
2. **Backfill**: 구 → 신 데이터 복사 (배치)
3. **Validation**: 데이터 일관성 검증
4. **Switch**: 읽기를 신 스키마로 전환
5. **Cleanup**: 구 스키마 제거

---

## 10. Appendix

### 10.1 TypeScript Type Definitions

```typescript
// Database Tables
export interface User {
    id: string;
    auth_user_id: string;
    email: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
    instagram?: string;
    soundcloud?: string;
    created_at: string;
    updated_at: string;
}

export interface Page {
    id: string;
    user_id: string;
    slug: string;
    title?: string;
    bio?: string;
    avatar_url?: string;
    theme_color: string;
    created_at: string;
    updated_at: string;
}

export interface Venue {
    id: string;
    name: string;
    slug: string;
    city?: string;
    country?: string;
    address?: string;
    google_maps_url?: string;
    instagram?: string;
    website?: string;
    claimed_by?: string;
    created_at: string;
    updated_at: string;
}

export interface Artist {
    id: string;
    name: string;
    slug: string;
    bio?: string;
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
    claimed_by?: string;
    created_at: string;
    updated_at: string;
}

export interface Event {
    id: string;
    title: string;
    slug: string;
    date: string;
    venue: EventVenue;
    lineup: EventPerformer[];
    data: EventData;
    is_public: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface Mixset {
    id: string;
    title: string;
    slug: string;
    date?: string;
    duration_minutes?: number;
    tracklist: Track[];
    audio_url?: string;
    cover_url?: string;
    soundcloud_url?: string;
    mixcloud_url?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface Entry {
    id: string;
    page_id: string;
    type: 'link' | 'event' | 'mixset';
    position: number;
    is_visible: boolean;
    data: EntryData;
    created_at: string;
    updated_at: string;
}

export interface Mention {
    id: string;
    source_type: 'event' | 'entry' | 'page';
    source_id: string;
    target_type: 'venue' | 'artist' | 'event' | 'user';
    target_id: string;
    context: 'venue' | 'lineup' | 'description_mention' | 'event_reference';
    created_at: string;
}

// JSONB Types
export interface EventVenue {
    venue_id?: string;
    name: string;
}

export interface EventPerformer {
    artist_id?: string;
    name: string;
}

export interface EventData {
    poster_url?: string;
    description?: string;
    links?: EventLink[];
}

export interface EventLink {
    title: string;
    url: string;
}

export interface Track {
    track: string;
    artist: string;
    time: string;
}

export type EntryData = LinkEntryData | EventReferenceData | EventSelfData | MixsetEntryData;

export interface LinkEntryData {
    url: string;
    title: string;
    icon?: string;
}

export interface EventReferenceData {
    event_id: string;
    custom_title?: string;
}

export interface EventSelfData {
    title: string;
    date: string;
    venue: EventVenue;
    lineup?: EventPerformer[];
    poster_url?: string;
    description?: string;
    links?: EventLink[];
}

export interface MixsetEntryData {
    mixset_id: string;
}
```

### 10.2 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Database (optional for direct access)
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### 10.3 Performance Benchmarks

**Target Metrics** (with 10,000 users, 100,000 events):

| Query              | Target Time | Index Used                               |
| ------------------ | ----------- | ---------------------------------------- |
| Page by slug       | < 10ms      | idx_pages_slug                           |
| Entries by page_id | < 20ms      | idx_entries_page_position                |
| Event by slug      | < 10ms      | idx_events_slug                          |
| Public events (20) | < 50ms      | idx_events_is_public, idx_events_date    |
| Venue backlinks    | < 30ms      | idx_mentions_target                      |
| Artist events      | < 30ms      | idx_mentions_target                      |
| Graph view (1-hop) | < 50ms      | idx_mentions_target, idx_mentions_source |

### 10.4 Security Considerations

1. **Row Level Security (RLS)**
    - Users can only update their own data
    - Public data is readable by all
    - Claimed entities are editable only by claimer

2. **Input Validation**
    - Slug: alphanumeric + hyphen only
    - URL: valid format check
    - JSONB: schema validation before insert

3. **Rate Limiting**
    - Event creation: 10/hour per user
    - Mention creation: 100/hour (automatic)
    - Search queries: 100/minute

4. **Data Privacy**
    - Email: not exposed in public API
    - auth_user_id: internal only
    - Unclaimed entities: editable by all (review system needed)

### 10.5 Future Enhancements

1. **Full-Text Search**

    ```sql
    ALTER TABLE events ADD COLUMN search_vector tsvector;
    CREATE INDEX idx_events_search ON events USING GIN(search_vector);
    ```

2. **Soft Delete**

    ```sql
    ALTER TABLE events ADD COLUMN deleted_at timestamptz;
    CREATE INDEX idx_events_active ON events(deleted_at) WHERE deleted_at IS NULL;
    ```

3. **Versioning**

    ```sql
    CREATE TABLE event_versions (
      id uuid PRIMARY KEY,
      event_id uuid REFERENCES events(id),
      version integer,
      data jsonb,
      created_at timestamptz
    );
    ```

4. **Analytics**

    ```sql
    CREATE TABLE page_views (
      id uuid PRIMARY KEY,
      page_id uuid REFERENCES pages(id),
      viewed_at timestamptz,
      referrer text,
      user_agent text
    );
    ```

5. **Notifications**
    ```sql
    CREATE TABLE notifications (
      id uuid PRIMARY KEY,
      user_id uuid REFERENCES users(id),
      type varchar(50),
      data jsonb,
      read_at timestamptz,
      created_at timestamptz
    );
    ```

### 10.6 Glossary

- **Entry**: 페이지 콘텐츠의 최소 단위 (link, event, mixset)
- **Reference Entry**: 별도 테이블의 데이터를 참조하는 entry (event_id, mixset_id)
- **Self-contained Entry**: entry.data에 모든 정보를 담은 entry
- **Backlink**: A가 B를 참조할 때, B에서 A로의 역방향 링크
- **Claim**: 위키 엔티티(venue, artist)를 실제 소유자가 권한 획득하는 행위
- **Mention**: 엔티티 간 연결 (JSONB 참조를 mentions 테이블로 추적)
- **Graph View**: 모든 엔티티를 노드로, mentions를 엣지로 하는 그래프 시각화
- **Display Entry**: 화면에 제대로 표시 가능한 entry (필수 필드 충족)
- **is_visible**: display entry 중에서 실제로 보일지 여부 (토글)

---

## Document History

| Version | Date       | Author   | Changes               |
| ------- | ---------- | -------- | --------------------- |
| 1.0.0   | 2026-02-05 | Dev Team | Initial specification |

---

**END OF DOCUMENT**
