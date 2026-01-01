-- SQL Update Script
-- Salin dan jalankan script ini di SQL Editor Supabase Anda

-- 1. Tambahkan kolom yang kurang di tabel profiles (created_at & is_verified)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at timestamp with time zone default timezone('utc'::text, now()) not null;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified boolean default false;
    END IF;
END $$;

-- 2. Update fungsi handle_new_user agar menyimpan data verifikasi
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, is_verified)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'user',
    (new.email_confirmed_at is not null)
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Pastikan tabel reviews ada (jika sebelumnya gagal trbuat)
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id),
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  user_name text, -- cache name
  avatar_url text -- cache avatar
);

-- 4. Setup RLS & Policies untuk Reviews (Drop dulu biar ga error duplicate policy)
alter table public.reviews enable row level security;

drop policy if exists "Reviews are viewable by everyone" on public.reviews;
create policy "Reviews are viewable by everyone" 
on public.reviews for select using (true);

drop policy if exists "Authenticated users can insert reviews" on public.reviews;
create policy "Authenticated users can insert reviews" 
on public.reviews for insert with check (auth.role() = 'authenticated');
