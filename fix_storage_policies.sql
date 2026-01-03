-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies for this specific bucket to avoid conflicts/diplications
-- Note: We use specific names to avoid touching other policies
DROP POLICY IF EXISTS "Public Access Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Site Assets" ON storage.objects;

-- 3. Create the policies
-- Public Read Access
CREATE POLICY "Public Access Site Assets"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'site-assets' );

-- Authenticated Upload Access
CREATE POLICY "Auth Upload Site Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'site-assets' );

-- Authenticated Update Access
CREATE POLICY "Auth Update Site Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'site-assets' );

-- Authenticated Delete Access
CREATE POLICY "Auth Delete Site Assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'site-assets' );
