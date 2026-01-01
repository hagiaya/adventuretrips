# Rencana Implementasi Admin Panel dengan Supabase

## 1. Persiapan Database (Supabase)
Anda perlu membuat project baru di [Supabase](https://supabase.com) dan menjalankan perintah SQL berikut di **SQL Editor** untuk membuat tabel yang diperlukan.

### Schema Database

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tabel Profiles (untuk Admin/User)
create table profiles (
  id uuid references auth.users not null,
  email text,
  role text default 'user', -- 'admin' or 'user'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 2. Tabel Products (Trips)
create table products (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  location text,
  price text, -- Bisa diubah ke numeric/integer nanti jika perlu kalkulasi
  description text,
  image_url text, -- Main Image
  gallery jsonb default '[]', -- Array of image URLs
  category text,
  itinerary jsonb default '[]', -- Array of {day, activity}
  includes jsonb default '[]', -- Array of strings
  rating numeric default 0,
  reviews_count integer default 0,
  is_popular boolean default false,
  is_recommended boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabel News (Blog)
create table news (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text,
  image_url text,
  author text,
  date date default CURRENT_DATE,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabel Banners (Hero/Promos)
create table banners (
  id uuid default uuid_generate_v4() primary key,
  title text,
  image_url text not null,
  section text, -- 'hero', 'promo', 'community'
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabel Transactions (Simulasi)
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_name text,
  user_contact text,
  product_id uuid references products(id),
  product_name text,
  total_amount text,
  status text default 'pending', -- 'pending', 'confirmed', 'completed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
-- (Simplifikasi: Allow Public Read, Auth Write untuk Admin)
alter table products enable row level security;
alter table news enable row level security;
alter table banners enable row level security;
alter table transactions enable row level security;

-- Policies (Contoh sederhana, bisa diperketat nanti)
create policy "Public Read Products" on products for select using (true);
create policy "Admin Insert Products" on products for insert with check (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admin Update Products" on products for update using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admin Delete Products" on products for delete using (auth.uid() in (select id from profiles where role = 'admin'));

-- Ulangi policy serupa untuk news, banners.
```

## 2. Struktur Folder Admin di React
Kita akan membuat struktur route baru:
- `/admin` (Login)
- `/admin/dashboard`
- `/admin/products`
- `/admin/news`
- `/admin/transactions`

## 3. Langkah Selanjutnya
1. Buat project Supabase.
2. Copy `Project URL` dan `anon key` ke file `.env`.
3. Jalankan SQL di atas.
4. Buat user admin pertama via Supabase Auth (Sign Up), lalu manual update tabel `profiles` set `role = 'admin'` di Table Editor.
