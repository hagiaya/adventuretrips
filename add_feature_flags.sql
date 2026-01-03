-- ADD POPULAR AND RECOMMENDED COLUMNS
-- Adds flags to products table to allow manual curation of popular and recommended items.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;

-- Optional: Update some existing rows to have default values (false is default, so mainly just ensuring)
UPDATE products SET is_popular = false WHERE is_popular IS NULL;
UPDATE products SET is_recommended = false WHERE is_recommended IS NULL;
