-- ============================================================================
-- DJ Node Archive - Database Schema
-- ============================================================================
-- 프로젝트: DJ/아티스트용 Link-in-Bio + 이벤트/믹스 아카이브
-- 스택: Next.js 16, TypeScript, Supabase
-- 작성일: 2026-02-05
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (개발용)
DROP TABLE IF EXISTS mentions CASCADE;
DROP TABLE IF EXISTS entries CASCADE;
DROP TABLE IF EXISTS mixsets CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 1. USERS - 가입 사용자
-- ============================================================================
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 인증 정보
  auth_user_id uuid UNIQUE,  -- Supabase Auth UUID
  email varchar(255) UNIQUE NOT NULL,
  
  -- 프로필 정보
  username varchar(100) NOT NULL,  -- 실제 이름 (중복 가능)
  display_name varchar(50) UNIQUE NOT NULL,  -- URL slug (고유)
  avatar_url text,
  bio text,
  
  -- 소셜 링크
  instagram varchar(100),
  soundcloud varchar(100),
  
  -- 타임스탬프
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2. PAGES - 사용자 페이지 (1:1)
-- ============================================================================
CREATE TABLE pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 페이지 정보
  slug varchar(50) UNIQUE NOT NULL,  -- users.display_name과 동기화
  title varchar(200),
  bio text,
  avatar_url text,
  
  -- 테마
  theme_color varchar(7) DEFAULT '#000000',  -- HEX color
  
  -- 타임스탬프
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. VENUES - 베뉴 (위키 방식, 클레임 가능)
-- ============================================================================
CREATE TABLE venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  name varchar(200) NOT NULL,
  slug varchar(100) UNIQUE NOT NULL,
  
  -- 위치 정보
  city varchar(100),
  country varchar(100),
  address text,
  google_maps_url text,
  
  -- 소셜 링크
  instagram varchar(100),
  website text,
  
  -- 클레임 정보
  claimed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- 타임스탬프
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. ARTISTS - 아티스트 (위키 방식, 클레임 가능)
-- ============================================================================
CREATE TABLE artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  name varchar(200) NOT NULL,
  slug varchar(100) UNIQUE NOT NULL,
  bio text,
  
  -- 소셜 링크
  instagram varchar(100),
  soundcloud varchar(100),
  spotify varchar(100),
  
  -- 클레임 정보
  claimed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- 타임스탬프
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 5. EVENTS - 이벤트
-- ============================================================================
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  title varchar(300) NOT NULL,
  slug varchar(150) UNIQUE NOT NULL,
  date timestamptz NOT NULL,
  
  -- Venue (선택적 참조)
  -- { venue_id?: uuid, name: string }
  venue jsonb NOT NULL,
  
  -- Lineup (선택적 참조 배열)
  -- [{ artist_id?: uuid, name: string }]
  lineup jsonb DEFAULT '[]'::jsonb,
  
  -- 추가 데이터
  -- { poster_url?: string, description?: string, links?: [{title, url}] }
  data jsonb DEFAULT '{}'::jsonb,
  
  -- 공개 여부
  is_public boolean DEFAULT false,
  
  -- 작성자
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 타임스탬프
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 6. MIXSETS - 믹스/세트 (추후 구현)
-- ============================================================================
CREATE TABLE mixsets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  title varchar(300) NOT NULL,
  slug varchar(150) UNIQUE NOT NULL,
  date timestamptz,
  duration_minutes integer,
  
  -- 트랙리스트
  -- [{ track: string, artist: string, time: string }]
  tracklist jsonb DEFAULT '[]'::jsonb,
  
  -- 미디어
  audio_url text,
  cover_url text,
  
  -- 외부 링크
  soundcloud_url text,
  mixcloud_url text,
  
  -- 작성자
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 타임스탬프
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 7. ENTRIES - 페이지 콘텐츠
-- ============================================================================
CREATE TABLE entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  
  -- 타입
  type varchar(20) NOT NULL CHECK (type IN ('link', 'event', 'mixset')),
  
  -- 표시 설정
  position integer NOT NULL,
  is_visible boolean DEFAULT true,
  
  -- 타입별 데이터
  -- type='link': { url: string, title: string, icon?: string }
  -- type='event' (참조): { event_id: uuid, custom_title?: string }
  -- type='event' (자체): { title, date, venue: {venue_id?, name}, lineup: [...], ... }
  -- type='mixset': { mixset_id: uuid }
  data jsonb NOT NULL,
  
  -- 타임스탬프
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- 같은 페이지 내 position 중복 방지
  UNIQUE(page_id, position)
);

