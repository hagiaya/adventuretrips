# Supabase Storage Setup

The application requires a storage bucket named `receipts` to store manual transfer proof images.

## Option 1: Create via Dashboard
1. Go to your Supabase Dashboard.
2. Navigate to **Storage** from the sidebar.
3. Click **New Bucket**.
4. Name the bucket: `receipts`.
5. Toggle **Public bucket** to `ON`.
6. Click **Save**.

## Option 2: Run SQL Query
Run the following SQL in your Supabase SQL Editor:

```sql
-- Create the 'receipts' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access (so admins can view receipts)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'receipts' );

-- Allow authenticated users to upload receipts
CREATE POLICY "User Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'receipts' AND auth.role() = 'authenticated' );
```
