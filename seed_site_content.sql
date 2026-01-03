-- Insert default Mobile App Promo content
-- Storing JSON in content field
INSERT INTO site_content (key, title, content)
VALUES (
    'mobile_app_promo',
    'Mobile App Promo',
    '{
        "mainTitle": "Semua Jenis Trip dalam Satu Aplikasi <span class=\"text-primary\">Adventure Trip</span>",
        "description": "Rencanakan perjalanan impianmu lebih mudah langsung dari genggaman.",
        "features": [
            { "icon": "Tag", "title": "Promo eksklusif khusus di aplikasi", "desc": "Nikmati harga lebih murah dan voucher diskon spesial pengguna aplikasi." },
            { "icon": "Shield", "title": "Transaksi aman, cepat, dan terpercaya", "desc": "Sistem pembayaran otomatis yang aman dan terverifikasi." },
            { "icon": "Globe", "title": "Banyak Pilihan Trip Domestik & Internasional", "desc": "Ribuan destinasi wisata siap untuk Anda jelajahi." }
        ],
        "googlePlayUrl": "#",
        "appStoreUrl": "#",
        "phoneImage": "" 
    }'
) ON CONFLICT (key) DO NOTHING;

-- Insert default Site Logo
INSERT INTO site_content (key, title, content)
VALUES (
    'site_logo',
    'Logo Website',
    '/logo.png'
) ON CONFLICT (key) DO NOTHING;

-- Insert default Site Favicon
INSERT INTO site_content (key, title, content)
VALUES (
    'site_favicon',
    'Favicon Website',
    '/vite.svg'
) ON CONFLICT (key) DO NOTHING;
