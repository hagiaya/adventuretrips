import React from 'react';
import { MapPin, Star, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';
import { formatCurrency } from '../utils/formatters';

const TransportCard = ({ id, image, title, location, price, rating, features }) => {
    const vehicleType = features?.vehicle_type || 'Car';

    return (
        <Link to={`/transport/${id}`} className="block h-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
                <div className="relative h-56 overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img
                        src={image}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Fallback car image
                        }}
                    />
                    <div className="absolute top-3 left-3">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                            {vehicleType}
                        </span>
                    </div>
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-gray-700">{rating}</span>
                    </div>
                </div>
                <div className="p-3 md:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[40px] md:min-h-[56px]">{title}</h3>
                    </div>

                    <div className="mt-auto pt-3 flex flex-col gap-2 border-t border-gray-50">
                        <div>
                            <p className="text-[10px] text-gray-400 mb-0.5">Harga Sewa</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-sm md:text-lg font-bold text-primary">{formatCurrency(price)}</p>
                                <span className="text-[10px] md:text-xs text-gray-400">/ hari</span>
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
};

const RecommendedTransport = () => {
    const { trips } = useTrips();

    // Filter only Transportation
    const transports = trips.filter(t => {
        const isRecommended = t.is_recommended === true;
        const category = (t.category || t.features?.category || '').toLowerCase();
        const isMatch = category.includes('transport') ||
            category.includes('sewa') ||
            category.includes('mpv') ||
            category.includes('suv') ||
            category.includes('bus') ||
            category.includes('minibus') ||
            category.includes('luxury');
        return isRecommended && isMatch;
    }).slice(0, 4);

    if (transports.length === 0) return null;

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Rekomendasi Transportasi</h2>
                        <p className="text-gray-500">Kami pilihkan yang terbaik untukmu!</p>
                    </div>
                    <Link to="/transport" className="text-primary font-semibold hover:underline hidden md:flex items-center gap-1 group">
                        Lihat Semua
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {transports.map((item) => <TransportCard key={item.id} {...item} />)}
                </div>

                <div className="md:hidden mt-8 text-center">
                    <Link to="/transport" className="inline-block text-primary font-bold border border-primary px-6 py-2 rounded-full hover:bg-primary hover:text-white transition-colors">Lihat Semua</Link>
                </div>
            </div>
        </section>
    );
};

export default RecommendedTransport;
