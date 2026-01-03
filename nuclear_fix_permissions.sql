-- 1. DISABLE Row Level Security on the table
-- This removes all restriction checks, allowing any operation (Insert/Update)
ALTER TABLE site_content DISABLE ROW LEVEL SECURITY;

-- 2. (Optional) Re-grant permissions just in case
GRANT ALL ON site_content TO postgres;
GRANT ALL ON site_content TO anon;
GRANT ALL ON site_content TO authenticated;
GRANT ALL ON site_content TO service_role;

-- 3. Ensure Storage is also open (Nuclear option for storage)
DROP POLICY IF EXISTS "Public Access Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Site Assets" ON storage.objects;

-- Allow EVERYONE (Public+Auth) to do EVERYTHING on site-assets bucket
CREATE POLICY "Super Open Site Assets"
ON storage.objects FOR ALL
TO public
USING ( bucket_id = 'site-assets' )
WITH CHECK ( bucket_id = 'site-assets' );
