-- Helper SQL to ensure the view count increment function works correctly
-- Run this in your Supabase SQL Editor

-- 1. Drop potentially conflicting function signatures
DROP FUNCTION IF EXISTS increment_product_view(bigint);
DROP FUNCTION IF EXISTS increment_product_view(uuid);

-- 2. Create the function accepting UUID (Standard for this project)
CREATE OR REPLACE FUNCTION increment_product_view(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_id;
END;
$$;

-- 3. Grant execute permissions to everyone (including anonymous users)
GRANT EXECUTE ON FUNCTION increment_product_view(uuid) TO anon, authenticated, service_role;

-- 4. Verify/Add views_count column just in case
ALTER TABLE products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
