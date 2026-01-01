-- Fix increment_product_view to accept UUID instead of BIGINT
-- The error 400 occurs because the product ID passed is a UUID (e.g., 323309be...), but the function expects BIGINT.

-- 1. Drop the old function (important because changing argument type changes signature)
DROP FUNCTION IF EXISTS increment_product_view(BIGINT);
DROP FUNCTION IF EXISTS increment_product_view(UUID);

-- 2. Create the correct function accepting UUID
CREATE OR REPLACE FUNCTION increment_product_view(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION increment_product_view(UUID) TO anon, authenticated, service_role;
