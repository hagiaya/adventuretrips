-- COMPREHENSIVE FIX FOR PAYMENT PROOF FLOW

BEGIN;

-- 1. Ensure 'receipts' bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for 'receipts' bucket

-- 2.1 Allow Public Read (so Admin can see it)
DROP POLICY IF EXISTS "Public Read Receipts" ON storage.objects;
CREATE POLICY "Public Read Receipts"
ON storage.objects FOR SELECT
USING ( bucket_id = 'receipts' );

-- 2.2 Allow Authenticated Users to Upload
DROP POLICY IF EXISTS "Auth Upload Receipts" ON storage.objects;
CREATE POLICY "Auth Upload Receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'receipts' );

-- 2.3 Allow Users to Update/Delete their own files (Optional but good)
DROP POLICY IF EXISTS "Auth Manage Receipts" ON storage.objects;
CREATE POLICY "Auth Manage Receipts"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'receipts' AND auth.uid() = owner );


-- 3. Ensure 'transactions' table allows Updates by User (RLS)
-- (Re-applying this explicitly to be safe)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;

CREATE POLICY "Users can update own transactions"
ON public.transactions FOR UPDATE
USING (auth.uid() = user_id);

COMMIT;
