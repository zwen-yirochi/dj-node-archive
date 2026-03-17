-- ============================================
-- Demo User Data Reset
-- ============================================
-- 실행: Supabase SQL Editor에서 직접 실행하거나 크론으로 호출
-- 대상: demo 유저의 entries + 프로필만 리셋 (user/page 레코드는 유지)
--
-- demo user_id: 36a42a9d-0698-415a-a775-91738aa3217b
-- demo page_id: 28199ca5-6d86-4b88-a772-fd58323fee5e

BEGIN;

-- ── 1. 기존 entries 삭제 ──
DELETE FROM entries
WHERE page_id = '28199ca5-6d86-4b88-a772-fd58323fee5e';

-- ── 2. 프로필 리셋 ──
UPDATE users SET
    display_name = 'Demo DJ',
    bio = 'Seoul-based DJ. Vinyl digger, late-night selector.',
    avatar_url = NULL
WHERE id = '36a42a9d-0698-415a-a775-91738aa3217b';

UPDATE pages SET
    header_style = 'minimal',
    links = '[]'::jsonb
WHERE id = '28199ca5-6d86-4b88-a772-fd58323fee5e';

-- ── 3. Event entries ──

-- Event 1: 과거 이벤트
INSERT INTO entries (id, page_id, type, position, slug, data) VALUES
('d0000001-0000-0000-0000-000000000001', '28199ca5-6d86-4b88-a772-fd58323fee5e', 'event', 0, 'midnight-session-vol12', '{
    "title": "Midnight Session Vol.12",
    "date": "2025-12-20",
    "venue": {"name": "Cakeshop"},
    "lineup": [{"name": "Demo DJ"}, {"name": "SOULSCAPE"}, {"name": "MOGWAA"}],
    "image_urls": ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80"],
    "description": "Monthly deep listening session. Vinyl only.",
    "links": []
}'::jsonb);

-- Event 2: 과거 이벤트
INSERT INTO entries (id, page_id, type, position, slug, data) VALUES
('d0000001-0000-0000-0000-000000000002', '28199ca5-6d86-4b88-a772-fd58323fee5e', 'event', 1, 'new-year-warm-up', '{
    "title": "New Year Warm Up",
    "date": "2025-12-31",
    "venue": {"name": "Faust"},
    "lineup": [{"name": "Demo DJ"}, {"name": "PARK HYE JIN"}],
    "image_urls": ["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80"],
    "description": "Closing out the year with house and disco.",
    "links": []
}'::jsonb);

-- Event 3: 최근 이벤트
INSERT INTO entries (id, page_id, type, position, slug, data) VALUES
('d0000001-0000-0000-0000-000000000003', '28199ca5-6d86-4b88-a772-fd58323fee5e', 'event', 2, 'groove-theory', '{
    "title": "Groove Theory",
    "date": "2026-02-15",
    "venue": {"name": "Pistil"},
    "lineup": [{"name": "Demo DJ"}, {"name": "DJ SODA"}, {"name": "YETSUBY"}],
    "image_urls": ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80"],
    "description": "A night of broken beats and future jazz.",
    "links": []
}'::jsonb);

-- Event 4: 미공개 (display_order NULL)
INSERT INTO entries (id, page_id, type, position, slug, data) VALUES
('d0000001-0000-0000-0000-000000000004', '28199ca5-6d86-4b88-a772-fd58323fee5e', 'event', 3, 'draft-event', '{
    "title": "Draft Event",
    "date": "",
    "venue": {"name": ""},
    "lineup": [],
    "image_urls": [],
    "description": "",
    "links": []
}'::jsonb);

-- ── 4. Mixset entries ──

INSERT INTO entries (id, page_id, type, position, slug, data) VALUES
('d0000002-0000-0000-0000-000000000001', '28199ca5-6d86-4b88-a772-fd58323fee5e', 'mixset', 0, 'late-night-selections-08', '{
    "title": "Late Night Selections #08",
    "url": "https://soundcloud.com/boaboramusic/sets/underground-vibes",
    "image_urls": [],
    "tracklist": [
        {"title": "Intro", "artist": "Demo DJ"},
        {"title": "Blue Train", "artist": "John Coltrane"},
        {"title": "Windowlicker", "artist": "Aphex Twin"}
    ],
    "description": "Eclectic mix recorded live at Cakeshop."
}'::jsonb);

INSERT INTO entries (id, page_id, type, position, slug, data) VALUES
('d0000002-0000-0000-0000-000000000002', '28199ca5-6d86-4b88-a772-fd58323fee5e', 'mixset', 1, 'sunrise-set-faust', '{
    "title": "Sunrise Set @ Faust",
    "url": "https://youtu.be/PDo7puFhz9g",
    "image_urls": [],
    "tracklist": [],
    "description": "6AM closing set. House and minimal."
}'::jsonb);

-- ── 5. Link entries ──

INSERT INTO entries (id, page_id, type, position, data) VALUES
('d0000003-0000-0000-0000-000000000001', '28199ca5-6d86-4b88-a772-fd58323fee5e', 'link', 0, '{
    "title": "SoundCloud",
    "url": "https://soundcloud.com/demo",
    "icon": "SiSoundcloud",
    "image_urls": [],
    "description": ""
}'::jsonb);

INSERT INTO entries (id, page_id, type, position, data) VALUES
('d0000003-0000-0000-0000-000000000002', '28199ca5-6d86-4b88-a772-fd58323fee5e', 'link', 1, '{
    "title": "Instagram",
    "url": "https://instagram.com/demo",
    "icon": "SiInstagram",
    "image_urls": [],
    "description": ""
}'::jsonb);

-- ── 6. Custom entry ──

INSERT INTO entries (id, page_id, type, position, slug, data) VALUES
('d0000004-0000-0000-0000-000000000001', '28199ca5-6d86-4b88-a772-fd58323fee5e', 'custom', 0, 'about-me', '{
    "title": "About Me",
    "blocks": [
        {
            "id": "b0000001-0000-0000-0000-000000000001",
            "type": "header",
            "data": {"title": "Who I Am", "subtitle": "Seoul-based DJ since 2019"}
        },
        {
            "id": "b0000001-0000-0000-0000-000000000002",
            "type": "richtext",
            "data": {"content": "Started digging crates in Itaewon. Now playing regularly at Cakeshop, Faust, and Pistil. Focused on house, broken beats, and anything with soul."}
        },
        {
            "id": "b0000001-0000-0000-0000-000000000003",
            "type": "embed",
            "data": {"url": "https://youtu.be/zOCQhwavzYA"}
        }
    ]
}'::jsonb);

COMMIT;
