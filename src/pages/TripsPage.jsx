import React, { useState } from 'react';
import { useTrips } from '../hooks/useTrips';
import { MapPin, Star, ArrowLeft, Filter, Eye } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import TripsFilterSidebar from '../components/TripsFilterSidebar';

const TripCard = ({ id, image, title, location, price, rating, category, mobileMode, duration, views, original_price, discount_percentage, organizer }) => (
    <Link to={mobileMode ? `/mobile-trip/${id}` : `/trip/${id}`} className="block h-full animate-fadeIn">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
            <div className="relative w-full aspect-[4/3] overflow-hidden">
                <img
                    src={image}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    }}
                />

                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <Star className={`w-3.5 h-3.5 ${parseFloat(rating) > 0 ? 'text-secondary fill-yellow-400' : 'text-gray-300 fill-gray-100'}`} />
                    <span className="text-xs font-bold text-gray-700">{rating}</span>
                </div>
                {/* Discount Badge */}
                {discount_percentage > 0 && (
                    <div className="absolute bottom-3 left-3 z-[15]">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wide">
                            Hemat {discount_percentage}%
                        </span>
                    </div>
                )}
                <div className="absolute bottom-3 right-3">
                    <span className="bg-yellow-400 text-gray-900 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wide">
                        {duration || '1 Hari'}
                    </span>
                </div>
            </div>

            <div className="p-3 md:p-5 flex flex-col flex-1">
                <div className="mb-2 flex gap-2 items-center flex-wrap">
                    <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider">
                        {category || 'Open Trip'}
                    </span>
                </div>

                <div className="mb-3 flex flex-col gap-1">
                    <p className="text-[10px] md:text-[11px] text-gray-500 font-medium">
                        Trip Oleh <span className="text-primary font-bold">{organizer || 'Pandooin'}</span>
                    </p>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="tracking-wide line-clamp-1 capitalize">{location}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                            <Eye size={12} />
                            <span>{views || 0}</span>
                        </div>
                    </div>
                </div>

                <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[40px] md:min-h-[56px]">{title}</h3>

                <div className="mt-auto pt-3 flex flex-col gap-2 border-t border-gray-50">
                    <div>
                        <p className="text-[10px] text-gray-400 mb-0.5">Mulai dari</p>
                        {original_price && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-400 line-through mr-1 decoration-red-500/30">
                                    {original_price}
                                </span>
                            </div>
                        )}
                        <p className="text-sm md:text-lg font-bold text-primary">
                            {typeof price === 'number' ? `Rp ${price.toLocaleString('id-ID')}` : price}
                        </p>
                    </div>
                    <button className="w-full bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold group-hover:bg-primary group-hover:text-white transition-all">
                        Lihat
                    </button>
                </div>
            </div>
        </div>
    </Link>
);

