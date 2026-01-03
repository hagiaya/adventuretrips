
-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

-- 2. Policy to allow Admins to UPDATE transactions
CREATE POLICY "Admins can update transactions"
ON public.transactions
FOR UPDATE
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'superadmin')
  )
);

-- 3. Policy to allow Admins to DELETE transactions
CREATE POLICY "Admins can delete transactions"
ON public.transactions
FOR DELETE
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'superadmin')
  )
);

-- 4. Policy to allow Admins to SELECT (View) ALL transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'superadmin')
  )
);
