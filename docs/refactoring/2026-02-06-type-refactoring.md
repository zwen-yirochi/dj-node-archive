# 타입 리팩토링 작업 기록

**날짜**: 2026-02-06
**브랜치**: refactor/dashboard-code-review-72
**참조 스펙**: `docs/specs/DATABASE_SCHEMA_SPECIFICATION.md`

---

## 배경

기존 타입 정의가 DB 스키마 스펙과 불일치. 일괄 리팩토링 진행.

---

## 변경된 타입 (database.ts)

### User

```typescript
// Before
interface User {
    id: string;
    username: string;
    email?: string;
    display_name?: string;
    // instagram, soundcloud 누락
}

// After
interface User {
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
```

### Page

```typescript
// Before
interface Page {
    template_type?: string;
    theme?: Record<string, unknown>;
    is_public?: boolean;
}

// After
interface Page {
    id: string;
    user_id: string;
    slug: string;
    title?: string;
    bio?: string;
    avatar_url?: string;
    theme_color: string; // HEX 색상
    created_at: string;
    updated_at: string;
}
```

### Venue (VenueReference → Venue)

```typescript
// Before
interface VenueReference {
    linked_page_id?: string;
    linked_at?: string;
    created_by?: string;
}

// After
interface Venue {
    id: string;
    name: string;
    slug: string;
    city?: string;
    country?: string;
    address?: string;
    google_maps_url?: string;
    instagram?: string;
    website?: string;
    claimed_by?: string; // 클레임한 사용자 ID
    created_at: string;
    updated_at: string;
}
```

### Artist (ArtistReference → Artist)

```typescript
// Before
interface ArtistReference {
    ra_url?: string;
    created_by?: string;
}

// After
interface Artist {
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
```

### Event (완전 재작성)

```typescript
// Before - 별도 테이블 참조
interface Event {
    user_id: string;
    venue_ref_id: string; // venues 테이블 FK
    data?: {
        poster_url?: string;
        notes?: string;
        lineup_text?: string;
    };
}

// After - JSONB 내장
interface Event {
    id: string;
    title: string;
    slug: string;
    date: string;
    venue: EventVenue; // JSONB (선택적 참조)
    lineup: EventPerformer[]; // JSONB 배열 (선택적 참조)
    data: EventData; // JSONB (추가 정보)
    is_public: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

// JSONB 서브타입
interface EventVenue {
    venue_id?: string; // venues 테이블 참조 (optional)
    name: string; // 항상 저장
}

interface EventPerformer {
    artist_id?: string; // artists 테이블 참조 (optional)
    name: string; // 항상 저장
}

interface EventData {
    poster_url?: string;
    description?: string;
    links?: EventLink[];
}
```

### Mixset (신규)

```typescript
interface Mixset {
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

interface Track {
    track: string;
    artist: string;
    time: string;
}
```

### Entry (is_visible 추가, 타입 정리)

```typescript
// Before
type EntryType = 'event' | 'mixset' | 'link' | 'text' | 'image';

// After
type EntryType = 'link' | 'event' | 'mixset';

interface Entry {
    id: string;
    page_id: string;
    type: EntryType;
    position: number;
    is_visible: boolean; // 추가됨
    data: EntryData;
    created_at: string;
    updated_at: string;
}

// Entry data 유니온 (참조형/자체형 구분)
type EntryData =
    | LinkEntryData
    | EventReferenceData // events 테이블 참조
    | EventSelfData // 자체 데이터 (프라이빗)
    | MixsetEntryData; // mixsets 테이블 참조
```

### Mention (신규 - 백링크/그래프뷰)

```typescript
type MentionSourceType = 'event' | 'entry' | 'page';
type MentionTargetType = 'venue' | 'artist' | 'event' | 'user';
type MentionContext = 'venue' | 'lineup' | 'description_mention' | 'event_reference';

interface Mention {
    id: string;
    source_type: MentionSourceType;
    source_id: string;
    target_type: MentionTargetType;
    target_id: string;
    context: MentionContext;
    created_at: string;
}
```

---

## 삭제된 타입

| 타입                      | 이유                       |
| ------------------------- | -------------------------- |
| `EventPerformer` (구버전) | events.lineup JSONB로 대체 |
| `PerformanceType`         | 스펙에서 제거              |
| `DBUser`, `DBEntry` 등    | 불필요한 별칭 제거         |
| `VenueReference`          | `Venue`로 이름 변경        |
| `ArtistReference`         | `Artist`로 이름 변경       |

---

## 작업 순서 (TODO)

### Phase 1: 타입 정의

- [x] `database.ts` - DB 타입
- [ ] `domain.ts` - 도메인 타입
- [ ] `guards.ts` - 타입 가드
- [ ] `index.ts` - export 정리

### Phase 2: 매퍼/변환

- [ ] `mappers/user.mapper.ts`
- [ ] `transformers.ts`

### Phase 3: DB 쿼리

- [ ] `user.queries.ts`
- [ ] `entry.queries.ts`
- [ ] `event.queries.ts`
- [ ] `venue.queries.ts`
- [ ] `artist.queries.ts`
- [ ] `performer.queries.ts` → 삭제

### Phase 4: API

- [ ] `events/[id]/performers/` → 삭제
- [ ] 나머지 API 핸들러

### Phase 5: 컴포넌트

- [ ] dashboard 컴포넌트
- [ ] public 페이지 컴포넌트

---

## JSONB 사용 예시

### Supabase에서 JSONB 필드 다루기

```typescript
// 조회 - JSONB 필드는 자동으로 파싱됨
const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single();

// event.venue.name → "Berghain"
// event.lineup[0].name → "Nina Kraviz"

// 생성 - 객체/배열 그대로 전달
await supabase.from('events').insert({
    title: 'My Event',
    slug: 'my-event',
    date: new Date().toISOString(),
    venue: { name: 'Club Name' }, // venue_id 없이도 OK
    lineup: [{ name: 'DJ Name' }], // artist_id 없이도 OK
    data: {},
    is_public: false,
    created_by: userId,
});

// JSONB 내부 필드로 검색
await supabase.from('events').select('*').eq('venue->venue_id', venueId);

// 배열에 특정 객체 포함 여부
await supabase
    .from('events')
    .select('*')
    .contains('lineup', [{ artist_id: artistId }]);
```

### 선택적 참조 패턴

```typescript
// venue_id가 있으면 → mentions 테이블에 백링크 추가
// venue_id가 없으면 → name으로만 표시 (그래프뷰에 안 나옴)

const venue: EventVenue = venueId
    ? { venue_id: venueId, name: venueName } // 참조형
    : { name: venueName }; // 자체형
```

---

## 참고

- 스펙 문서: `docs/specs/DATABASE_SCHEMA_SPECIFICATION.md`
- DB 스키마는 이미 스펙에 맞게 마이그레이션 완료
- 타입 정의만 스펙에 맞추는 작업
