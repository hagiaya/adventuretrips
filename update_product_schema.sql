-- Add 'schedules' column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS schedules JSONB DEFAULT '[]';

-- Add 'views_count' column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Optional: Populate with some dummy data for existing products
UPDATE products 
SET schedules = '[
    {"date": "20 Des - 22 Des 2025", "price": "2500000", "quota": 20, "booked": 5},
    {"date": "27 Des - 29 Des 2025", "price": "2750000", "quota": 20, "booked": 0},
    {"date": "03 Jan - 05 Jan 2026", "price": "2500000", "quota": 20, "booked": 0}
]'::jsonb,
views_count = floor(random() * 100 + 1)::int
WHERE schedules IS NULL OR schedules = '[]'::jsonb;

-- Create RPC function to increment views safely
-- Can be called via supabase.rpc('increment_product_view', { p_id: 123 })
CREATE OR REPLACE FUNCTION increment_product_view(p_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
