import React, { useState, useEffect } from 'react';
import { Star, Quote, Loader } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Testimonials = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const { data, error } = await supabase
                    .from('site_content')
                    .select('content')
                    .eq('key', 'testimonials')
                    .single();

                if (error) throw error;
                if (data && data.content) {
                    setReviews(JSON.parse(data.content));
                }
            } catch (err) {
                console.error("Failed to fetch testimonials:", err);
                // Fallback to initial static data if fetch fails
                setReviews([
                    {
                        name: "Andini Putri",
                        role: "Travel Photographer",
                        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
                        text: "Pengalaman Sailing Komodo bareng Adventure Trip bener-bener luar biasa. Pelayanannya premium, guidenya informatif, dan dokumentasinya juara banget!",
                        rating: 5
                    },
                    {
                        name: "Rizky Ramadhan",
                        role: "Entrepreneur",
                        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
                        text: "Sering sewa mobil buat kebutuhan bisnis di Bali lewat sini. Mobilnya selalu unit terbaru, bersih, dan driver-nya sangat profesional serta tepat waktu.",
                        rating: 5
                    },
                    {
                        name: "Maya Kartika",
                        role: "Content Creator",
                        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
                        text: "Dapet harga promo staycation di Villa daerah Seminyak lewat platform ini. Prosesnya gampang banget, gak pake ribet dan CS-nya sangat membantu.",
                        rating: 5
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    if (loading) {
        return (
            <div className="py-16 flex items-center justify-center">
                <Loader className="animate-spin text-primary" />
            </div>
        );
    }

    if (reviews.length === 0) return null;

    return (
        <section className="py-20 bg-gray-50/50 overflow-hidden">
            <style>
                {`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-350px * ${reviews.length})); }
                }
                .testimonial-track {
                    display: flex;
                    width: calc(350px * ${reviews.length * 2});
                    animation: scroll 40s linear infinite;
                }
                .testimonial-track:hover {
                    animation-play-state: paused;
                }
                `}
            </style>

            <div className="container mx-auto px-4 mb-12">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Kisah Perjalanan Mereka</h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">Bergabunglah dengan ribuan traveler lain yang telah menciptakan kenangan indah bersama kami.</p>
                </div>
            </div>

            {/* Scrolling Track */}
            <div className="relative">
                {/* Gradient Overlays for Fade Effect */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

                <div className="testimonial-track gap-6 px-4">
                    {/* First Set */}
                    {reviews.map((review, idx) => (
                        <div
                            key={`first-${idx}`}
                            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 w-[350px] shrink-0 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <Quote className="w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                                </div>
                                <p className="text-gray-600 leading-relaxed italic mb-8 line-clamp-4">
                                    "{review.text}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4 mt-auto">
                                <div className="relative">
                                    <img
                                        src={review.image || "https://ui-avatars.com/api/?name=" + review.name}
                                        alt={review.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"></div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{review.name}</h4>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{review.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Duplicate set for continuous loop */}
                    {reviews.map((review, idx) => (
                        <div
                            key={`second-${idx}`}
                            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 w-[350px] shrink-0 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <Quote className="w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                                </div>
                                <p className="text-gray-600 leading-relaxed italic mb-8 line-clamp-4">
                                    "{review.text}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4 mt-auto">
                                <div className="relative">
                                    <img
                                        src={review.image || "https://ui-avatars.com/api/?name=" + review.name}
                                        alt={review.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"></div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{review.name}</h4>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{review.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
