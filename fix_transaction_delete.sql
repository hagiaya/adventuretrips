-- FIX TRANSACTION DELETION PERMISSIONS
-- File ini memperbaiki izin (RLS) agar admin dapat menghapus transaksi secara permanen

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create/Update DELETE Policy
-- Hapus policy lama jika ada agar tidak duplikat
DROP POLICY IF EXISTS "Allow delete for all authenticated users" ON transactions;
DROP POLICY IF EXISTS "Allow delete for admins" ON transactions;

-- Buat policy baru: Izinkan user yang login (admin) untuk menghapus data
CREATE POLICY "Allow delete for all authenticated users"
ON transactions
FOR DELETE
TO authenticated
USING (true);

-- 3. Cek Foreign Keys (Opsional - memastikan tidak ada constraint yang menahan)
-- Jika ada tabel lain yang mereferensi transactions (misal: review yang terikat transaksi), harus di set ON DELETE CASCADE.
-- Namun berdasarkan kode, sepertinya transaksi adalah entitas utama. 
-- Script ini fokus pada izin (permissions).
