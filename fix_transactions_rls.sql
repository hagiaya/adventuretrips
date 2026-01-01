-- Enable RLS on transactions table if not already enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to insert their own transactions
CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to view their own transactions
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy to allow admins (service_role) to do everything
-- Note: Service role bypasses RLS, but explicit policies for other roles/conditions might be needed depending on setup.
-- Ideally, admins might be identified by a role claim or a separate admins table, but for now we ensure basic user access works.
