-- 기존 entries에 slug backfill
-- title 기반 slug 생성: lowercase → 특수문자 제거 → 공백→하이픈 → 중복 시 suffix 추가

-- Step 0: slug 컬럼이 없으면 생성 (constraint는 아직 걸지 않음)
ALTER TABLE entries ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 1: 기본 slug 생성 (중복 미처리)
UPDATE entries
SET slug = regexp_replace(
    regexp_replace(
        regexp_replace(
            lower(coalesce(data->>'title', 'untitled')),
            '[^\w\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
)
WHERE slug IS NULL
  AND type != 'link';

-- Step 2: page_id 내 중복 slug에 suffix 추가
WITH duplicates AS (
    SELECT id, page_id, slug,
           row_number() OVER (PARTITION BY page_id, slug ORDER BY position, created_at) AS rn
    FROM entries
    WHERE slug IS NOT NULL AND type != 'link'
)
UPDATE entries e
SET slug = d.slug || '-' || d.rn
FROM duplicates d
WHERE e.id = d.id AND d.rn > 1;

-- Step 3: 중복 해소 후 unique constraint 추가
DO $$ BEGIN
    ALTER TABLE entries ADD CONSTRAINT entries_page_id_slug_unique UNIQUE (page_id, slug);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
