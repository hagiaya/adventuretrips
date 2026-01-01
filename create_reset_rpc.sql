-- Function to completely wipe system data (admin only)
-- Can be called via supabase.rpc('wipe_system_data')
CREATE OR REPLACE FUNCTION wipe_system_data()
RETURNS void AS $$
BEGIN
  -- 1. Delete transactions (Child table)
  DELETE FROM transactions;
  
  -- 2. Delete products (Parent table)
  DELETE FROM products;
  
  -- 3. Delete news/banners
  DELETE FROM news;
  
  -- 4. Delete storage objects? (Optional, requires more complex logic)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
