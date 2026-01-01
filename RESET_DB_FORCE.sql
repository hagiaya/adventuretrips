-- NUCLEAR OPTION: FORCE RESET DATABASE
-- Run this in Supabase SQL Editor to correctly wipe all data.
-- This command bypasses all permissions and conflicts by cascading drops.

TRUNCATE TABLE 
    transactions, 
    products, 
    news, 
    users -- Optional: Clear users too if you want really fresh start
RESTART IDENTITY CASCADE;

-- If 'users' table is not what you use for profiles, check if it is 'profiles'.
-- Based on previous files, 'users' seems to be the main table, but 'profiles' was referenced in SystemSettings. 
-- Just in case, try to truncate profiles if it exists too.

-- Attempt to truncate profiles if it exists (ignore error if not)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        TRUNCATE TABLE profiles RESTART IDENTITY CASCADE;
    END IF;
END $$;
