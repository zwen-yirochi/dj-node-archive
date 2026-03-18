-- Step 1: nullable로 추가
ALTER TABLE entries ADD COLUMN slug TEXT;

-- Step 2: unique 제약 (page_id 범위 내)
ALTER TABLE entries ADD CONSTRAINT entries_page_id_slug_unique UNIQUE (page_id, slug);
