-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS organizer TEXT DEFAULT 'Pandooin',
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

-- Optional: If you want to add organizer to accommodation_categories as well for consistency
ALTER TABLE accommodation_categories
ADD COLUMN IF NOT EXISTS organizer TEXT DEFAULT 'Pandooin';

-- Ensure schedules and views_count are also present if not already
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS schedules JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
