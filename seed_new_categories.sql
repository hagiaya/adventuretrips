
-- Insert Accommodation (Hotels/Villas)
INSERT INTO products (title, description, price, location, rating, reviews_count, views_count, image_url, features)
VALUES
(
    'Grand Zuri Hotel Padang - Deluxe Room',
    'Penginapan nyaman bintang 4 di jantung kota Padang. Dekat dengan pusat kuliner dan wisata. Fasilitas lengkap: Kolam Renang, Gym, Sarapan Buffet.',
    'Rp 850.000',
    'Padang, Sumatera Barat',
    4.7,
    340,
    5600,
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    '{
        "category": "Accommodation",
        "type": "Hotel",
        "facilities": ["Wifi", "Pool", "Breakfast", "AC", "Parking"],
        "itinerary": [], 
        "schedules": [
             {"date": "24 Des 2025", "price": 850000, "quota": 5, "booked": 0},
             {"date": "25 Des 2025", "price": 950000, "quota": 5, "booked": 1},
             {"date": "26 Des 2025", "price": 850000, "quota": 5, "booked": 0},
             {"date": "31 Des 2025", "price": 1200000, "quota": 10, "booked": 2}
        ]
    }'
),
(
    'Villa Puncak Pesona - 3 Bedroom',
    'Villa privat dengan pemandangan kebun teh yang asri. Cocok untuk keluarga besar. Kapasitas hingga 10 orang. Dapur lengkap & BBQ Area.',
    'Rp 2.500.000',
    'Puncak, Bogor',
    4.9,
    120,
    3200,
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    '{
         "category": "Accommodation",
         "type": "Villa",
         "facilities": ["3 Bedroom", "Kitchen", "BBQ", "Wifi", "Mountain View"],
         "itinerary": [],
         "schedules": [
             {"date": "Sabtu, 27 Des 2025", "price": 2500000, "quota": 1, "booked": 0},
             {"date": "Minggu, 28 Des 2025", "price": 2500000, "quota": 1, "booked": 0}
        ]
    }'
);

-- Insert Transportation
INSERT INTO products (title, description, price, location, rating, reviews_count, views_count, image_url, features)
VALUES
(
    'Sewa Innova Reborn + Driver (12 Jam)',
    'Layanan sewa mobil Innova Reborn termasuk supir berpengalaman dan BBM. Area pemakaian dalam kota Padang & Bukittinggi. Nyaman & Bersih.',
    'Rp 750.000',
    'Padang, Sumatera Barat',
    4.8,
    560,
    8900,
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    '{
        "category": "Transportation",
        "vehicle_type": "Car (MPV)",
        "specs": ["Innova Reborn", "7 Seaters", "AC Double Blower"],
        "includes": ["Mobil", "Supir", "BBM (Dalam Kota)"],
        "itinerary": [], 
        "schedules": [
             {"date": "Ready Everyday", "price": 750000, "quota": 10, "booked": 2}
        ]
    }'
),
(
    'Luxury Bus Pariwisata (30 Seat)',
    'Bus pariwisata eksekutif untuk rombongan. Fasilitas Karaoke, Wifi, TV, Reclining Seat. Cocok untuk tour perusahaan atau sekolah.',
    'Rp 3.500.000',
    'Jakarta, Indonesia',
    4.6,
    85,
    1500,
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    '{
        "category": "Transportation",
        "vehicle_type": "Bus",
        "specs": ["30 Seats", "Karaoke", "Toilet"],
        "includes": ["Bus", "Driver", "Co-Driver"],
        "itinerary": [],
        "schedules": [
             {"date": "Booking by Request", "price": 3500000, "quota": 5, "booked": 0}
        ]
    }'
);
