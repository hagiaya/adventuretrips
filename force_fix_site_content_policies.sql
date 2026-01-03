-- 1. Create table if not exists (including 'key' as PK)
CREATE TABLE IF NOT EXISTS site_content (
    key TEXT PRIMARY KEY,
    title TEXT,
    content TEXT, -- JSON compatible
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Force Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies to clean conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON site_content;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON site_content;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON site_content;
DROP POLICY IF EXISTS "Public Read" ON site_content;
DROP POLICY IF EXISTS "Admin All" ON site_content;

-- 4. Create correct policies
-- Public Read
CREATE POLICY "Public Read"
ON site_content FOR SELECT
TO public
USING (true);

-- Authenticated (Admin) ALL Permissions
CREATE POLICY "Admin All"
ON site_content FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
