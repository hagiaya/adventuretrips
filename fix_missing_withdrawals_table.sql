
-- 1. Create withdrawals table (if not exists)
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- 3. Policies for withdrawals
DROP POLICY IF EXISTS "Users can create their own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can see their own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON public.withdrawals;

CREATE POLICY "Users can create their own withdrawals" 
ON public.withdrawals FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see their own withdrawals" 
ON public.withdrawals FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all withdrawals" 
ON public.withdrawals FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin' OR role = 'sales'))
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS withdrawals_user_id_idx ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS withdrawals_status_idx ON public.withdrawals(status);
