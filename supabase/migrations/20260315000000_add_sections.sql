-- sections 컬럼 추가
ALTER TABLE pages ADD COLUMN sections jsonb DEFAULT '[]'::jsonb;

-- 기존 display_order 데이터를 sections로 변환
UPDATE pages p
SET sections = (
  SELECT jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid(),
      'viewType', 'list',
      'title', null,
      'entryIds', coalesce(jsonb_agg(e.id ORDER BY e.display_order NULLS LAST), '[]'::jsonb),
      'isVisible', true,
      'options', '{}'::jsonb
    )
  )
  FROM entries e
  WHERE e.page_id = p.id
    AND e.display_order IS NOT NULL
)
WHERE EXISTS (
  SELECT 1 FROM entries e
  WHERE e.page_id = p.id AND e.display_order IS NOT NULL
);

-- display_order 컬럼 제거
ALTER TABLE entries DROP COLUMN display_order;

-- is_visible 컬럼 제거
ALTER TABLE entries DROP COLUMN is_visible;
