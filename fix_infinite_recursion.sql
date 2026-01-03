
-- 1. Create a secure function to check admin status (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_role text;
BEGIN
  SELECT role INTO current_role FROM public.profiles WHERE id = auth.uid();
  RETURN current_role IN ('admin', 'superadmin', 'sales');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FIX PROFILES POLICIES (Break the recursion loop)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Allow admins to view ALL profiles (Using the secure function)
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin());

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 3. FIX TRANSACTIONS POLICIES (Use the function)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;

-- Admin View All
CREATE POLICY "Admins can view all transactions" ON public.transactions
FOR SELECT USING (public.is_admin());

-- Admin Update
CREATE POLICY "Admins can update transactions" ON public.transactions
FOR UPDATE USING (public.is_admin());

-- Admin Delete
CREATE POLICY "Admins can delete transactions" ON public.transactions
FOR DELETE USING (public.is_admin());

-- User View Own
CREATE POLICY "Users can view their own transactions" ON public.transactions
FOR SELECT USING (auth.uid() = user_id);

-- User Insert Own
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" ON public.transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 4. FIX WITHDRAWALS POLICIES
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON public.withdrawals;

CREATE POLICY "Admins can manage all withdrawals" 
ON public.withdrawals FOR ALL 
USING (public.is_admin());


-- 5. FIX TRIP REQUESTS POLICIES
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all requests" ON public.trip_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON public.trip_requests;

CREATE POLICY "Admins can view all requests" ON public.trip_requests
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update requests" ON public.trip_requests
FOR UPDATE USING (public.is_admin());

-- Refresh cache
NOTIFY pgrst, 'reload schema';
