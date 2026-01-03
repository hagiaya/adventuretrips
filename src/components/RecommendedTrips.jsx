import React from 'react';
import { MapPin, Star, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';
import { formatNumber } from '../utils/formatters';

const TripCard = ({ id, image, title, location, price, rating, views, duration, original_price, discount_percentage, organizer }) => (
    <Link to={`/trip/${id}`} className="block h-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
            <div className="relative w-full aspect-[4/3] overflow-hidden">
                <img src={image} alt={title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

                {/* Discount Badge */}
                {discount_percentage > 0 && (
                    <div className="absolute top-3 left-3 z-20">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider">
                            Hemat {discount_percentage}%
                        </span>
                    </div>
                )}

                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-gray-700">{rating}</span>
                </div>
                <div className="absolute bottom-3 right-3">
                    <span className="bg-yellow-400 text-gray-900 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wide">
                        {duration || '1 Hari'}
                    </span>
                </div>
            </div>
            <div className="p-3 md:p-5 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="tracking-wide capitalize">{location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs text-right">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{formatNumber(views)} Dilihat</span>
                    </div>
                </div>

                {/* Trip Oleh Badge */}
                <div className="mb-2">
                    <p className="text-[11px] text-gray-500 font-medium">
                        Trip Oleh <span className="text-primary font-bold">{organizer || 'Adventure Trip'}</span>
                    </p>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
                <div className="mt-auto pt-4 flex items-end justify-between border-t border-gray-50">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Mulai dari</p>
                        {original_price && (
                            <p className="text-xs text-gray-400 line-through decoration-red-500/50 mb-0.5">
                                {original_price}
                            </p>
                        )}
                        <p className="text-lg font-bold text-primary">{price}</p>
                    </div>
                    <button className="bg-pink-50 text-pink-600 px-4 py-2 rounded-lg text-sm font-bold group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                        Lihat
                    </button>
                </div>
            </div>
        </div>
    </Link>
);

const RecommendedTrips = () => {
    const { trips } = useTrips();

    // Select specific trips for recommendation: 
    // 1. Manually set 'is_recommended'
    // 2. Fallback to newest (since useTrips orders by created_at desc)
    const recommendedTrips = trips
        .filter(t => t.is_recommended)
        .concat(trips.filter(t => !t.is_recommended))
        .slice(0, 4);

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Trip Rekomendasi Terbaru</h2>
                        <p className="text-gray-500">Destinasi pilihan yang wajib kamu kunjungi</p>
                    </div>
                    <Link to="/trips" className="text-primary font-semibold hover:underline hidden md:flex items-center gap-1 group">
                        Lihat Semua
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {recommendedTrips.map((trip) => <TripCard key={trip.id} {...trip} />)}
                </div>

                <div className="md:hidden mt-8 text-center">
                    <Link to="/trips" className="inline-block text-primary font-bold border border-primary px-6 py-2 rounded-full hover:bg-primary hover:text-white transition-colors">Lihat Semua</Link>
                </div>
            </div>
        </section>
    );
};

export default RecommendedTrips;
