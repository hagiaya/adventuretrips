-- Fix relation between withdrawals and profiles to enable join queries
-- We change the foreign key to reference public.profiles instead of auth.users
-- This allows PostgREST to detect the relationship for .select('*, profiles(*)')

DO $$ 
BEGIN
    -- Try to drop the existing FK if it exists (generic name assumption or we alter column)
    -- Finding constraints can be hard, so we just alter the column's reference if possible or add a specific one.
    
    -- First, let's try to remove the constraint if we can guess the name, 
    -- usually postgres names it table_column_fkey.
    -- withdrawals_user_id_fkey
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'withdrawals_user_id_fkey') THEN
        ALTER TABLE public.withdrawals DROP CONSTRAINT withdrawals_user_id_fkey;
    END IF;

    -- If the table was created with "REFERENCES auth.users", likely the constraint name is auto generated or we need to recreate.
    -- Let's just add the correct constraint. Postgres allows multiple FKs on a column technically, but better to be clean.
    -- However, for the purpose of the API working, adding a specific reference to profiles looks like this:

    ALTER TABLE public.withdrawals
    ADD CONSTRAINT withdrawals_profiles_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN RAISE NOTICE 'Error altering table: %', SQLERRM;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
