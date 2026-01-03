-- Create a new storage bucket for site assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public to view (SELECT) files in 'site-assets'
-- unique name to avoid conflicts
CREATE POLICY "Public Access Site Assets"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'site-assets' );

-- Policy: Allow authenticated users to upload (INSERT) files to 'site-assets'
CREATE POLICY "Auth Upload Site Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'site-assets' );

-- Policy: Allow authenticated users to update (UPDATE) files in 'site-assets'
CREATE POLICY "Auth Update Site Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'site-assets' );

-- Policy: Allow authenticated users to delete (DELETE) files in 'site-assets'
CREATE POLICY "Auth Delete Site Assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'site-assets' );
