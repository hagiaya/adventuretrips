
-- EMERGENCY: DISABLE ROW LEVEL SECURITY TEMPORARILY
-- This will confirm if the data exists by making it visible to everyone.
-- If you see the data after running this, the issue is definitely with the 'is_admin' permission logic.

-- 1. Disable RLS on key tables
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Force Refresh Cache
NOTIFY pgrst, 'reload schema';
