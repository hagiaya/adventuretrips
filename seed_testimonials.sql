-- Seed real testimonials data
INSERT INTO site_content (key, title, content)
VALUES (
    'testimonials',
    'Testimoni Pelanggan',
    '[
        {
            "name": "Andini Putri",
            "role": "Travel Photographer",
            "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
            "text": "Pengalaman Sailing Komodo bareng Adventure Trip bener-bener luar biasa. Pelayanannya premium, guidenya informatif, dan dokumentasinya juara banget!",
            "rating": 5
        },
        {
            "name": "Rizky Ramadhan",
            "role": "Entrepreneur",
            "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
            "text": "Sering sewa mobil buat kebutuhan bisnis di Bali lewat sini. Mobilnya selalu unit terbaru, bersih, dan driver-nya sangat profesional serta tepat waktu.",
            "rating": 5
        },
        {
            "name": "Maya Kartika",
            "role": "Content Creator",
            "image": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
            "text": "Dapet harga promo staycation di Villa daerah Seminyak lewat platform ini. Prosesnya gampang banget, gak pake ribet dan CS-nya sangat membantu.",
            "rating": 5
        },
        {
            "name": "Bambang Kusuma",
            "role": "Family Traveler",
            "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
            "text": "Liburan keluarga ke Bromo jadi sangat berkesan. Jip-nya tepat waktu dan drivernya sangat sabar nungguin anak-anak pas lagi foto-foto.",
            "rating": 4
        },
        {
            "name": "Jessica Tan",
            "role": "Solo Adventurer",
            "image": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
            "text": "Ikut open trip sendirian tapi berasa punya keluarga baru. Itinerary-nya tertata rapi dan kita dibawa ke spot-spot tersembunyi yang jarang orang tahu.",
            "rating": 5
        },
        {
            "name": "Ahmad Fauzi",
            "role": "Hiking Enthusiast",
            "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
            "text": "Pendakian Rinjani jadi lebih aman dan nyaman. Carrier dan logistik yang disiapin tim sangat lengkap. Sangat recommended buat yang cari tim profesional.",
            "rating": 5
        }
    ]'
)
ON CONFLICT (key) 
DO UPDATE SET 
    content = EXCLUDED.content,
    updated_at = NOW();
