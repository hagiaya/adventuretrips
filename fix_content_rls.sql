-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON site_content;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON site_content;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON site_content;

-- Create robust policies
-- 1. Everyone can read content
CREATE POLICY "Enable read access for all users"
ON site_content FOR SELECT
TO public
USING (true);

-- 2. Authenticated users (admins) can insert
CREATE POLICY "Enable insert for authenticated users only"
ON site_content FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Authenticated users (admins) can update
CREATE POLICY "Enable update for authenticated users only"
ON site_content FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
