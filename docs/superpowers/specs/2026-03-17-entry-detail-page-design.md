# 엔트리 상세 페이지 설계 스펙

**날짜**: 2026-03-17
**관련 ADR**: 0001 (URL 전략), 0002 (설정 기반 렌더링), 0003 (컴포넌트 전략), 0004 (향후 확장)

## 개요

사용자 공개 페이지에서 엔트리 클릭 시 `/:user/:slug`로 라우팅되는 상세 페이지를 구현한다.
대상 엔트리 타입: Event, Mixset, Custom (Link 제외).
기존 `/event/:id` 라우트를 삭제하고 통합한다.

## URL & Slug 시스템

### 라우트

- `/:user/:slug` — 모든 엔트리 타입의 상세 페이지
- `/event/:id` — **삭제**
- `/:user/:entryId` (기존 placeholder) — **삭제**

### Slug 생성 규칙

- 엔트리 생성 시 title로부터 자동 생성
- 유니코드 유지 (한글, 일본어 등 다국어 지원)
- 변환: 특수문자 제거, 공백 → `-`, lowercase
- `page_id` 범위 내 unique 제약
- 중복 시 suffix: `sunset-mix` → `sunset-mix-2`

### DB 변경

```sql
ALTER TABLE entries ADD COLUMN slug TEXT;
-- page_id 범위 내 unique
ALTER TABLE entries ADD CONSTRAINT entries_page_id_slug_unique UNIQUE (page_id, slug);
```

### Slug 유틸

```
lib/utils/slug.ts
├── generateSlug(title: string): string
└── ensureUniqueSlug(slug: string, pageId: string): Promise<string>
```

## 페이지 구조

### 공통 쉘 (`EntryDetailShell`)

```
┌─────────────────────────────────┐
│ DnaBreadcrumb                   │
│ username > entry title          │
├─────────────────────────────────┤
│                                 │
│ [설정 객체 기반 섹션 렌더링]       │
│                                 │
└─────────────────────────────────┘
```

### 타입별 구성

**Event**:
| 순서 | 컴포넌트 | 데이터 |
|------|----------|--------|
| 1 | `CoverImage` | `imageUrls` |
| 2 | `MetaTable` | date, venue, lineup |
| 3 | `RichtextBlockView` | `description` |
| 4 | `ExternalLinks` | `links` |

**Mixset**:
| 순서 | 컴포넌트 | 데이터 |
|------|----------|--------|
| 1 | `CoverImage` | `imageUrls` |
| 2 | `MetaTable` | duration, url |
| 3 | `TracklistTimeline` | `tracklist` |
| 4 | `RichtextBlockView` | `description` |

**Custom**:
| 순서 | 컴포넌트 | 데이터 |
|------|----------|--------|
| 1 | 블록 순회 | `blocks[]` → 각 블록 타입에 대응하는 `*BlockView` |

## 설정 객체

### 구조

```typescript
// entry-detail.config.ts

interface SectionConfig {
  component: ComponentType<any>;
  dataKey?: string;
  fields?: MetaFieldConfig[];
}

interface MetaFieldConfig {
  label: string;
  dataKey: string;
  format: 'text' | 'date' | 'duration' | 'link' | 'list';
}

interface EntryDetailConfig {
  sections: SectionConfig[];
  generateMeta: (entry: DomainEntry, user: DomainUser) => OGMetadata;
}

const entryDetailConfig: Record<EntryType, EntryDetailConfig> = {
  event: { ... },
  mixset: { ... },
  custom: { ... },
};
```

### OG 메타데이터

- `generateMeta`가 타입별 OG 태그 생성
- 구현하면서 타입별 필드 결정

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

### 범용 컴포넌트

| 컴포넌트           | 역할                                                     |
| ------------------ | -------------------------------------------------------- |
| `DnaBreadcrumb`    | 범용 breadcrumb (`/:user`, `/:venue` 등에서도 사용 가능) |
| `EntryDetailShell` | 상세 페이지 공통 쉘                                      |

## 데이터 흐름

### SSR

```
[user]/[slug]/page.tsx
  → getEntryDetailData(username, slug)    // 서비스 레이어
  → generateMetadata()                     // 설정 객체의 generateMeta 사용
  → EntryDetailShell
    → entryDetailConfig[entry.type].sections.map(section =>
        <section.component data={entry[section.dataKey]} />
      )
```

### 4-Layer

| Layer     | 파일                               | 역할                                      |
| --------- | ---------------------------------- | ----------------------------------------- |
| Database  | `lib/db/queries/entry.queries.ts`  | `getEntryBySlug(pageId, slug)` 추가       |
| Service   | `lib/services/user.service.ts`     | `getEntryDetailData(username, slug)` 추가 |
| Route     | `app/(dna)/[user]/[slug]/page.tsx` | 서버 컴포넌트, ISR                        |
| Component | `components/dna/entry-detail/`     | 설정 기반 렌더링                          |

## 파일 구조

### 신규

```
src/
├── app/(dna)/[user]/[slug]/
│   └── page.tsx
├── components/dna/
│   ├── DnaBreadcrumb.tsx
│   ├── EntryDetailShell.tsx
│   └── entry-detail/
│       ├── entry-detail.config.ts
│       ├── CoverImage.tsx
│       ├── MetaTable.tsx
│       ├── TracklistTimeline.tsx
│       ├── ExternalLinks.tsx
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

- `entries` 테이블 마이그레이션 (slug 컬럼)
- 공개 페이지 뷰 컴포넌트들 (`ListView`, `CarouselView`, `FeatureView`) — 링크를 `/:user/:slug`로 변경
- `EntryCard` — 모든 상세 가능 엔트리를 클릭 가능하게 변경

## 스코프 외 (향후)

- 단축 URL 기능
- title 변경 시 slug 동기화 정책
- 대시보드 설정 객체와 통합
