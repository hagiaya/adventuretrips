import React, { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';

const PromoPopup = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Show popup automatically after 1.5 seconds
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    if (!isOpen) return null;

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
                        🏝️ Bingung Cara Rencanain Liburanmu?
                    </h3>

                    <p className="text-gray-600 mb-4 text-sm md:text-base leading-relaxed">
                        Tenang, kita bantuin! Cukup kasih tau mau ke mana, sukanya apa, dan budget-nya berapa—konsultan travel kita bakal buatin rencana liburan yang pas banget buat kamu. Kamu bakal dapet itinerary custom yang isinya:
                    </p>

                    <ul className="space-y-2 mb-4 text-sm md:text-base text-gray-700">
                        <li className="flex items-start gap-2">
                            <span>🛫</span>
                            <span>Rekomendasi tiket, hotel, dan tempat seru</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span>⏰</span>
                            <span>Jadwal harian yang enak diikutin</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span>💸</span>
                            <span>Perkiraan harga + link buat booking</span>
                        </li>
                    </ul>

                    <p className="text-gray-600 mb-6 text-sm md:text-base leading-relaxed">
                        Semuanya dirangkum dalam satu travel brief lengkap yang gampang dibaca. <span className="font-bold text-gray-900">Mulai dari cuma Rp25.000 aja!</span>
                    </p>

                    <a
                        href="https://wa.me/6281818433490?text=Halo%20Admin,%20saya%20tertarik%20dengan%20jasa%20rencana%20liburan%20(Itinerary%20Custom)%20mulai%2025rb!"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center w-full bg-[#0F6FCD] hover:bg-[#0d62b5] text-white font-bold py-3 px-6 rounded-full hover:shadow-lg transition-all duration-300"
                    >
                        Chat Kami Sekarang!
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PromoPopup;
