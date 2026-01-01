import React from 'react';
import { MapPin, Star, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';

const HotelCard = ({ id, image, title, location, price, rating, views }) => (
    <Link to={`/stay/${id}`} className="block h-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
            <div className="relative h-56 overflow-hidden">
                <img
                    src={image}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Fallback hotel image
                    }}
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-gray-700">{rating}</span>
                </div>
            </div>
            <div className="p-3 md:p-5 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="uppercase tracking-wide line-clamp-1">{location}</span>
                    </div>
                </div>
                <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[40px] md:min-h-[56px]">{title}</h3>
                <div className="mt-auto pt-3 flex flex-col gap-2 border-t border-gray-50">
                    <div>
                        <p className="text-[10px] text-gray-400 mb-0.5">Mulai dari</p>
                        <div className="flex items-baseline gap-1">
                            <p className="text-sm md:text-lg font-bold text-primary">{price}</p>
                            <span className="text-[10px] md:text-xs text-gray-400">/ malam</span>
                        </div>
                    </div>
                    <button className="w-full bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold group-hover:bg-primary group-hover:text-white transition-all">
                        Lihat
                    </button>
                </div>
            </div>
        </div>
    </Link>
);

const RecommendedAccommodations = () => {
    const { trips } = useTrips();

    // Filter only Accommodation
    const hotels = trips.filter(t => {
        const category = (t.category || t.features?.category || '').toLowerCase();
        return category.includes('accommodation') ||
            category === 'stay' ||
            category.includes('penginapan') ||
            category.includes('hotel') ||
            category.includes('villa') ||
            category.includes('resort') ||
            category.includes('homestay') ||
            category.includes('glamping');
    }).slice(0, 4);

    if (hotels.length === 0) return null;

    return (
        <section className="py-16 bg-gray-50/50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Rekomendasi Akomodasi</h2>
                        <p className="text-gray-500">Kami pilihkan yang terbaik untukmu!</p>
                    </div>
                    <Link to="/stay" className="text-primary font-semibold hover:underline hidden md:flex items-center gap-1 group">
                        Lihat Semua
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {hotels.map((hotel) => <HotelCard key={hotel.id} {...hotel} />)}
                </div>

                <div className="md:hidden mt-8 text-center">
                    <Link to="/stay" className="inline-block text-primary font-bold border border-primary px-6 py-2 rounded-full hover:bg-primary hover:text-white transition-colors">Lihat Semua</Link>
                </div>
            </div>
        </section>
    );
};

export default RecommendedAccommodations;
