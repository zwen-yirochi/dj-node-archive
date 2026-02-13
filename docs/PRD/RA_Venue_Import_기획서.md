# DJ Node Archive - RA Venue Import 기능 기획서

## 📋 목차

1. [기능 개요](#1-기능-개요)
2. [유저 플로우](#2-유저-플로우)
3. [데이터 범위 및 처리 방식](#3-데이터-범위-및-처리-방식)
4. [데이터베이스 스키마 변경사항](#4-데이터베이스-스키마-변경사항)
5. [기술 구현 방안](#5-기술-구현-방안)
6. [정책 및 리스크 관리](#6-정책-및-리스크-관리)
7. [엣지 케이스 및 예외 처리](#7-엣지-케이스-및-예외-처리)
8. [향후 확장 계획](#8-향후-확장-계획)

---

## 1. 기능 개요

### 한 줄 소개

DNA에 아직 등록되지 않은 베뉴를 RA(Resident Advisor)에서 가져와 자동으로 등록하는 기능

### 배경

- DNA 초기에는 시드 데이터로 주요 베뉴 20개 정도만 등록되어 있음
- 유저가 이벤트를 추가하거나 베뉴를 탐색할 때, 원하는 베뉴가 없는 상황 발생
- 유저가 직접 베뉴를 수동 생성하는 대신, RA에 이미 축적된 풍부한 데이터를 활용
- 베뉴 정보뿐 아니라 과거 이벤트 히스토리까지 가져와서 베뉴 페이지를 즉시 풍부하게 채움

### 핵심 원칙

- **유저 트리거 방식**: 시스템이 자동으로 크롤링하지 않음. 유저의 명시적 요청에 의해서만 실행
- **단건 처리**: 한 번에 하나의 베뉴만 Import (대량 크롤링 아님)
- **DNA 자체 식별 체계 우선**: RA URL은 보조 식별자일 뿐, DNA 내부 ID/slug가 primary
- **등록 후 검증**: 전담 검수팀이 없으므로 일단 등록하고, 문제 발생 시 신고 기반으로 처리

---

## 2. 유저 플로우

### 2.1 전체 플로우

```
유저가 DNA에서 베뉴 검색
    ↓
검색 결과 없음
    ↓
┌─ 로그인 유저 ─────────────────────────────┐
│                                            │
│  "찾으시는 베뉴가 없나요?                    │
│   RA에서 가져올 수 있어요"                    │
│                                            │
│  [Import from RA] 버튼                      │
│                                            │
└────────────────────────────────────────────┘

┌─ 비로그인 유저 ────────────────────────────┐
│                                            │
│  "검색 결과가 없습니다."                      │
│  "로그인하면 RA에서 베뉴를 가져올 수 있어요"    │
│                                            │
│  [로그인] [회원가입]                          │
│                                            │
└────────────────────────────────────────────┘
    ↓ (로그인 유저가 Import 클릭)
RA 베뉴 URL 입력 모달
├─ 입력창: "RA 베뉴 URL을 붙여넣어주세요"
├─ 예시: https://ra.co/clubs/12345
└─ [가져오기] 버튼
    ↓
URL 유효성 검증
├─ 유효한 RA 베뉴 URL인지 확인
├─ 이미 Import된 RA URL인지 중복 체크
└─ 실패 시 에러 메시지
    ↓
데이터 파싱 중... (로딩 UI)
├─ 스피너 + "RA에서 데이터를 가져오고 있어요..."
└─ 예상 소요 시간: 3-10초
    ↓
미리보기 화면
├─ 베뉴 정보
│   ├─ 이름
│   ├─ 위치 (도시, 국가)
│   ├─ 주소
│   └─ 프로필 이미지 (있으면)
├─ 과거 이벤트 히스토리
│   ├─ "N개의 이벤트를 찾았습니다"
│   └─ 이벤트 목록 미리보기 (최근 5개 표시 + 접기)
│       ├─ 2026-02-15 - "Klubnacht" (Solomun, Ben Klock)
│       ├─ 2026-02-08 - "Saturday Night" (Marcel Dettmann)
│       └─ ...
└─ [Import] 버튼
    ↓
백그라운드 처리
├─ 베뉴 데이터 → venue_references 테이블 등록
├─ 이벤트 데이터 → events 테이블 일괄 등록
├─ 아티스트 데이터 → 텍스트로 저장 (RA URL 메타데이터 포함)
└─ source 필드: 'ra_import' 으로 표기
    ↓
완료 화면
├─ "🎉 {베뉴명}이 등록되었습니다!"
├─ "N개의 과거 이벤트도 함께 가져왔어요"
└─ [베뉴 페이지 보기] 버튼 → /venue/{slug}
```

### 2.2 진입점

- **유일한 진입점**: 베뉴 검색 → 결과 없음 화면
- 별도 메뉴나 대시보드에서는 접근 불가
- 검색을 먼저 하도록 강제하여 중복 등록을 자연스럽게 방지

### 2.3 권한

- **로그인 유저만** Import 가능
- 비로그인 유저에게는 로그인/회원가입 유도 문구 표시
- 스팸 방지를 위한 로그인 필수 정책

---

## 3. 데이터 범위 및 처리 방식

### 3.1 Import 데이터 범위

| 데이터               | Import 여부 | 저장 방식                                   |
| -------------------- | ----------- | ------------------------------------------- |
| 베뉴 이름            | ✅          | `venue_references.name`                     |
| 도시/국가            | ✅          | `venue_references.city`, `country`          |
| 주소                 | ✅          | `venue_references.address`                  |
| RA URL               | ✅          | `venue_references.external_sources` (JSONB) |
| 과거 이벤트 목록     | ✅          | `events` 테이블 (전부 가져오기)             |
| 이벤트 내 아티스트   | ✅          | 텍스트로 저장 + RA URL 메타데이터 optional  |
| 이벤트 포스터 이미지 | ❌          | 저작권 이슈로 미포함                        |
| 티켓/가격 정보       | ❌          | DNA 서비스 범위 밖                          |

### 3.2 베뉴 데이터 처리

```
RA에서 가져오는 베뉴 정보:
├─ name → venue_references.name
├─ city → venue_references.city
├─ country → venue_references.country
├─ address → venue_references.address
├─ ra_url → venue_references.external_sources.ra_url
└─ slug 자동 생성 (name 기반 slugify)
```

- `source` 필드를 `'ra_import'`로 설정
- `created_by`는 Import를 실행한 유저의 ID

### 3.3 이벤트 데이터 처리

```
RA에서 가져오는 이벤트 정보:
├─ title → events.title
├─ date → events.date
├─ venue → events.venue_ref_id (위에서 생성한 베뉴에 연결)
├─ artists → events.data.lineup_text (텍스트)
│            events.data.artist_details (아티스트별 RA URL 포함, optional)
└─ ra_event_url → events.data.ra_event_url (메타데이터)
```

- `source` 필드를 `'ra_import'`로 설정
- `user_id`는 **nullable** 처리 (Import된 이벤트는 특정 유저 소유가 아님)
- 이벤트 전체를 한꺼번에 가져옴 (선택적 Import 없음)

### 3.4 아티스트 데이터 처리

- 현 단계에서는 **텍스트로만 저장**
- RA에서 아티스트의 RA 프로필 URL이 파싱되면 메타데이터로 함께 저장
- `artist_references` 테이블과의 연결(링크 생성)은 하지 않음
- **향후 Artist Import 기능 도입 시**, 저장된 RA URL을 키로 매칭 가능

```json
// events.data.artist_details 예시
{
    "artist_details": [
        {
            "name": "Ben Klock",
            "ra_url": "https://ra.co/dj/benklock"
        },
        {
            "name": "Marcel Dettmann",
            "ra_url": "https://ra.co/dj/marceldettmann"
        }
    ]
}
```

### 3.5 중복 방지

| 시나리오                      | 처리 방식                                             |
| ----------------------------- | ----------------------------------------------------- |
| 이미 DB에 있는 베뉴 검색      | Import UI 자체가 노출되지 않음 (검색 결과 있으므로)   |
| 동일한 RA URL로 재Import 시도 | "이미 등록된 베뉴입니다" 안내 + 해당 베뉴 페이지 링크 |
| 이름은 같지만 다른 베뉴       | RA URL이 다르면 별도 베뉴로 등록 (도시/국가로 구분)   |

---

## 4. 데이터베이스 스키마 변경사항

### 4.1 venue_references 테이블 변경

```sql
ALTER TABLE venue_references
  -- 데이터 출처 구분
  ADD COLUMN source varchar(50) DEFAULT 'manual',
  -- 'manual': 유저가 직접 생성
  -- 'ra_import': RA에서 Import
  -- 'seed': 시드 데이터

  -- 외부 소스 정보 (확장 가능한 JSONB)
  ADD COLUMN external_sources jsonb DEFAULT '{}'::jsonb;
  /* 예시:
  {
    "ra_url": "https://ra.co/clubs/12345",
    "ra_id": "12345",
    "imported_at": "2026-02-15T10:30:00Z",
    "imported_by": "user-uuid-here"
  }
  */

-- RA URL 기반 중복 방지 인덱스
CREATE UNIQUE INDEX idx_venue_ra_url
  ON venue_references ((external_sources->>'ra_url'))
  WHERE external_sources->>'ra_url' IS NOT NULL;
```

### 4.2 events 테이블 변경

```sql
ALTER TABLE events
  -- 데이터 출처 구분
  ADD COLUMN source varchar(50) DEFAULT 'manual',
  -- 'manual': 유저가 직접 생성
  -- 'ra_import': RA에서 Import

  -- user_id nullable로 변경 (Import된 이벤트는 소유자 없음)
  ALTER COLUMN user_id DROP NOT NULL;
```

**기존 events.data JSONB 필드 활용 (추가 컬럼 불필요):**

```json
// source가 'ra_import'인 이벤트의 data 예시
{
    "ra_event_url": "https://ra.co/events/1234567",
    "ra_event_id": "1234567",
    "lineup_text": "Ben Klock, Marcel Dettmann, Kobosil",
    "artist_details": [
        {
            "name": "Ben Klock",
            "ra_url": "https://ra.co/dj/benklock"
        },
        {
            "name": "Marcel Dettmann",
            "ra_url": "https://ra.co/dj/marceldettmann"
        }
    ],
    "imported_at": "2026-02-15T10:30:00Z",
    "imported_by": "user-uuid-here"
}
```

### 4.3 스키마 변경 요약

| 테이블             | 변경 내용                    | 타입          |
| ------------------ | ---------------------------- | ------------- |
| `venue_references` | `source` 컬럼 추가           | `varchar(50)` |
| `venue_references` | `external_sources` 컬럼 추가 | `jsonb`       |
| `venue_references` | RA URL 유니크 인덱스 추가    | index         |
| `events`           | `source` 컬럼 추가           | `varchar(50)` |
| `events`           | `user_id` nullable로 변경    | alter         |

---

## 5. 기술 구현 방안

### 5.1 아키텍처

```
[프론트엔드 (Next.js)]
    │
    │ POST /api/import/venue
    │ body: { ra_url: "https://ra.co/clubs/12345" }
    │
    ↓
[Next.js API Route (서버사이드)]
    │
    ├─ 1. URL 유효성 검증
    ├─ 2. 중복 체크 (DB 조회)
    ├─ 3. RA GraphQL API 호출 ←── 서버에서 서버로 (CORS 문제 없음)
    ├─ 4. 응답 데이터 파싱 & 정규화
    ├─ 5. DB 저장 (베뉴 + 이벤트 일괄)
    └─ 6. 결과 반환
    │
    ↓
[Supabase (PostgreSQL)]
```

### 5.2 CORS 해결 방식

- 프론트엔드에서 직접 RA에 요청하면 **CORS에 의해 차단됨**
- **해결**: Next.js API Route (서버사이드)에서 RA로 요청
- 서버 → 서버 통신이므로 CORS 제약 없음
- 프론트엔드는 DNA 자체 API (`/api/import/venue`)만 호출

### 5.3 RA 데이터 파싱 방식

**방안 A 채택: Next.js API Route에서 직접 RA GraphQL API 호출**

RA는 내부적으로 GraphQL API를 사용하며, 이를 통해 구조화된 데이터를 가져올 수 있음.

```
구현 흐름:
1. 유저가 입력한 RA URL에서 베뉴 ID 추출
   예: https://ra.co/clubs/12345 → id: 12345

2. RA GraphQL API 엔드포인트로 POST 요청
   URL: https://ra.co/graphql (RA 내부 GraphQL 엔드포인트)

3. 베뉴 정보 쿼리 → 이름, 위치, 주소 등 파싱

4. 해당 베뉴의 이벤트 목록 쿼리 → 이벤트명, 날짜, 아티스트 등 파싱
   (페이지네이션 처리 필요)

5. 파싱된 데이터를 DNA 스키마에 맞게 정규화

6. DB에 일괄 저장
```

**참고 오픈소스:**

- `djb-gt/resident-advisor-events-scraper` — RA GraphQL API 쿼리 구조 참고
- `ujaRHR/resident-advisor-scraper` — 이벤트 데이터 구조 참고
- Apify `augeas/resident-advisor` — 아티스트/베뉴 크롤링 구조 참고

### 5.4 API 엔드포인트 설계

#### POST `/api/import/venue/preview`

RA URL을 받아 미리보기 데이터를 반환 (DB 저장 없음)

**Request:**

```json
{
    "ra_url": "https://ra.co/clubs/12345"
}
```

**Response (성공):**

```json
{
    "status": "ok",
    "venue": {
        "name": "Berghain",
        "city": "Berlin",
        "country": "Germany",
        "address": "Am Wriezener Bhf, 10243 Berlin",
        "ra_url": "https://ra.co/clubs/12345"
    },
    "events": {
        "total_count": 247,
        "items": [
            {
                "title": "Klubnacht",
                "date": "2026-02-15",
                "lineup_text": "Ben Klock, Marcel Dettmann",
                "artist_details": [{ "name": "Ben Klock", "ra_url": "https://ra.co/dj/benklock" }],
                "ra_event_url": "https://ra.co/events/1234567"
            }
        ]
    }
}
```

**Response (중복):**

```json
{
    "status": "duplicate",
    "message": "이미 등록된 베뉴입니다",
    "existing_venue": {
        "slug": "berghain",
        "name": "Berghain",
        "url": "/venue/berghain"
    }
}
```

**Response (에러):**

```json
{
    "status": "error",
    "message": "유효하지 않은 RA URL입니다"
}
```

#### POST `/api/import/venue/confirm`

미리보기 확인 후 실제 DB 저장 실행

**Request:**

```json
{
    "ra_url": "https://ra.co/clubs/12345"
}
```

**Response:**

```json
{
    "status": "ok",
    "venue": {
        "slug": "berghain",
        "name": "Berghain",
        "url": "/venue/berghain"
    },
    "imported_events_count": 247
}
```

### 5.5 Rate Limiting

RA 서버에 부담을 주지 않기 위한 제한:

| 항목                    | 제한                                    |
| ----------------------- | --------------------------------------- |
| 유저당 Import 요청      | 최대 5회/시간                           |
| 전체 시스템 Import 요청 | 최대 30회/시간                          |
| RA API 요청 간 딜레이   | 최소 1초 간격                           |
| 이벤트 페이지네이션     | 한 번에 최대 50건씩, 요청 간 1초 딜레이 |

---

## 6. 정책 및 리스크 관리

### 6.1 RA 데이터 사용 정책

| 항목             | 방침                                          |
| ---------------- | --------------------------------------------- |
| 데이터 접근 방식 | RA 내부 GraphQL API 활용 (공식 API 아님)      |
| 수집 규모        | 유저 요청 기반 단건 처리 (대량 크롤링 아님)   |
| 데이터 용도      | DNA 플랫폼 내 베뉴/이벤트 정보 표시           |
| 원본 출처 표기   | Import된 데이터에 "Source: RA" 표기           |
| 저작권 콘텐츠    | 이미지, 리뷰 등 저작권 콘텐츠는 수집하지 않음 |

### 6.2 리스크 및 대응

| 리스크                              | 가능성 | 영향도 | 대응 방안                                                          |
| ----------------------------------- | ------ | ------ | ------------------------------------------------------------------ |
| RA가 GraphQL API 구조 변경          | 중     | 높음   | 파싱 로직 모듈화, 장애 감지 알림, 빠른 대응 체계                   |
| RA가 IP/User-Agent 차단             | 중     | 높음   | rate limiting 준수, 정중한 User-Agent 사용, 차단 시 기능 일시 중단 |
| RA로부터 법적 요청 (Cease & Desist) | 낮     | 높음   | 즉시 기능 중단 준비, 대안(수동 입력) 유지                          |
| 잘못된 데이터 Import (오파싱)       | 중     | 중     | 미리보기 단계에서 유저 확인, 신고 기능                             |
| 스팸성 Import                       | 낮     | 중     | 로그인 필수, rate limiting, 신고 기능                              |

### 6.3 데이터 품질 관리

**등록 후 검증 방식:**

- 전담 검수팀이 없으므로, Import된 데이터는 즉시 공개
- 문제 발견 시 **유저 신고 기능**으로 대응
- 신고된 베뉴/이벤트는 관리자(운영자)가 확인 후 수정/삭제
- Import된 데이터에는 `source: 'ra_import'` 태그가 붙어 필터링 가능

**원본 출처 표기:**

- Import된 베뉴 페이지에 "이 정보는 RA에서 가져왔습니다" 표기
- 베뉴 오너가 나중에 링크(Claim)하면, 직접 수정 가능

---

## 7. 엣지 케이스 및 예외 처리

### 7.1 URL 입력 관련

| 케이스                                        | 처리                                                         |
| --------------------------------------------- | ------------------------------------------------------------ |
| 유효하지 않은 URL 형식                        | "유효한 RA 베뉴 URL을 입력해주세요" 에러                     |
| 아티스트 RA 페이지 URL 입력 (clubs가 아닌 dj) | "이것은 아티스트 페이지입니다. 베뉴 URL을 입력해주세요" 안내 |
| 존재하지 않는 RA 베뉴                         | "RA에서 해당 베뉴를 찾을 수 없습니다" 에러                   |
| RA 서버 응답 없음/타임아웃                    | "RA 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요"    |

### 7.2 데이터 관련

| 케이스                          | 처리                                                        |
| ------------------------------- | ----------------------------------------------------------- |
| 이벤트가 0건인 베뉴             | 베뉴 정보만 등록, "이벤트 히스토리가 없습니다" 안내         |
| 이벤트가 1000건 이상인 베뉴     | 최근 500건까지만 Import (성능 고려)                         |
| slug 충돌 (이미 같은 slug 존재) | slug에 도시명 또는 숫자 suffix 추가 (예: `berghain-berlin`) |
| 동일 RA URL 재Import 시도       | "이미 등록된 베뉴입니다" + 해당 베뉴 페이지 링크            |

### 7.3 시스템 관련

| 케이스                       | 처리                                                      |
| ---------------------------- | --------------------------------------------------------- |
| Import 도중 서버 에러        | 트랜잭션 롤백, "Import에 실패했습니다. 다시 시도해주세요" |
| 동시에 같은 베뉴 Import 시도 | DB 유니크 인덱스로 첫 번째만 성공, 두 번째는 중복 에러    |
| Rate limit 초과              | "잠시 후 다시 시도해주세요 (N분 후 가능)"                 |

---

## 8. 향후 확장 계획

### 8.1 Artist Import 기능 (다음 단계)

- Venue Import와 유사한 방식으로 아티스트도 RA에서 Import
- 가입하지 않은 아티스트도 팬이 등록하여 정보 조회 가능
- 이때, 기존 Import된 이벤트의 `artist_details`에 저장된 RA URL을 활용해 자동 매칭

### 8.2 다중 소스 지원

- RA 외에 Shotgun, Clubbable, Dice 등 다른 소스에서도 Import 가능하도록 확장
- `external_sources` JSONB 필드를 활용하여 다양한 소스 URL 저장
- `source` 필드: `'ra_import'`, `'shotgun_import'`, `'dice_import'` 등으로 확장

### 8.3 이벤트 추가 플로우와의 연동

- 이벤트 추가 시 베뉴 검색 → 결과 없음 → "Create new venue" 옵션에서도 RA Import를 트리거할 수 있도록 연결
- 독립 기능으로 먼저 안정화한 후, 이벤트 추가 플로우에 자연스럽게 통합

### 8.4 Import 데이터 자동 업데이트

- 현재는 1회성 Import (이후 업데이트 없음)
- 향후 주기적으로 새 이벤트를 가져오는 자동 업데이트 기능 검토
- 베뉴 오너가 Claim한 경우에만 자동 업데이트 활성화 등 조건부 적용

---

## 부록

### A. RA URL 구조 참고

```
베뉴 페이지: https://ra.co/clubs/{id}
아티스트 페이지: https://ra.co/dj/{name}
이벤트 페이지: https://ra.co/events/{id}
```

### B. 기존 기획서와의 관계

| 기존 기획                  | 이 기획      | 관계                                                                       |
| -------------------------- | ------------ | -------------------------------------------------------------------------- |
| 4.3 RA 마이그레이션 플로우 | Venue Import | 별개 기능. 기존은 아티스트 본인의 프로필 Import, 이것은 베뉴 데이터 Import |
| 5.1 #6 RA 임포트           | Venue Import | 기존은 아티스트 이벤트 히스토리 Import. 보완적 관계                        |
| 5.1 #4 베뉴 시스템         | Venue Import | 기존 베뉴 생성의 대안 경로. 수동 "Create new venue" + RA Import 공존       |

### C. 의사결정 로그

| 항목               | 결정                                       | 이유                                                                          |
| ------------------ | ------------------------------------------ | ----------------------------------------------------------------------------- |
| Import 데이터 범위 | 베뉴 정보 + 과거 이벤트 히스토리           | 베뉴 페이지를 즉시 풍부하게 채우기 위해                                       |
| 이벤트 Import 방식 | 전부 가져오기 (선택 없음)                  | 유저가 남의 베뉴 이벤트를 선별할 이유 없음. 심플하게                          |
| Import 주체        | 아무 로그인 유저                           | 팬도 좋아하는 클럽을 등록할 수 있도록                                         |
| 진입점             | 베뉴 검색 결과 없음에서만                  | 검색을 먼저 강제하여 중복 방지                                                |
| 권한               | 로그인 유저만                              | 스팸 방지                                                                     |
| 아티스트 처리      | 텍스트 저장 + RA URL 메타데이터            | 이름만으로 매칭하면 오참조 위험. 나중에 Artist Import 시 RA URL로 정확히 매칭 |
| 식별 체계          | DNA 자체 ID primary, RA URL 보조           | RA 의존성 최소화 (프로젝트 핵심 가치)                                         |
| 데이터 품질 관리   | 등록 후 검증 (신고 기반)                   | 전담 검수팀 부재                                                              |
| 기술 방안          | Next.js API Route에서 RA GraphQL 직접 호출 | 비용 없음, 직접 통제 가능, 오픈소스 참고 가능                                 |
