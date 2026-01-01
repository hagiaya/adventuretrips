import React from 'react';
import { Phone, Mail, MapPin, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const paymentPartners = [
        { name: "BCA", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
        { name: "Mandiri", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" },
        { name: "BNI", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Logo_BNI_46.png/800px-Logo_BNI_46.png" },
        { name: "BRI", logo: "https://upload.wikimedia.org/wikipedia/commons/6/68/BANK_BRI_logo.svg" },
        { name: "BSI", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg" },
        { name: "QRIS", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" },
        { name: "GoPay", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" },
        { name: "OVO", logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg" },
        { name: "DANA", logo: "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg" },
        { name: "ShopeePay", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg" },
        { name: "LinkAja", logo: "https://upload.wikimedia.org/wikipedia/commons/8/85/LinkAja.svg" },
        { name: "Visa", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
        { name: "Mastercard", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
        { name: "Indomaret", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Logo_Indomaret.png" },
        { name: "Alfamart", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Alfamart_logo.svg" }
    ];

    return (
        <footer className="bg-gray-900 text-gray-300 pt-16 pb-0 font-sans">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
                {/* Address Column */}
                <div className="md:col-span-5 space-y-6">
                    <h2 className="text-2xl font-bold text-white">Adventure Trip Indonesia</h2>
                    <p className="text-sm leading-relaxed text-gray-400 mt-4">
                        Temukan selera petualangmu di Adventure Trip Indonesia! Follow Instagram, TikTok dan Download Aplikasi @adventuretrip.id untuk para adventure agar setiap hari penuh eksplorasi “Let’s Go Trip Adventure!”
                    </p>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-white">Follow us on</h3>
                        <div className="flex gap-4">
                            <a
                                href="https://www.instagram.com/adventuretrip.id"
                                target="_blank"
                                rel="noreferrer"
                                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors text-white"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="https://www.tiktok.com/@adventuretrip.id"
                                target="_blank"
                                rel="noreferrer"
                                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-black hover:border hover:border-white transition-colors text-white"
                            >
                                {/* Simple TikTok Icon SVG */}
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                </svg>
                            </a>
                            <a
                                href="https://youtube.com/@adventuretripid"
                                target="_blank"
                                rel="noreferrer"
                                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-white"
                            >
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Links Column */}
                <div className="md:col-span-3">
                    <h3 className="text-white font-bold text-lg mb-6">Lainnya</h3>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li><a href="#" className="hover:text-primary transition-colors">Open Trip</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Private Trip</a></li>
                        <li><Link to="/terms-conditions" className="hover:text-primary transition-colors">Syarat dan Ketentuan</Link></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</a></li>
                    </ul>
                </div>

                {/* Payment Partners */}
                <div className="md:col-span-4">
                    <h3 className="text-white font-bold text-lg mb-6">Partner Pembayaran</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {paymentPartners.map((partner, i) => (
                            <div key={i} className="bg-white rounded p-2 h-12 w-full flex items-center justify-center shadow-sm overflow-hidden hover:scale-105 transition-transform">
                                <img
                                    src={partner.logo}
                                    alt={partner.name}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="bg-primary py-4 text-center">
                <p className="text-white text-sm font-medium">© 2025 Adventure Trip Indonesia. All rights reserved.</p>
            </div>



            {/* Floating WhatsApp */}
            <a href="https://wa.me/6281818433490" target="_blank" className="fixed z-40 bottom-6 right-6 flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-green-500/30">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-green-500 font-bold text-xs">WA</span>
                </div>
                <span className="font-bold">Chat CS</span>
            </a>

        </footer>
    );
};

export default Footer;
