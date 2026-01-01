import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const SpecialOffers = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const { data, error } = await supabase
                    .from('banners')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (error) throw error;

                // If DB is empty, use empty array (don't force fallback if user deleted them intentionally)
                // BUT if user wants "defaults" until they upload, we can keep them.
                // Given the request "pastikan bisa dirubah", showing NOTHING when DB is empty is the best proof it works.
                // However, for "Premium" feel, maybe placeholders? 
                // Let's decide to show placeholders ONLY if strictly needed, but better to rely on DB.
                // For now, I will use the mockup fallback ONLY if fetch fails or length is 0, 
                // but usually better to let user control it. 
                // I will Comment out the hardcoded fallback to respect "Admin Control". 
                // If Admin deletes all, it should be empty.
                setBanners(data || []);
            } catch (error) {
                console.error('Error fetching banners:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    if (loading) {
        return (
            <section className="py-8 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="aspect-[16/9] bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (banners.length === 0) return null;

    return (
        <section className="py-8 bg-white" id="special-offers">
            <div className="container mx-auto px-4">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Penawaran Khusus Untukmu</h2>
                    <p className="text-gray-500">Nikmati promo menarik biar liburan makin hemat</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {banners.map((banner) => (
                        <div key={banner.id} className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-[16/9] group relative cursor-pointer">
                            <img
                                src={banner.image_url}
                                alt={banner.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-semibold text-sm line-clamp-2">{banner.title}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SpecialOffers;