-- ============================================================================
-- 8. MENTIONS - 백링크/그래프 뷰 (옵시디언 스타일)
-- ============================================================================
CREATE TABLE mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 소스 (누가)
  source_type varchar(20) NOT NULL CHECK (source_type IN ('event', 'entry', 'page')),
  source_id uuid NOT NULL,
  
  -- 타겟 (누구를)
  target_type varchar(20) NOT NULL CHECK (target_type IN ('venue', 'artist', 'event', 'user')),
  target_id uuid NOT NULL,
  
  -- 컨텍스트 (어떤 방식으로)
  context varchar(50) NOT NULL CHECK (
    context IN ('venue', 'lineup', 'description_mention', 'event_reference')
  ),
  
  -- 타임스탬프
  created_at timestamptz DEFAULT now(),
  
  -- 중복 방지
  UNIQUE(source_type, source_id, target_type, target_id, context)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_display_name ON users(display_name);

-- Pages
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_user_id ON pages(user_id);

-- Venues
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_claimed_by ON venues(claimed_by);

-- Artists
CREATE INDEX idx_artists_slug ON artists(slug);
CREATE INDEX idx_artists_claimed_by ON artists(claimed_by);

-- Events
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_is_public ON events(is_public);
CREATE INDEX idx_events_created_by ON events(created_by);

-- Mixsets
CREATE INDEX idx_mixsets_slug ON mixsets(slug);
CREATE INDEX idx_mixsets_created_by ON mixsets(created_by);

-- Entries
CREATE INDEX idx_entries_page_id ON entries(page_id);
CREATE INDEX idx_entries_type ON entries(type);
CREATE INDEX idx_entries_page_position ON entries(page_id, position);

-- Mentions (백링크 조회 최적화)
CREATE INDEX idx_mentions_target ON mentions(target_type, target_id);
CREATE INDEX idx_mentions_source ON mentions(source_type, source_id);
CREATE INDEX idx_mentions_context ON mentions(context);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Sample User: DJ John
INSERT INTO users (id, auth_user_id, email, username, display_name, avatar_url, bio, instagram, soundcloud)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'john@example.com',
  'John Doe',
  'djjohn',
  'https://example.com/avatars/john.jpg',
  'Techno DJ based in Berlin',
  '@djjohn',
  'djjohn'
);

-- Sample Page: DJ John's page
INSERT INTO pages (id, user_id, slug, title, bio, avatar_url, theme_color)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'djjohn',
  'DJ John',
  'Berlin-based techno DJ and producer',
  'https://example.com/avatars/john.jpg',
  '#FF6B6B'
);

-- Sample Venue: Berghain (unclaimed)
INSERT INTO venues (id, name, slug, city, country, address, google_maps_url, instagram, website, claimed_by)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Berghain',
  'berghain',
  'Berlin',
  'Germany',
  'Am Wriezener Bahnhof, 10243 Berlin',
  'https://maps.google.com/?cid=berghain',
  '@berghain',
  'https://www.berghain.berlin',
  NULL  -- unclaimed
);

-- Sample Artist: Nina Kraviz (unclaimed)
INSERT INTO artists (id, name, slug, bio, instagram, soundcloud, spotify, claimed_by)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'Nina Kraviz',
  'nina-kraviz',
  'Russian DJ and producer',
  '@ninakraviz',
  'nina-kraviz',
  'nina-kraviz',
  NULL  -- unclaimed
);

-- Sample Event: Klubnacht
INSERT INTO events (id, title, slug, date, venue, lineup, data, is_public, created_by)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'Klubnacht',
  'klubnacht-2024-03-15',
  '2024-03-15 23:00:00+00',
  '{
    "venue_id": "44444444-4444-4444-4444-444444444444",
    "name": "Berghain"
  }'::jsonb,
  '[
    {
      "artist_id": "55555555-5555-5555-5555-555555555555",
      "name": "Nina Kraviz"
    },
    {
      "name": "Ben Klock"
    }
  ]'::jsonb,
  '{
    "poster_url": "https://example.com/posters/klubnacht.jpg",
    "description": "Amazing night @Berghain with @Nina Kraviz",
    "links": [
      {"title": "Tickets", "url": "https://example.com/tickets"},
      {"title": "Facebook Event", "url": "https://facebook.com/events/123"}
    ]
  }'::jsonb,
  true,  -- is_public
  '11111111-1111-1111-1111-111111111111'
);

