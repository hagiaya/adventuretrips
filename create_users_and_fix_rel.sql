-- 1. Create public.users table if it doesn't exist
create table if not exists public.users (
  id uuid not null primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user',
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.users enable row level security;

-- 3. Create policies (basic read for everyone, update for own)
create policy "Public profiles are viewable by everyone."
  on users for select
  using ( true );

create policy "Users can insert their own profile."
  on users for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on users for update
  using ( auth.uid() = id );

-- 4. Sync function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role, avatar_url)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', 'User'), 
    'user',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name;
  return new;
end;
$$;

-- 5. Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Manually sync existing users
insert into public.users (id, email, full_name, role)
select 
    id, 
    email, 
    coalesce(raw_user_meta_data->>'full_name', 'User'), 
    'user'
from auth.users
on conflict (id) do nothing;

-- 7. Fix Transactions Foreign Key (If needed)
-- Drop the constraint if it exists and recreate it pointing to public.users
do $$
begin
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'transactions_user_id_fkey') then
    alter table transactions drop constraint transactions_user_id_fkey;
  end if;
end $$;

-- Ensure transaction user_id refers to public.users
alter table transactions 
add constraint transactions_user_id_fkey 
foreign key (user_id) 
references public.users(id) 
on delete cascade;
