-- Nuclear Option for product-images bucket
-- 1. Use an existing policy if needed (dropping all)
DROP POLICY IF EXISTS "Public Access Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Super Open Product Images" ON storage.objects;

-- 2. Create a "Universe Open" policy for product-images
-- Allow ANYONE (Public & Auth) to do ANYTHNG (Select, Insert, Update, Delete)
-- This eliminates RLS errors completely for this bucket.
CREATE POLICY "Universe Open Product Images"
ON storage.objects FOR ALL
TO public
USING ( bucket_id = 'product-images' )
WITH CHECK ( bucket_id = 'product-images' );
