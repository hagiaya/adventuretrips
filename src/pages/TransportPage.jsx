import React, { useState } from 'react';
import { useTrips } from '../hooks/useTrips';
import { MapPin, Star, ArrowLeft, Filter, Users, Fuel, Briefcase, Car, Eye } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import TripsFilterSidebar from '../components/TripsFilterSidebar';

const CarCard = ({ id, image, title, location, price, rating, features, mobileMode, views, original_price }) => {
    const specs = features?.specs || [];
    const vehicleType = features?.vehicle_type || 'Car';

    return (
        <Link to={mobileMode ? `/mobile-transport/${id}` : `/transport/${id}`} className="block h-full animate-fadeIn">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
                <div className="relative h-44 overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img
                        src={image}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        }}
                    />
                    <div className="absolute top-3 left-3">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                            {vehicleType}
                        </span>
                    </div>
                </div>

                <div className="p-3 md:p-4 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm md:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {title}
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                                <Eye size={12} />
                                <span>{views || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-bold text-gray-700">{rating}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                        {specs.slice(0, 3).map((spec, idx) => (
                            <span key={idx} className="text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 md:px-2 md:py-1 rounded flex items-center gap-1 truncate max-w-[60px] md:max-w-none">
                                {spec}
                            </span>
                        ))}
                    </div>

                    <div className="mt-auto pt-3 border-t border-gray-50 flex flex-col gap-2">
                        <div>
                            {original_price && (
                                <p className="text-[10px] text-gray-400 line-through decoration-red-500/50 mb-0.5">{original_price}</p>
                            )}
                            <p className="text-[10px] text-gray-400">Harga Sewa</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-sm md:text-lg font-bold text-blue-600">{price}</p>
                                <p className="text-[10px] text-gray-400">/ hari</p>
                            </div>
                        </div>
                        <button className="w-full text-xs md:text-sm font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                            Sewa
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const TransportPage = ({ mobileMode = false }) => {
    const { trips, loading } = useTrips();
    const location = useLocation();

    // Filter State
    const [filters, setFilters] = useState({
        duration: [],
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
    const transports = trips.filter(t => {
        // Must be Transportation
        const isTransport = (t.features?.category === 'Transportation') || (t.category === 'Transportation') ||
            ['MPV', 'SUV', 'Bus', 'Minibus', 'Luxury', 'Sewa Motor'].includes(t.category);

        if (!isTransport) return false;

        // Categories
        if (filters.categories.length > 0) {
            const cat = t.category || '';
            if (!filters.categories.includes(cat)) return false;
        }

        // Price
        const priceVal = parseInt(t.price.replace(/[^0-9]/g, '')) || 0;
        if (filters.minPrice && priceVal < parseInt(filters.minPrice)) return false;
        if (filters.maxPrice && priceVal > parseInt(filters.maxPrice)) return false;

        // Seat Capacity (mapped to filters.duration)
        if (filters.duration.length > 0) {
            let specs = t.features?.specs;

            // Safety: Ensure specs is treated correctly (array or string)
            let specsString = '';
            if (Array.isArray(specs)) {
                specsString = specs.join(' ').toLowerCase();
            } else if (typeof specs === 'string') {
                specsString = specs.toLowerCase();
            }

            // Add description to search scope for robustness
            specsString += ' ' + (t.description || '').toLowerCase();

            // Check if any selected seat filter matches the specs
            const hasSeatMatch = filters.duration.some(seatFilter => {
                try {
                    // seatFilter example: "4 Seat", "> 20 Seat"
                    if (seatFilter.startsWith('>')) {
                        // Handle > 20
                        const numbers = specsString.match(/\d+/g);
                        if (numbers) {
                            return numbers.some(n => parseInt(n) > 20);
                        }
                        return false;
                    }

                    const number = parseInt(seatFilter);
                    if (!isNaN(number)) {
                        const regex = new RegExp(`\\b${number}\\s*(seat|seater|kursi|penumpang)\\b`, 'i');
                        return regex.test(specsString) || specsString.includes(`${number} seat`) || specsString.includes(`${number} seater`);
                    }
                    return false;
                } catch (e) {
                    console.error("Error matching seat filter:", e);
                    return false;
                }
            });

            if (!hasSeatMatch) return false;
        }

        return true;
    });

    const categoryOptions = ['MPV', 'SUV', 'Bus', 'Minibus', 'Luxury', 'Sewa Motor'];
    const seatOptions = ['2 Seat', '4 Seat', '6 Seat', '7 Seat', '10-15 Seat', '> 20 Seat'];

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
                            <h1 className="font-bold text-md text-gray-900">Rental Mobil & Bus</h1>
                            <p className="text-[10px] text-gray-400">Sewa kendaraan terpercaya</p>
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
                        <h2 className="font-bold text-lg">Filter Transportasi</h2>
                        <button onClick={() => setShowMobileFilter(false)} className="text-gray-500 font-medium">Tutup</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <TripsFilterSidebar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onReset={handleReset}
                            categoryOptions={categoryOptions}
                            durationLabel="Berdasarkan Seat"
                            durationOptions={seatOptions}
                        />
                    </div>
                    <div className="p-4 border-t border-gray-100">
                        <button onClick={() => setShowMobileFilter(false)} className="w-full bg-primary text-white font-bold py-3 rounded-xl">
                            Terapkan Filter ({transports.length})
                        </button>
                    </div>
                </div>
            )}

            <div className={`container mx-auto px-4 ${mobileMode ? 'py-4' : ''}`}>
                {!mobileMode && (
                    <div className="text-center mb-8 md:mb-10">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transportasi & Rental</h1>
                        <p className="text-gray-500 mb-6">Pilihan armada terbaik untuk perjalanan nyaman Anda.</p>

                        {/* Mobile Sticky Filter Button (Responsive Web) */}
                        <div className="lg:hidden sticky top-16 z-30 bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm mx-auto max-w-md">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-sm">Filter</span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{transports.length} Unit</span>
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
                                durationLabel="Berdasarkan Seat"
                                durationOptions={seatOptions}
                            />
                        </aside>
                    )}

                    <div className="flex-1 w-full">
                        {loading ? (
                            <div className="text-center py-20 text-gray-400">Loading Vehicles...</div>
                        ) : transports.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                                <Car className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">Belum ada armada tersedia.</p>
                            </div>
                        ) : (
                            <div className={`grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3`}>
                                {transports.map(item => (
                                    <CarCard key={item.id} {...item} mobileMode={mobileMode} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransportPage;
