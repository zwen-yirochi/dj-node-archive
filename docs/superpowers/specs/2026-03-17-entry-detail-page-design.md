# 엔트리 상세 페이지 설계 스펙

**날짜**: 2026-03-17
**관련 ADR**: 0001 (URL 전략), 0002 (설정 기반 렌더링), 0003 (컴포넌트 전략), 0004 (향후 확장)

## 개요

사용자 공개 페이지에서 엔트리 클릭 시 `/:user/:slug`로 라우팅되는 상세 페이지를 구현한다.
대상 엔트리 타입: Event, Mixset, Custom (Link 제외).
기존 `/event/:id` 라우트와 `/:user/:entryId` placeholder를 삭제하고 통합한다.

## URL & Slug 시스템

### 라우트

- `/:user/:slug` — Event, Mixset, Custom 엔트리의 상세 페이지
- `/event/:id` — **삭제**
- `/:user/:entryId` (기존 placeholder) — **삭제** (`[slug]`로 직접 교체, 동시 공존 불가)

### 마이그레이션 순서

1. DB 마이그레이션: `slug` 컬럼 추가 (nullable)
2. 백필 스크립트: 기존 entries에 title 기반 slug 생성
3. `slug` 컬럼을 `NOT NULL`로 변경
4. `[entryId]` 폴더를 `[slug]`로 **교체** (rename, 동시 공존 불가 — Next.js 동적 세그먼트 충돌)
5. `/event/[id]` 라우트 삭제

### Slug 생성 규칙

- 엔트리 생성 시 title로부터 자동 생성
- 유니코드 유지 (한글, 일본어 등 다국어 지원)
- 변환: 특수문자 제거, 공백 → `-`, lowercase
- `page_id` 범위 내 unique 제약
- 중복 시 suffix: `sunset-mix` → `sunset-mix-2`
- title이 빈 문자열/null인 경우: `untitled` → `untitled-2` ...

### DB 변경

```sql
-- Step 1: nullable로 추가
ALTER TABLE entries ADD COLUMN slug TEXT;

-- Step 2: 백필 스크립트 실행 (application level)
-- generateSlug(title) + ensureUniqueSlug(slug, pageId)

-- Step 3: NOT NULL 제약 추가
ALTER TABLE entries ALTER COLUMN slug SET NOT NULL;

-- Step 4: unique 제약 추가
ALTER TABLE entries ADD CONSTRAINT entries_page_id_slug_unique UNIQUE (page_id, slug);
```

### Slug 유틸

```
lib/utils/slug.ts
├── generateSlug(title: string): string
└── ensureUniqueSlug(slug: string, pageId: string): Promise<string>
```

- `ensureUniqueSlug`에서 DB unique 제약 위반 시 suffix 증가 후 재시도

### 접근 제어

- 현재 코드베이스에 entry 공개/비공개 체크 패턴이 없음
- 이번 스코프에서는 기존 패턴 유지 (모든 entry 접근 가능)
- 향후 entry visibility 시스템 도입 시 별도 스코프로 처리

## 페이지 구조

### 공통 쉘 (`EntryDetailShell`)

`DnaPageShell`을 래핑하여 상세 페이지 전용 레이아웃을 제공한다.

```
┌─────────────────────────────────┐
│ DnaPageShell                    │
│ ┌─────────────────────────────┐ │
│ │ DnaBreadcrumb               │ │
│ │ displayName > entry title   │ │
│ ├─────────────────────────────┤ │
│ │                             │ │
│ │ [설정 객체 기반 섹션 렌더링] │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ Footer                          │
└─────────────────────────────────┘
```

- `DnaBreadcrumb`의 username은 URL param이 아닌 user의 `displayName` 사용
- `getEntryDetailData`가 entry + user 정보를 함께 반환

### 타입별 구성

**Event**:

| 순서 | 컴포넌트            | 데이터              |
| ---- | ------------------- | ------------------- |
| 1    | `CoverImage`        | `imageUrls`         |
| 2    | `MetaTable`         | date, venue, lineup |
| 3    | `RichtextBlockView` | `description`       |
| 4    | `ExternalLinks`     | `links`             |

**Mixset**:

| 순서 | 컴포넌트            | 데이터        |
| ---- | ------------------- | ------------- |
| 1    | `CoverImage`        | `imageUrls`   |
| 2    | `MetaTable`         | duration, url |
| 3    | `TracklistTimeline` | `tracklist`   |
| 4    | `RichtextBlockView` | `description` |

**Custom**:

| 순서 | 컴포넌트        | 데이터                                         |
| ---- | --------------- | ---------------------------------------------- |
| 1    | `BlockRenderer` | `blocks[]` → 블록 타입별 `*BlockView` 디스패치 |

Custom은 `sections` 배열 대신 단일 `BlockRenderer` 컴포넌트가 blocks 배열을 순회하며 타입별 `*BlockView`를 렌더링한다.

## 설정 객체

### 구조