const TripsPage = ({ mobileMode = false, category: propCategory }) => {
    const { trips, loading } = useTrips();
    const location = useLocation();

    // Parse query param
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('q') || '';
    const queryCategory = searchParams.get('category');

    // Determine active category filter (Prop > Query > Default to null/All)
    const activeCategory = propCategory || queryCategory;

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
                priceRangeLabel: '' // Clear radio selection if manual input
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
    const filteredTrips = trips.filter(trip => {
        // 1. Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!trip.title.toLowerCase().includes(query) && !trip.location.toLowerCase().includes(query)) {
                return false;
            }
        }

        // 2. Main Page Category Filter (Prop/URL)
        if (activeCategory) {
            // Check if trip's category matches the activeCategory
            // We look at 'features.category' or just 'category' prop if mapped
            const tripCat = (trip.features?.category || trip.category || 'Open Trip').toLowerCase();
            const targetCat = activeCategory.toLowerCase();

            // Allow partial match (e.g. "stay" matches "Accommodation")
            const isMatch = tripCat.includes(targetCat) ||
                (targetCat === 'stay' && tripCat.includes('accommodation')) ||
                (targetCat === 'transport' && tripCat.includes('transportation'));

            if (!isMatch) return false;
        } else {
            // Default: Show valid Open Trip categories ONLY.
            // Exclude explicit Accom/Transport categories to separate pages.
            const excludedCategories = [
                'hotel', 'villa', 'resort', 'homestay', 'glamping',
                'mpv', 'suv', 'bus', 'minibus', 'luxury', 'sewa motor',
                'accommodation', 'transportation'
            ];
            const lowerCat = (trip.category || '').toLowerCase();
            if (excludedCategories.includes(lowerCat)) return false;
        }

        // 3. User Selected Categories (Sidebar)
        if (filters.categories.length > 0) {
            const tripCat = (trip.category || '').toLowerCase();
            const hasMatch = filters.categories.some(cat => {
                // Special handling for compound categories
                if (cat === 'Beach/Island') return tripCat.includes('beach') || tripCat.includes('island') || tripCat.includes('pantai') || tripCat.includes('laut');
                if (cat === 'Trekking/Camping') return tripCat.includes('trekking') || tripCat.includes('camping') || tripCat.includes('hiking') || tripCat.includes('gunung');
                if (cat === 'Nature') return tripCat.includes('nature') || tripCat.includes('alam');
                if (cat === 'Culture/Culinary') return tripCat.includes('culture') || tripCat.includes('culinary') || tripCat.includes('budaya') || tripCat.includes('kuliner');
                if (cat === 'Adventure') return tripCat.includes('adventure') || tripCat.includes('petualangan');
                if (cat === 'Umum') return tripCat.includes('umum') || tripCat.includes('open') || tripCat.includes('general');

                return tripCat.includes(cat.toLowerCase());
            });
            if (!hasMatch) return false;
        }

        // 4. Price
        const tripPrice = typeof trip.price === 'number'
            ? trip.price
            : (parseInt(trip.price?.toString().replace(/[^0-9]/g, '')) || 0);

        if (filters.minPrice && tripPrice < parseInt(filters.minPrice)) return false;
        if (filters.maxPrice && tripPrice > parseInt(filters.maxPrice)) return false;

        // 5. Interests
        if (filters.interests.length > 0) {
            const isPopular = (trip.rating && parseFloat(trip.rating) >= 4.5) || (trip.views_count && parseInt(trip.views_count) > 50);

            // Check if new (last 60 days to be generous for demo)
            const createdDate = new Date(trip.created_at || Date.now());
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - 60);
            const isNew = createdDate >= daysAgo;

            let matchesInterest = false;
            if (filters.interests.includes('Perjalanan Popular') && isPopular) matchesInterest = true;
            if (filters.interests.includes('Rekomendasi Terbaru') && isNew) matchesInterest = true; // "Rekomendasi Terbaru" matches the label in sidebar

            if (!matchesInterest) return false;
        }

        // 6. Duration
        if (filters.duration.length > 0) {
            let durationDays = 1;

            // Try to parse from duration string first (e.g., "3 Hari 2 Malam")
            const durationStr = trip.duration || trip.features?.duration || '';
            const match = durationStr.toString().match(/(\d+)\s*Hari/i);

            if (match) {
                durationDays = parseInt(match[1], 10);
            } else {
                // Fallback to itinerary length if duration string extraction failed
                const itinerary = trip.itinerary || trip.features?.itinerary || [];
                if (Array.isArray(itinerary) && itinerary.length > 0) {
                    durationDays = itinerary.length;
                }
            }

            const durationLabel = durationDays > 5 ? '> 5 Hari' : `${durationDays} Hari`;

            if (!filters.duration.includes(durationLabel)) {
                return false;
            }
        }

        return true;
    });

    const getPageTitle = () => {
        if (searchQuery) return `"${searchQuery}"`;
        if (activeCategory === 'Accommodation') return 'Penginapan & Hotel';
        if (activeCategory === 'Transportation') return 'Transportasi';
        return 'Semua Paket Trip';
    }

    return (
        <div className={`min-h-screen bg-gray-50 ${mobileMode ? 'pb-20 max-w-md mx-auto shadow-2xl border-x border-gray-100' : 'pt-24 pb-20'}`}>

            {/* Mobile Header */}
            {mobileMode && (
                <div className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <Link to="/mobilemenu" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-800" />
                        </Link>
                        <h1 className="font-bold text-md text-gray-900 truncate max-w-[200px]">
                            {getPageTitle()}
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowMobileFilter(true)}
                        className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"
                    >
                        <Filter size={20} />
                    </button>
                </div>
            )}

            {/* Mobile Filter Modal - separate from mobileMode prop, accessible in responsive view too */}
            {showMobileFilter && (
                <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slideUp">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                        <h2 className="font-bold text-lg">Filter Pencarian</h2>
                        <button onClick={() => setShowMobileFilter(false)} className="text-gray-500 font-medium">Tutup</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <TripsFilterSidebar filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} />
                    </div>
                    <div className="p-4 border-t border-gray-100">
                        <button onClick={() => setShowMobileFilter(false)} className="w-full bg-primary text-white font-bold py-3 rounded-xl">
                            Terapkan Filter ({filteredTrips.length})
                        </button>
                    </div>
                </div>
            )}

            <div className={`container mx-auto px-4 ${mobileMode ? 'py-4' : ''}`}>
                {!mobileMode && (
                    <div className="text-center mb-8 md:mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {searchQuery ? `Hasil Pencarian: "${searchQuery}"` : (
                                activeCategory === 'Accommodation' ? 'Akomodasi Nyaman' :
                                    activeCategory === 'Transportation' ? 'Sewa Transportasi' :
                                        'Jelajahi Semua Destinasi'
                            )}
                        </h1>
                        <p className="text-gray-500 max-w-2xl mx-auto mb-6">
                            {searchQuery ? `Menampilkan ${filteredTrips.length} hasil pencarian.` : 'Temukan pengalaman terbaik untuk perjalanan Anda.'}
                        </p>

                        {/* Mobile Sticky Filter Button (Responsive Web) */}
                        <div className="lg:hidden sticky top-16 z-30 bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm mx-auto max-w-md">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-sm">Filter</span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredTrips.length} Trip</span>
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

                    {/* Desktop Sidebar */}
                    {!mobileMode && (
                        <aside className="w-64 shrink-0 hidden md:block sticky top-24">
                            <TripsFilterSidebar filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} />
                        </aside>
                    )}

                    {/* Content Grid */}
                    <div className="flex-1 w-full">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-gray-400">Memuat data produk...</div>
                            </div>
                        ) : filteredTrips.length === 0 ? (
                            <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 w-full">
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Trip tidak ditemukan</h3>
                                    <p className="text-gray-500 text-sm">Coba kata kunci lain atau kurangi filter.</p>
                                    <button
                                        onClick={handleReset}
                                        className="inline-block mt-4 text-primary font-bold hover:underline"
                                    >
                                        Reset Filter
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={`grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3`}>
                                {filteredTrips.map((trip) => (
                                    <TripCard key={trip.id} {...trip} mobileMode={mobileMode} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default TripsPage;
