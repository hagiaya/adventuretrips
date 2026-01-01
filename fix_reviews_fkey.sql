-- Fix reviews table foreign key to point to public.users instead of public.profiles
-- This aligns with the move to using public.users as the profile table

-- 1. Sync any missing users from auth.users to public.users first
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'User'), 
    'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Drop the old constraint
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- 3. Add the new constraint referencing public.users
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.users(id)
ON DELETE CASCADE;

-- 4. Verify RLS policies on reviews (just in case they relied on profile)
-- "Authenticated users can insert reviews" should still work as it uses auth.role()
-- But let's make sure the update/delete policies (if any) are correct.
-- Currently only insert and select are enabled in the schema we saw.

-- Optional: ensure users can delete their own reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);
