import React, { useState } from 'react';
import { useTrips } from '../hooks/useTrips';
import { MapPin, Star, ArrowLeft, Filter, Wifi, Coffee, Car, Tv, Wind, Eye, Calendar, Users, Search, ChevronDown, Check, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import TripsFilterSidebar from '../components/TripsFilterSidebar';
import { formatCurrency } from '../utils/formatters';

const HotelCard = ({ id, image, title, location, price, rating, features, mobileMode, views, original_price, description }) => {
    // Parse facilities if string or array
    const facilities = features?.facilities || [];
    const ratingNum = parseFloat(rating) || 4.5;

    // Rating Label based on core
    const getRatingLabel = (r) => {
        if (r >= 9) return "Luar Biasa";
        if (r >= 8) return "Mengesankan";
        if (r >= 7) return "Nyaman";
        return "Bagus";
    };

    if (mobileMode) {
        // Mobile Card (Vertical)
        return (
            <Link to={`/mobile-stay/${id}`} className="block h-full animate-fadeIn mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                    <div className="relative h-40">
                        <img
                            src={image}
                            alt={title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            }}
                        />
                        {original_price && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                Promo
                            </div>
                        )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{title}</h3>
                        <div className="flex items-center gap-1 mb-2">
                            <div className="flex">
                                {[...Array(Math.floor(ratingNum))].map((_, i) => (
                                    <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <span className="text-[10px] text-gray-400">({rating})</span>
                        </div>

                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                            <MapPin size={12} className="text-gray-400" />
                            <span className="truncate">{location}</span>
                        </div>

                        <div className="mt-auto">
                            <p className="text-[10px] text-gray-400 line-through">{original_price}</p>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-500 font-bold text-sm">{formatCurrency(price)}</p>
                                    <p className="text-[10px] text-gray-400">/ kamar / malam</p>
                                </div>
                                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded">
                                    Pilih
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    // Desktop Card (Horizontal - Traveloka Style)
    return (
        <Link to={`/stay/${id}`} className="block mb-4 animate-fadeIn group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-row h-52">
                {/* Image Section */}
                <div className="w-1/3 relative overflow-hidden">
                    <img
                        src={image}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        }}
                    />
                    <div className="absolute top-3 left-3">
                        {original_price && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                Hemat 15%
                            </span>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-4 flex flex-col justify-between border-r border-gray-100 relative">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{title}</h3>

                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                {features?.category || 'Hotel'}
                            </div>
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={12}
                                        className={`${i < Math.floor(ratingNum) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-start gap-1.5 text-gray-500 text-xs mb-3">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
                            <span className="line-clamp-1">{location}</span>
                        </div>

                        {/* Facilities Badges */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {facilities.slice(0, 4).map((fac, idx) => (
                                <span key={idx} className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                                    {fac === 'Wifi' && <Wifi size={10} />}
                                    {fac === 'Breakfast' && <Coffee size={10} />}
                                    {fac}
                                </span>
                            ))}
                            {facilities.length > 4 && (
                                <span className="text-[10px] text-gray-400 px-1">+ {facilities.length - 4} lainnya</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span className="text-[10px] text-green-700 font-medium">Protokol Kebersihan Terjamin</span>
                    </div>
                </div>

                {/* Price & Rating Section (Right) */}
                <div className="w-60 min-w-[200px] p-4 bg-gray-50/50 flex flex-col justify-end items-end text-right">
                    {/* Rating Badge */}
                    <div className="flex items-center gap-2 mb-auto w-full justify-end">
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-700">{getRatingLabel(ratingNum)}</p>
                            <p className="text-[10px] text-gray-400">{views || 100} review</p>
                        </div>
                        <div className="w-8 h-8 rounded-tr-lg rounded-bl-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-blue-200 shadow-md">
                            {rating}
                        </div>
                    </div>

                    <div className="mt-4">
                        {original_price && (
                            <p className="text-xs text-gray-400 line-through mb-0.5">{original_price}</p>
                        )}
                        <p className="text-xl font-bold text-orange-500">{formatCurrency(price)}</p>
                        <p className="text-[10px] text-gray-500 mb-3">Termasuk Pajak</p>

                        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm shadow-md shadow-orange-200 transition-all transform hover:scale-[1.02]">
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
    const [searchQuery, setSearchQuery] = useState('');

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

        // Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!t.title.toLowerCase().includes(query) && !t.location.toLowerCase().includes(query)) return false;
        }

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
            const textToSearch = (facilities.join(' ') + ' ' + (t.description || '')).toLowerCase();

            const hasRoomMatch = filters.duration.some(roomFilter => {
                if (roomFilter.startsWith('>')) {
                    const matches = textToSearch.matchAll(/(\d+)\s*(kamar|room|bedroom)/gi);
                    for (const match of matches) {
                        if (parseInt(match[1]) > 3) return true;
                    }
                    return false;
                }

                const num = parseInt(roomFilter);
                if (num) {
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
        <div className={`min-h-screen bg-gray-50 font-sans ${mobileMode ? 'pb-24 max-w-md mx-auto shadow-2xl border-x border-gray-100' : 'pt-20 pb-20'}`}>

            {/* Header Section - Traveloka Style for Mobile */}
            {mobileMode && (
                <div className="bg-blue-500 text-white sticky top-0 z-50 shadow-md">
                    <div className="px-4 py-3 flex items-center gap-3">
                        <Link to="/mobilemenu" className="p-1 rounded-full hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex-1">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari hotel atau destinasi..."
                                    className="w-full bg-white text-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowMobileFilter(true)}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Hero Search Section */}
            {!mobileMode && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 pb-12 pt-8 mb-8 px-4 shadow-lg">
                    <div className="container mx-auto">
                        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            Staycation & Penginapan
                        </h1>

                        {/* Search Widget Box */}
                        <div className="bg-white rounded-xl p-4 shadow-xl grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-4 relative">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Destinasi / Nama Hotel</label>
                                <div className="relative border-b-2 border-gray-200 hover:border-blue-500 transition-colors">
                                    <MapPin className="absolute left-0 top-3 text-blue-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        className="w-full pl-8 pr-4 py-3 font-bold text-gray-800 focus:outline-none placeholder:font-normal"
                                        placeholder="Mau nginep di mana?"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-span-3 relative">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tanggal Check-in</label>
                                <div className="relative border-b-2 border-gray-200 hover:border-blue-500 transition-colors">
                                    <Calendar className="absolute left-0 top-3 text-blue-500 w-5 h-5" />
                                    <input type="text" className="w-full pl-8 pr-4 py-3 font-bold text-gray-800 focus:outline-none" defaultValue="Sab, 20 Jan 2026" readOnly />
                                </div>
                            </div>
                            <div className="col-span-3 relative">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Durasi & Tamu</label>
                                <div className="relative border-b-2 border-gray-200 hover:border-blue-500 transition-colors">
                                    <Users className="absolute left-0 top-3 text-blue-500 w-5 h-5" />
                                    <input type="text" className="w-full pl-8 pr-4 py-3 font-bold text-gray-800 focus:outline-none" defaultValue="1 Malam, 2 Tamu" readOnly />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                                    <Search size={20} /> Cari Hotel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Filter Modal */}
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
                        <button onClick={() => setShowMobileFilter(false)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">
                            Terapkan Filter ({hotels.length})
                        </button>
                    </div>
                </div>
            )}

            <div className={`container mx-auto px-4 ${mobileMode ? 'py-4' : ''}`}>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Sidebar Filters (Desktop) -> styled cleaner */}
                    {!mobileMode && (
                        <aside className="w-64 shrink-0 hidden md:block sticky top-24">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                                    <Filter size={16} /> Filter Pencarian
                                </h3>
                                <TripsFilterSidebar
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    onReset={handleReset}
                                    categoryOptions={categoryOptions}
                                    durationLabel="Jumlah Kamar"
                                    durationOptions={roomOptions}
                                />
                            </div>
                        </aside>
                    )}

                    <div className="flex-1 w-full">
                        {!mobileMode && (
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-gray-600 font-medium">Menampilkan <span className="font-bold text-gray-900">{hotels.length}</span> akomodasi terbaik</p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>Urutkan:</span>
                                    <select className="border border-gray-200 rounded-md py-1 px-2 focus:outline-none font-bold text-gray-700">
                                        <option>Harga Terendah</option>
                                        <option>Rating Tertinggi</option>
                                        <option>Populer</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-20 flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-gray-400 font-medium">Mencari penginapan terbaik...</p>
                            </div>
                        ) : hotels.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="text-gray-400" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Tidak ditemukan</h3>
                                <p className="text-gray-500">Coba ubah filter atau kata kunci pencarian Anda.</p>
                                <button onClick={handleReset} className="mt-4 text-blue-600 font-bold hover:underline">Reset Filter</button>
                            </div>
                        ) : (
                            <div className={`grid gap-4 ${mobileMode ? 'grid-cols-1' : 'grid-cols-1'}`}>
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
