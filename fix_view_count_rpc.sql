-- Recreate the function with SECURITY DEFINER to allow anonymous updates
CREATE OR REPLACE FUNCTION increment_product_view(p_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to public (anon and authenticated)
GRANT EXECUTE ON FUNCTION increment_product_view(BIGINT) TO anon, authenticated, service_role;
