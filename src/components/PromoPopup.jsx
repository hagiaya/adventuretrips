import React, { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const PromoPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [popupData, setPopupData] = useState(null);

    useEffect(() => {
        const fetchPopup = async () => {
            const { data } = await supabase
                .from('site_popups')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false }) // Get latest active
                .limit(1)
                .single();

            if (data) {
                setPopupData(data);
                // Show popup automatically after 1.5 seconds if data exists
                const timer = setTimeout(() => {
                    setIsOpen(true);
                }, 1500);
                return () => clearTimeout(timer);
            }
        };

        fetchPopup();
    }, []);

    if (!isOpen || !popupData) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all duration-300">
            {/* Modal Container */}
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm md:max-w-md w-full relative overflow-hidden animate-[fadeIn_0.5s_ease-out]">

                {/* Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <X size={24} />
                </button>

                <div className="p-6 md:p-8 text-left">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 font-sans pr-8 leading-snug">
                        {popupData.title}
                    </h3>

                    {/* Handle newlines in description */}
                    <div className="text-gray-600 mb-6 text-sm md:text-base leading-relaxed whitespace-pre-line">
                        {popupData.description}
                    </div>

                    {popupData.cta_link && (
                        <a
                            href={popupData.cta_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center w-full bg-[#0F6FCD] hover:bg-[#0d62b5] text-white font-bold py-3 px-6 rounded-full hover:shadow-lg transition-all duration-300"
                        >
                            {popupData.cta_text || 'Lihat Detail'}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromoPopup;
