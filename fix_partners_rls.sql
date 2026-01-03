-- 1. Create table if likely missing (idempotent)
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    category TEXT DEFAULT 'Akomodasi', -- Akomodasi, Transportasi, Customer
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Force Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies to clean conflicts on PARTNERS table
DROP POLICY IF EXISTS "Public Read Partners" ON partners;
DROP POLICY IF EXISTS "Admin All Partners" ON partners;

-- 4. Create correct policies for PARTNERS
-- Public Read
CREATE POLICY "Public Read Partners"
ON partners FOR SELECT
TO public
USING (true);

-- Authenticated (Admin) ALL Permissions
CREATE POLICY "Admin All Partners"
ON partners FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
