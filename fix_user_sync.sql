-- 1. Sync any missing users from auth.users to public.users
-- This fixes the foreign key violation error by ensuring the ID exists in public.users
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'User'), 
    'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure the trigger exists to automatically sync future users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger to be sure
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. (Optional) Temporarily drop and re-add constraint if it's pointing to the wrong table
-- But simpler approach is satisfying the existing constraint as done in step 1.
