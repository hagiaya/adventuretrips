import React from 'react';
import { Smartphone, Shield, Globe, Tag } from 'lucide-react';

const MobileAppPromo = () => {
    return (
        <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-12 opacity-10">
                <Smartphone size={300} />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">

                    {/* Text Content */}
                    <div className="md:w-1/2 space-y-8">
                        <div>
                            <span className="inline-block px-4 py-1 bg-primary/20 text-primary rounded-full text-sm font-bold mb-4 border border-primary/20">
                                Mobile App
                            </span>
                            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                                Semua Jenis Trip dalam Satu Aplikasi <span className="text-primary">Adventure Trip</span>
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Rencanakan perjalanan impianmu lebih mudah langsung dari genggaman.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                    <Tag className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Promo eksklusif khusus di aplikasi</h3>
                                    <p className="text-gray-400 text-sm">Nikmati harga lebih murah dan voucher diskon spesial pengguna aplikasi.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                    <Shield className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Transaksi aman, cepat, dan terpercaya</h3>
                                    <p className="text-gray-400 text-sm">Sistem pembayaran otomatis yang aman dan terverifikasi.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                    <Globe className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Banyak Pilihan Trip Domestik & Internasional</h3>
                                    <p className="text-gray-400 text-sm">Ribuan destinasi wisata siap untuk Anda jelajahi.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4 justify-start">
                            <a href="#" className="hover:opacity-80 transition-opacity w-[160px]">
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                                    alt="Get it on Google Play"
                                    className="w-full h-auto"
                                />
                            </a>
                            <a href="#" className="hover:opacity-80 transition-opacity w-[160px]">
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                                    alt="Download on the App Store"
                                    className="w-full h-auto"
                                />
                            </a>
                        </div>
                    </div>

                    {/* Image Mockup */}
                    <div className="md:w-1/2 flex justify-center md:justify-end relative">
                        <div className="relative z-10 w-[280px] md:w-[320px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden aspect-[9/19]">
                            {/* Screen Content Placeholder */}
                            <div className="absolute inset-0 bg-white">
                                {/* Header */}
                                <div className="bg-primary h-32 rounded-b-[2rem] relative"></div>
                                <div className="px-6 -mt-16 space-y-4">
                                    <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
                                        <div className="bg-gray-100 p-2 rounded-full"><Globe size={16} /></div>
                                        <div>
                                            <div className="h-2 w-24 bg-gray-200 rounded mb-1"></div>
                                            <div className="h-2 w-16 bg-gray-100 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 h-24 rounded-xl"></div>
                                        <div className="bg-gray-50 h-24 rounded-xl"></div>
                                    </div>
                                    <div className="bg-gray-50 h-32 rounded-xl w-full"></div>
                                    <div className="bg-gray-50 h-20 rounded-xl w-full"></div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative Circles */}
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-12 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -translate-x-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MobileAppPromo;
