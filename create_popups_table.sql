CREATE TABLE IF NOT EXISTS site_popups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    description TEXT,
    image_url TEXT,
    cta_text TEXT DEFAULT 'Lihat Detail',
    cta_link TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE site_popups ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read active popups" ON site_popups 
    FOR SELECT TO anon, authenticated 
    USING (is_active = true);

CREATE POLICY "Admin full access" ON site_popups 
    FOR ALL TO authenticated 
    USING (true);

-- Insert initial data based on current hardcoded popup
INSERT INTO site_popups (title, description, cta_text, cta_link, is_active)
VALUES (
    '🏝️ Bingung Cara Rencanain Liburanmu?',
    'Tenang, kita bantuin! Cukup kasih tau mau ke mana, sukanya apa, dan budget-nya berapa—konsultan travel kita bakal buatin rencana liburan yang pas banget buat kamu. \n\nKamu bakal dapet itinerary custom yang isinya:\n✈️ Rekomendasi tiket, hotel, dan tempat seru\n⏰ Jadwal harian yang enak diikutin\n💸 Perkiraan harga + link buat booking\n\nSemuanya dirangkum dalam satu travel brief lengkap yang gampang dibaca. Mulai dari cuma Rp25.000 aja!',
    'Chat Kami Sekarang!',
    'https://wa.me/6281818433490?text=Halo%20Admin,%20saya%20tertarik%20dengan%20jasa%20rencana%20liburan%20(Itinerary%20Custom)%20mulai%2025rb!',
    true
);
