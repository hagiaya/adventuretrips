-- 1. Add 'gallery' column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';

-- 2. Create 'product-images' bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS on storage.objects (Skipped to avoid permission errors, usually enabled by default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for 'product-images' bucket

-- Allow Public Read
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
CREATE POLICY "Public Read Product Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Allow Authenticated Upload
DROP POLICY IF EXISTS "Authenticated Upload Product Images" ON storage.objects;
CREATE POLICY "Authenticated Upload Product Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- Allow Authenticated Update
DROP POLICY IF EXISTS "Authenticated Update Product Images" ON storage.objects;
CREATE POLICY "Authenticated Update Product Images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-images' );

-- Allow Authenticated Delete
DROP POLICY IF EXISTS "Authenticated Delete Product Images" ON storage.objects;
CREATE POLICY "Authenticated Delete Product Images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'product-images' );
