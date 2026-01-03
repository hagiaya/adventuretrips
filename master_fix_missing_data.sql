
-- REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- 1. FIX WITHDRAWALS TABLE (Ensure it exists and is accessible)
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Point to profiles for better join support
    amount NUMERIC NOT NULL CHECK (amount > 0),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Re-apply Withdrawal Policies
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

-- 2. FIX TRANSACTIONS RLS (Ensure data isn't hidden)
-- Ensure 'profiles' table has RLS enabled but readable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Allow admins to view all profiles (Needed for joining)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin' OR role = 'sales'))
);

-- Ensure Transactions are readable by Admins
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin' OR role = 'sales'))
);

-- Ensure Transactions are readable by Users (Own Data)
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

-- 3. FIX TRIP REQUESTS (Just in case)
CREATE TABLE IF NOT EXISTS public.trip_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE,
    duration INTEGER,
    pax INTEGER,
    budget_min NUMERIC,
    budget_max NUMERIC,
    special_requests TEXT,
    status TEXT DEFAULT 'pending',
    pickup_point TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

-- Force refresh again
NOTIFY pgrst, 'reload schema';
