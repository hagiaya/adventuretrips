-- SQL Script untuk mengisi data Slug pada produk yang sudah ada
-- Jalankan script ini di SQL Editor Supabase untuk memperbaiki link share

UPDATE products
SET slug = LOWER(
    TRIM(BOTH '-' FROM 
        REGEXP_REPLACE(
            REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), -- Hapus karakter aneh
            '\s+', '-', 'g' -- Ganti spasi dengan strip
        )
    )
)
WHERE slug IS NULL OR slug = '';