-- Sample Mixset: Berlin Closing Set
INSERT INTO mixsets (id, title, slug, date, duration_minutes, tracklist, audio_url, cover_url, soundcloud_url, created_by)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  'Berlin Closing Set',
  'berlin-closing-set-2024',
  '2024-03-16 06:00:00+00',
  120,
  '[
    {"track": "Track 1", "artist": "Artist 1", "time": "00:00"},
    {"track": "Track 2", "artist": "Artist 2", "time": "05:30"},
    {"track": "Track 3", "artist": "Artist 3", "time": "12:00"}
  ]'::jsonb,
  'https://example.com/audio/berlin-set.mp3',
  'https://example.com/covers/berlin-set.jpg',
  'https://soundcloud.com/djjohn/berlin-set',
  '11111111-1111-1111-1111-111111111111'
);

-- Sample Entry 1: Link (Instagram)
INSERT INTO entries (id, page_id, type, position, is_visible, data)
VALUES (
  '88888888-8888-8888-8888-888888888881',
  '33333333-3333-3333-3333-333333333333',
  'link',
  0,
  true,
  '{
    "url": "https://instagram.com/djjohn",
    "title": "Instagram",
    "icon": "instagram"
  }'::jsonb
);

-- Sample Entry 2: Event (참조형)
INSERT INTO entries (id, page_id, type, position, is_visible, data)
VALUES (
  '88888888-8888-8888-8888-888888888882',
  '33333333-3333-3333-3333-333333333333',
  'event',
  1,
  true,
  '{
    "event_id": "66666666-6666-6666-6666-666666666666"
  }'::jsonb
);

-- Sample Entry 3: Mixset
INSERT INTO entries (id, page_id, type, position, is_visible, data)
VALUES (
  '88888888-8888-8888-8888-888888888883',
  '33333333-3333-3333-3333-333333333333',
  'mixset',
  2,
  true,
  '{
    "mixset_id": "77777777-7777-7777-7777-777777777777"
  }'::jsonb
);

-- Sample Mention 1: Event → Venue
INSERT INTO mentions (id, source_type, source_id, target_type, target_id, context)
VALUES (
  '99999999-9999-9999-9999-999999999991',
  'event',
  '66666666-6666-6666-6666-666666666666',
  'venue',
  '44444444-4444-4444-4444-444444444444',
  'venue'
);

-- Sample Mention 2: Event → Artist (lineup)
INSERT INTO mentions (id, source_type, source_id, target_type, target_id, context)
VALUES (
  '99999999-9999-9999-9999-999999999992',
  'event',
  '66666666-6666-6666-6666-666666666666',
  'artist',
  '55555555-5555-5555-5555-555555555555',
  'lineup'
);

-- Sample Mention 3: Entry → Event (참조)
INSERT INTO mentions (id, source_type, source_id, target_type, target_id, context)
VALUES (
  '99999999-9999-9999-9999-999999999993',
  'entry',
  '88888888-8888-8888-8888-888888888882',
  'event',
  '66666666-6666-6666-6666-666666666666',
  'event_reference'
);

-- ============================================================================
-- SAMPLE QUERIES (주석)
-- ============================================================================

-- 1. DJ John 페이지의 모든 entries 조회 (position 순서대로)
-- SELECT * FROM entries 
-- WHERE page_id = '33333333-3333-3333-3333-333333333333'
-- ORDER BY position;

-- 2. Berghain에서 열린 모든 이벤트 조회
-- SELECT * FROM events 
-- WHERE venue->>'venue_id' = '44444444-4444-4444-4444-444444444444';

-- 3. Nina Kraviz가 참여한 모든 이벤트 조회 (lineup에서 검색)
-- SELECT * FROM events
-- WHERE lineup @> '[{"artist_id": "55555555-5555-5555-5555-555555555555"}]';

-- 4. Berghain의 백링크 조회 (이 베뉴를 언급한 모든 것)
-- SELECT * FROM mentions
-- WHERE target_type = 'venue' 
--   AND target_id = '44444444-4444-4444-4444-444444444444';

-- 5. Event를 참조하는 모든 entries 조회
-- SELECT e.* FROM entries e
-- JOIN mentions m ON m.source_id = e.id
-- WHERE m.target_type = 'event'
--   AND m.target_id = '66666666-6666-6666-6666-666666666666'
--   AND m.context = 'event_reference';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
