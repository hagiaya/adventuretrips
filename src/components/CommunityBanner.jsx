import React from 'react';

const CommunityBanner = () => {
    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="relative rounded-3xl overflow-hidden bg-primary h-[350px] md:h-[400px] flex items-center shadow-2xl group">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                            alt="Community"
                            className="w-full h-full object-cover mix-blend-overlay opacity-25 group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/60 to-transparent"></div>
                    </div>

                    <div className="relative z-10 p-8 md:p-16 max-w-3xl">
                        <span className="inline-block px-4 py-1.5 bg-white/10 text-white rounded-full text-sm font-semibold mb-6 backdrop-blur-sm border border-white/10">Special Program</span>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">Family & Community Getaway</h2>
                        <p className="text-white/80 mb-10 text-lg md:text-xl font-light max-w-xl">
                            Cocok untuk grup, perusahaan, keluarga besar, dan komunitas yang ingin menciptakan momen tak terlupakan bersama.
                        </p>
                        <button className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-pink-50 transition-colors shadow-lg flex items-center gap-2 group/btn">
                            Pelajari Selengkapnya
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CommunityBanner;
