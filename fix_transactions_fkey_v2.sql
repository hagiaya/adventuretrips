-- Fix Transaction Foreign Key Constraint to point to auth.users directly
-- This resolves the "violates foreign key constraint" error when inserting transactions
-- because the user_id comes from auth.getSession() which is definitely in auth.users.

BEGIN;

-- 1. Drop the existing foreign key constraint if it exists
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

-- 2. Add the correct foreign key constraint referencing auth.users
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

COMMIT;

-- 3. Optional: Ensure public.users is synced just in case (as a fallback for other features)
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'User'), 
    'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
