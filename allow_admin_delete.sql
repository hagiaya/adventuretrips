-- Allow Admins to Delete All Transactions
-- Run this in Supabase SQL Editor to fix "Conflict" errors during reset

-- 1. Ensure RLS is enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for Admins to Delete
CREATE POLICY "Admins can delete any transaction"
ON transactions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. Also allow Admins to Update (if needed)
CREATE POLICY "Admins can update any transaction"
ON transactions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
