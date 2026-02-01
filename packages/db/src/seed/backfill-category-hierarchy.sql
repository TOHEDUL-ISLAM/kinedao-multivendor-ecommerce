-- Backfill depth and path for existing categories
-- Run this script after applying the schema migration

-- First, set depth and path for root categories (no parent)
UPDATE categories
SET
  depth = 0,
  path = '/' || id::text
WHERE parent_id IS NULL;

-- Then, use a recursive CTE to update children
WITH RECURSIVE category_tree AS (
  -- Base case: root categories (already updated above, but included for path building)
  SELECT
    id,
    parent_id,
    0 as depth,
    '/' || id::text as path
  FROM categories
  WHERE parent_id IS NULL

  UNION ALL

  -- Recursive case: children
  SELECT
    c.id,
    c.parent_id,
    ct.depth + 1 as depth,
    ct.path || '/' || c.id::text as path
  FROM categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
)
UPDATE categories c
SET
  depth = ct.depth,
  path = ct.path
FROM category_tree ct
WHERE c.id = ct.id AND c.parent_id IS NOT NULL;

-- Verify the results
SELECT id, name, parent_id, depth, path
FROM categories
ORDER BY depth, sort_order;
