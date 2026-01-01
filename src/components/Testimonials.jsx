import React from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
    const reviews = [
        {
            name: "Sarah Wijaya",
            role: "Travel Vlogger",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
            text: "Pengalaman trip ke Labuan Bajo bareng Adventure Trip bener-bener gak terlupakan! Phinisi-nya mewah, makanannya enak, dan guide-nya asik banget.",
            rating: 5
        },
        {
            name: "Budi Santoso",
            role: "Corporate Manager",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
            text: "Ikut private trip Bromo buat gathering kantor. Servisnya juara! Semua diurusin dari A-Z, kami tinggal bawa badan dan nikmatin pemandangan.",
            rating: 5
        },
        {
            name: "Jessica Tan",
            role: "Solo Traveler",
            image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
            text: "Awalnya ragu ikut Open Trip sendirian, tapi ternyata seru banget! Dapet temen-temen baru yang sefrekuensi. Recommended banget buat solo traveler.",
            rating: 4
        }
    ];

    return (
        <section className="py-16 bg-gray-50/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Apa Kata Mereka?</h2>
                    <p className="text-gray-500 text-lg">Cerita seru dari para traveler yang sudah menjelajah bersama kami</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {reviews.map((review, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 relative">
                            <Quote className="w-10 h-10 text-blue-100 absolute top-6 right-6" />
                            <div className="flex items-center gap-4 mb-6">
                                <img
                                    src={review.image}
                                    alt={review.name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                                />
                                <div>
                                    <h4 className="font-bold text-gray-900">{review.name}</h4>
                                    <p className="text-sm text-gray-500">{review.role}</p>
                                </div>
                            </div>
                            <div className="flex mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-gray-600 leading-relaxed italic">
                                "{review.text}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
