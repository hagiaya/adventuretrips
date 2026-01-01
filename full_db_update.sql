-- 1. Create accommodation_categories table if not exists
CREATE TABLE IF NOT EXISTS accommodation_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    gallery TEXT[] DEFAULT '{}',
    organizer TEXT DEFAULT 'Pandooin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS organizer TEXT DEFAULT 'Pandooin',
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS schedules JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 3. Create or Update RPC function for incrementing views
CREATE OR REPLACE FUNCTION increment_product_view(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Note: if your products table uses BIGINT for 'id' instead of UUID, 
-- please use: CREATE OR REPLACE FUNCTION increment_product_view(p_id BIGINT)
