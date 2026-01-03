-- Create withdrawals table
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

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies
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
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'sales'))
);

-- Index for performance
CREATE INDEX IF NOT EXISTS withdrawals_user_id_idx ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS withdrawals_status_idx ON public.withdrawals(status);

NOTIFY pgrst, 'reload schema';
