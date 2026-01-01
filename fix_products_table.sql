-- Add missing columns to products table if they don't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 1) DEFAULT 4.5;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price TEXT;

-- Verify views_count exists too
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