```typescript
// entry-detail.config.ts

// Link를 제외한 상세 페이지 대상 타입
type DetailableEntryType = Exclude<EntryType, 'link'>;

interface SectionConfig {
    component: ComponentType<{ entry: ContentEntry }>;
    dataKey?: keyof ContentEntry;
    fields?: MetaFieldConfig[];
}

interface MetaFieldConfig {
    label: string;
    dataKey: string;
    format: 'text' | 'date' | 'duration' | 'link' | 'list';
}

interface EntryDetailConfig {
    sections: SectionConfig[];
    generateMeta: (entry: ContentEntry, user: User) => {
        title: string;
        description: string;
        images: string[];
    };
}

const entryDetailConfig: Record<DetailableEntryType, EntryDetailConfig> = {
    event: { ... },
    mixset: { ... },
    custom: { ... },
};
```

### 타입 안전성

- `DetailableEntryType = Exclude<EntryType, 'link'>` — link 타입 config 정의 불필요
- `dataKey?: keyof ContentEntry` — 오타 시 컴파일 에러
- `generateMeta`는 `ContentEntry`와 `User`를 받음 (기존 코드베이스 타입 사용)

### OG 메타데이터

- `generateMeta`가 타입별 OG 태그 생성
- 구현하면서 타입별 필드 결정
- 반환 타입은 Next.js `Metadata`와 호환되는 구조

## 컴포넌트

### 범용 렌더러

| 컴포넌트            | 역할                                |
| ------------------- | ----------------------------------- |
| `CoverImage`        | 히어로 스타일 커버 이미지           |
| `MetaTable`         | format 옵션이 있는 메타 정보 테이블 |
| `TracklistTimeline` | Mixset 트랙리스트 타임라인 표시     |
| `ExternalLinks`     | 외부 링크 목록                      |

### Custom 블록 뷰

| 컴포넌트            | 블록 타입                               |
| ------------------- | --------------------------------------- |
| `HeaderBlockView`   | `header`                                |
| `RichtextBlockView` | `richtext` (범용 Description 역할 겸용) |
| `ImageBlockView`    | `image` (인라인 레이아웃)               |
| `EmbedBlockView`    | `embed`                                 |
| `KeyvalueBlockView` | `keyvalue`                              |

`BlockRenderer`: blocks 배열을 받아 타입별 `*BlockView`로 디스패치하는 컴포넌트.

### 범용 컴포넌트

| 컴포넌트           | 역할                                                     |
| ------------------ | -------------------------------------------------------- |
| `DnaBreadcrumb`    | 범용 breadcrumb (`/:user`, `/:venue` 등에서도 사용 가능) |
| `EntryDetailShell` | `DnaPageShell` 래핑 + 상세 페이지 공통 레이아웃          |

## 데이터 흐름

### SSR

```
[user]/[slug]/page.tsx
  → getEntryDetailData(username, slug)    // entry + user 반환
  → generateMetadata()                     // config.generateMeta(entry, user)
  → EntryDetailShell (DnaPageShell 래핑)
    → DnaBreadcrumb (user.displayName > entry.title)
    → entryDetailConfig[entry.type].sections.map(section =>
        <section.component entry={entry} />
      )
```

### 4-Layer

| Layer     | 파일                               | 역할                                      |
| --------- | ---------------------------------- | ----------------------------------------- |
| Database  | `lib/db/queries/entry.queries.ts`  | `getEntryBySlug(pageId, slug)` 추가       |
| Service   | `lib/services/user.service.ts`     | `getEntryDetailData(username, slug)` 추가 |
| Route     | `app/(dna)/[user]/[slug]/page.tsx` | 서버 컴포넌트, ISR (`revalidate: 300`)    |
| Component | `components/dna/entry-detail/`     | 설정 기반 렌더링                          |

### 캐싱

- `export const revalidate = 300` (5분 ISR, 기존 event 상세와 동일)

## 파일 구조

### 신규

```
src/
├── app/(dna)/[user]/[slug]/
│   ├── page.tsx
│   └── not-found.tsx
├── components/dna/
│   ├── DnaBreadcrumb.tsx
│   ├── EntryDetailShell.tsx
│   └── entry-detail/
│       ├── entry-detail.config.ts
│       ├── CoverImage.tsx
│       ├── MetaTable.tsx
│       ├── TracklistTimeline.tsx
│       ├── ExternalLinks.tsx
│       ├── BlockRenderer.tsx
│       └── block-views/
│           ├── HeaderBlockView.tsx
│           ├── RichtextBlockView.tsx
│           ├── ImageBlockView.tsx
│           ├── EmbedBlockView.tsx
│           └── KeyvalueBlockView.tsx
├── lib/
│   ├── db/queries/entry.queries.ts  (수정)
│   ├── services/user.service.ts     (수정)
│   └── utils/slug.ts               (신규)
```

### 삭제

```
src/app/(dna)/event/[id]/           # 기존 Event 상세 라우트 전체
src/app/(dna)/[user]/[entryId]/     # 기존 placeholder 페이지
```

### 수정

- `entries` 테이블 마이그레이션 (slug 컬럼 추가 + 백필)
- 공개 페이지 뷰 컴포넌트들 (`ListView`, `CarouselView`, `FeatureView`) — 링크를 `/:user/:slug`로 변경
- `EntryCard` — 모든 상세 가능 엔트리(Event, Mixset, Custom)를 클릭 가능하게 변경
- 엔트리 생성 mutation — slug 자동 생성 로직 추가

## 스코프 외 (향후)

- 단축 URL 기능
- title 변경 시 slug 동기화 정책
- 대시보드 설정 객체와 통합
- entry 공개/비공개 접근 제어
