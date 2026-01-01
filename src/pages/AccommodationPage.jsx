import React, { useState } from 'react';
import { useTrips } from '../hooks/useTrips';
import { MapPin, Star, ArrowLeft, Filter, Wifi, Coffee, Car, Tv, Wind, Eye } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import TripsFilterSidebar from '../components/TripsFilterSidebar';

const HotelCard = ({ id, image, title, location, price, rating, features, mobileMode, views, original_price }) => {
    // Parse facilities if string or array
    const facilities = features?.facilities || [];

    return (
        <Link to={mobileMode ? `/mobile-stay/${id}` : `/stay/${id}`} className="block h-full animate-fadeIn">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
                <div className="relative h-44 md:h-48 overflow-hidden">
                    <img
                        src={image}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        }}
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <Star className="w-3.5 h-3.5 text-secondary fill-yellow-400" />
                        <span className="text-xs font-bold text-gray-700">{rating}</span>
                    </div>
                </div>

                <div className="p-3 md:p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="line-clamp-1">{location}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                            <Eye size={12} />
                            <span>{views || 0}</span>
                        </div>
                    </div>

                    <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {title}
                    </h3>

                    {/* Facilities Preview */}
                    <div className="flex gap-2 md:gap-3 mb-3 md:mb-4 overflow-hidden">
                        {facilities.slice(0, 3).map((fac, idx) => (
                            <span key={idx} className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded flex items-center gap-1">
                                {/* Icons can remain small */}
                                {fac === 'Wifi' && <Wifi size={10} />}
                                {fac === 'Breakfast' && <Coffee size={10} />}
                                {fac === 'Parking' && <Car size={10} />}
                                {fac === 'AC' && <Wind size={10} />}
                                {/* Simplify for mobile check */}
                                <span className="truncate max-w-[50px] md:max-w-none">{fac}</span>
                            </span>
                        ))}
                    </div>

                    <div className="mt-auto pt-3 border-t border-gray-50 flex flex-col gap-2">
                        <div>
                            {original_price && (
                                <p className="text-[10px] text-gray-400 line-through decoration-red-500/50">{original_price}</p>
                            )}
                            <div className="flex items-baseline gap-1">
                                <p className="text-sm md:text-lg font-bold text-orange-500">{price}</p>
                                <p className="text-[10px] text-gray-400">/ malam</p>
                            </div>
                        </div>
                        <button className="w-full text-xs md:text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                            Pilih Kamar
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const AccommodationPage = ({ mobileMode = false }) => {
    const { trips, loading } = useTrips();
    const location = useLocation();

    // Filter State
    const [filters, setFilters] = useState({
        duration: [], // Not really used for hotels usually but keeping structure
        interests: [],
        categories: [],
        minPrice: '',
        maxPrice: '',
        priceRangeLabel: ''
    });

    const [showMobileFilter, setShowMobileFilter] = useState(false);

    const handleFilterChange = (key, value) => {
        if (key === 'priceRange') {
            setFilters(prev => ({
                ...prev,
                minPrice: value.min,
                maxPrice: value.max || '',
                priceRangeLabel: value.label
            }));
        } else if (key === 'minPrice' || key === 'maxPrice') {
            setFilters(prev => ({
                ...prev,
                [key]: value,
                priceRangeLabel: ''
            }));
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    const handleReset = () => {
        setFilters({
            duration: [],
            interests: [],
            categories: [],
            minPrice: '',
            maxPrice: '',
            priceRangeLabel: ''
        });
    };

    // Filter Logic
    const hotels = trips.filter(t => {
        // Must be Accommodation
        const isAccommodation = (t.features?.category === 'Accommodation') || (t.category === 'Accommodation') ||
            ['Hotel', 'Villa', 'Resort', 'Homestay', 'Glamping'].includes(t.category);

        if (!isAccommodation) return false;

        // Categories
        if (filters.categories.length > 0) {
            const cat = t.category || '';
            if (!filters.categories.includes(cat)) return false;
        }

        // Price
        const priceVal = parseInt(t.price.replace(/[^0-9]/g, '')) || 0;
        if (filters.minPrice && priceVal < parseInt(filters.minPrice)) return false;
        if (filters.maxPrice && priceVal > parseInt(filters.maxPrice)) return false;

        // Room Filter (mapped to filters.duration)
        if (filters.duration.length > 0) {
            const facilities = t.features?.facilities || [];
            // Combine facilities and description for search
            const textToSearch = (facilities.join(' ') + ' ' + (t.description || '')).toLowerCase();

            const hasRoomMatch = filters.duration.some(roomFilter => {
                // roomFilter e.g. "1 Kamar", "> 3 Kamar"
                if (roomFilter.startsWith('>')) {
                    // Check for number > 3 followed by kamar/room matches
                    // Find all numbers followed by kamar/room
                    const matches = textToSearch.matchAll(/(\d+)\s*(kamar|room|bedroom)/gi);
                    for (const match of matches) {
                        if (parseInt(match[1]) > 3) return true;
                    }
                    return false;
                }

                const num = parseInt(roomFilter);
                if (num) {
                    // Exact match for num + kamar/room
                    const regex = new RegExp(`\\b${num}\\s*(kamar|room|bedroom)`, 'i');
                    return regex.test(textToSearch);
                }
                return false;
            });

            if (!hasRoomMatch) return false;
        }

        return true;
    });

    const categoryOptions = ['Hotel', 'Villa', 'Resort', 'Homestay', 'Glamping'];
    const roomOptions = ['1 Kamar', '2 Kamar', '3 Kamar', '> 3 Kamar'];

    return (
        <div className={`min-h-screen bg-gray-50 ${mobileMode ? 'pb-24 max-w-md mx-auto shadow-2xl border-x border-gray-100' : 'pt-24 pb-20'}`}>

            {/* Mobile Header */}
            {mobileMode && (
                <div className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <Link to="/mobilemenu" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-800" />
                        </Link>
                        <div>
                            <h1 className="font-bold text-md text-gray-900">Hotel & Penginapan</h1>
                            <p className="text-[10px] text-gray-400">Temukan tempat istirahat terbaik</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowMobileFilter(true)}
                        className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"
                    >
                        <Filter size={20} />
                    </button>
                </div>
            )}

            {/* Mobile Filter Modal - accessible in responsive view too */}
            {showMobileFilter && (
                <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slideUp">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                        <h2 className="font-bold text-lg">Filter Akomodasi</h2>
                        <button onClick={() => setShowMobileFilter(false)} className="text-gray-500 font-medium">Tutup</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <TripsFilterSidebar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onReset={handleReset}
                            categoryOptions={categoryOptions}
                            durationLabel="Berdasarkan Jumlah Room"
                            durationOptions={roomOptions}
                        />
                    </div>
                    <div className="p-4 border-t border-gray-100">
                        <button onClick={() => setShowMobileFilter(false)} className="w-full bg-primary text-white font-bold py-3 rounded-xl">
                            Terapkan Filter ({hotels.length})
                        </button>
                    </div>
                </div>
            )}

            <div className={`container mx-auto px-4 ${mobileMode ? 'py-4' : ''}`}>
                {!mobileMode && (
                    <div className="text-center mb-8 md:mb-10">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Staycation & Penginapan</h1>
                        <p className="text-gray-500 mb-6">Temukan hotel, villa, dan resort terbaik untuk liburan Anda.</p>

                        {/* Mobile Sticky Filter Button (Responsive Web) */}
                        <div className="lg:hidden sticky top-16 z-30 bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm mx-auto max-w-md">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-sm">Filter</span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{hotels.length} Stay</span>
                            </div>
                            <button
                                onClick={() => setShowMobileFilter(true)}
                                className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
                            >
                                <Filter size={16} /> Sesuaikan
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Sidebar */}
                    {!mobileMode && (
                        <aside className="w-64 shrink-0 hidden md:block sticky top-24">
                            <TripsFilterSidebar
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onReset={handleReset}
                                categoryOptions={categoryOptions}
                                durationLabel="Berdasarkan Jumlah Room"
                                durationOptions={roomOptions}
                            />
                        </aside>
                    )}

                    <div className="flex-1 w-full">
                        {loading ? (
                            <div className="text-center py-20 text-gray-400">Loading Hotels...</div>
                        ) : hotels.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                                <p className="text-gray-500">Belum ada data penginapan tersedia.</p>
                            </div>
                        ) : (
                            <div className={`grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3`}>
                                {hotels.map(hotel => (
                                    <HotelCard key={hotel.id} {...hotel} mobileMode={mobileMode} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccommodationPage;
