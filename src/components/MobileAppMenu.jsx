import React, { useState, useEffect } from 'react';
import { Home, Compass, User, Bell, Search, ChevronRight, Ticket, Heart, Settings, MapPin, Star, Tag, Sparkles, UserPlus, CreditCard, Headphones, Eye, Bed, Car, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BlogSection from './BlogSection';
import { useTrips } from '../hooks/useTrips';
import { supabase } from '../lib/supabaseClient';
import { formatNumber } from '../utils/formatters';

// MobileTripCard Component
// MobileTripCard Component with View Count
const MobileTripCard = ({ id, image, title, location, price, rating, category, views, duration, original_price, discount_percentage }) => (
    <Link to={`/mobile-trip/${id}`} className="block h-full">
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="relative aspect-[4/3]">
                <img
                    src={image}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                    }}
                />
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                    <Star className="w-2.5 h-2.5 text-secondary fill-secondary" />
                    <span className="text-[10px] font-bold text-gray-700 leading-none mt-[1px]">{rating}</span>
                </div>
                {category && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        <span className="bg-primary/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wide">
                            {category}
                        </span>
                        {discount_percentage > 0 && (
                            <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wide">
                                {discount_percentage}% OFF
                            </span>
                        )}
                    </div>
                )}
                {!category && discount_percentage > 0 && (
                    <div className="absolute top-2 left-2">
                        <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wide">
                            {discount_percentage}% OFF
                        </span>
                    </div>
                )}
                <div className="absolute bottom-2 right-2">
                    <span className="bg-yellow-400 text-gray-900 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wide">
                        {duration || '1 Hari'}
                    </span>
                </div>
            </div>

            <div className="p-2.5 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1 text-gray-400 text-[9px] uppercase font-bold line-clamp-1">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{location}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-gray-400 text-[9px]">
                        <Eye className="w-2.5 h-2.5" />
                        <span>{formatNumber(views)}</span>
                    </div>
                </div>

                <h3 className="text-[11px] leading-[1.4] font-bold text-gray-900 mb-2 line-clamp-2 min-h-[32px]">
                    {title}
                </h3>
                <div className="mt-auto pt-2 border-t border-dashed border-gray-100">
                    <p className="text-[9px] text-gray-400 mb-0.5">Mulai dari</p>
                    {original_price && (
                        <p className="text-[9px] text-gray-400 line-through decoration-red-500/50 mb-0.5">
                            {original_price}
                        </p>
                    )}
                    <p className="text-sm font-bold text-primary leading-none">{price}</p>
                </div>
            </div>
        </div>
    </Link >
);

const MobileAppMenu = () => {
    // Banner State
    const [currentBanner, setCurrentBanner] = useState(0);
    const { trips } = useTrips();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [banners, setBanners] = useState([]);

    // Fetch Banners
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const { data, error } = await supabase
                    .from('banners')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (data && data.length > 0) {
                    setBanners(data.map(b => b.image_url));
                    setCurrentBanner(0);
                } else {
                    // No banners in DB -> Empty state (or could show a placeholder if preferred)
                    setBanners([]);
                }
            } catch (error) {
                console.error("Error loading banners", error);
                setBanners([]);
            }
        };
        fetchBanners();
    }, []);

    // Banner Rotation Effect
    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [banners.length]);

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null); // Store public.profiles data
    const [locationName, setLocationName] = useState("Jakarta, Indonesia"); // Default placeholder
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            // 1. Get Session
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user;
            setUser(currentUser);

            if (currentUser) {
                // 2. Fetch Profile from 'public.profiles'
                const { data: userProfile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                if (userProfile) {
                    setProfile(userProfile);
                } else if (currentUser.user_metadata) {
                    // Fallback to metadata if profile not found
                    setProfile({
                        full_name: currentUser.user_metadata.full_name,
                        balance: 0
                    });
                }
            } else {
                // Check mock (for dev testing without backend)
                const mock = localStorage.getItem('mockUser');
                if (mock) {
                    const mockData = JSON.parse(mock);
                    setUser(mockData);
                    setProfile({ full_name: mockData.user_metadata?.full_name || "Guest" });
                }
            }
        };

        fetchUserData();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchUserData(); // Refetch profile on auth change
        });

        // 3. Get User Location (Geolocation)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse Geocoding using OpenStreetMap (Free, no key needed)
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();

                    if (data && data.address) {
                        // Priority: City -> Town -> County -> State
                        const city = data.address.city || data.address.town || data.address.county || data.address.state_district;
                        const country = data.address.country;
                        if (city) {
                            setLocationName(`${city}, ${country}`);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch location name", err);
                    // Keep default or set to generic
                }
            }, (err) => {
                console.warn("Geolocation permission denied or error", err);
            });
        }

        return () => subscription.unsubscribe();
    }, [banners.length]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/mobile-trips?q=${encodeURIComponent(searchQuery)}`);
        } else {
            navigate('/mobile-trips');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const toggleUserMenu = () => {
        if (!user) {
            const event = new CustomEvent('open-auth-modal', {
                detail: {
                    mode: 'login',
                    alertMessage: 'Oops, maaf kamu belum masuk'
                }
            });
            window.dispatchEvent(event);
        } else {
            setIsUserMenuOpen(!isUserMenuOpen);
        }
    };

    const handleLogout = async () => {
        if (window.confirm("Apakah Anda yakin ingin keluar?")) {
            try {
                localStorage.removeItem('mockUser');
                await supabase.auth.signOut();
                setUser(null);
                setProfile(null);
                setLocationName("Jakarta, Indonesia");
                setIsUserMenuOpen(false);
                window.location.reload();
            } catch (error) {
                console.error("Logout error:", error);
            }
        }
    };

    // Menu items mimicking a superapp/travel app grid
    const mainMenus = [
        {
            icon: <Compass className="w-6 h-6 text-white" />,
            label: "Open Trip",
            color: "bg-pink-500",
            link: "/mobile-trips"
        },
        {
            icon: <Crown className="w-6 h-6 text-white" />,
            label: "Private Trip",
            color: "bg-purple-600",
            link: "/mobile-private-trip"
        },
        {
            icon: <Bed className="w-6 h-6 text-white" />,
            label: "Penginapan",
            color: "bg-orange-500",
            link: "/mobile-stay"
        },
        {
            icon: <Car className="w-6 h-6 text-white" />,
            label: "Transport",
            color: "bg-blue-600",
            link: "/mobile-transport"
        },
        {
            icon: <Ticket className="w-6 h-6 text-white" />,
            label: "Tiket",
            color: "bg-purple-500",
            link: "/mobile-tickets"
        },
        {
            icon: <Headphones className="w-6 h-6 text-white" />,
            label: "CS",
            color: "bg-green-500",
            action: () => window.open('https://wa.me/6281382471642?text=Halo%20Admin,%20saya%20butuh%20bantuan', '_blank')
        },
    ];

    const promoOffers = [
        {
            icon: <UserPlus className="w-5 h-5 text-pink-600" />,
            title: "Pengguna Baru",
            desc: "Diskon 500rb!",
            bg: "bg-pink-50 border-pink-100",
            textColor: "text-pink-900"
        },
        {
            icon: <Sparkles className="w-5 h-5 text-purple-600" />,
            title: "Flash Sale 12.12",
            desc: "Diskon s.d 70%",
            bg: "bg-purple-50 border-purple-100",
            textColor: "text-purple-900"
        },
        {
            icon: <Tag className="w-5 h-5 text-orange-600" />,
            title: "Bundling Hemat",
            desc: "Hemat 300rb",
            bg: "bg-orange-50 border-orange-100",
            textColor: "text-orange-900"
        },
        {
            icon: <CreditCard className="w-5 h-5 text-green-600" />,
            title: "Cashback",
            desc: "Koin GoPay/OVO",
            bg: "bg-green-50 border-green-100",
            textColor: "text-green-900"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans w-full max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-100">
            {/* Top Bar / Header */}
            <div className="bg-primary pt-10 pb-16 px-5 rounded-b-[30px] shadow-lg relative overflow-hidden z-10 w-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>

                <div className="relative z-10 flex justify-between items-center mb-5">
                    <div>
                        <p className="text-pink-100 text-[10px] mb-0.5 uppercase tracking-wider font-bold">
                            {user ? 'Saldo Kamu' : 'Lokasi Kamu'}
                        </p>
                        <h1 className="text-lg font-black text-white flex items-center gap-1.5">
                            {user ? (
                                <>
                                    <CreditCard className="w-4 h-4" />
                                    Rp {new Intl.NumberFormat('id-ID').format(profile?.balance || 0)}
                                </>
                            ) : (
                                <>
                                    {locationName} <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </h1>
                    </div>
                    <button
                        onClick={toggleUserMenu}
                        className="p-2 bg-white/20 rounded-full backdrop-blur-sm relative hover:bg-white/30 transition-colors flex items-center gap-2 pr-4"
                    >
                        <div className="bg-white/20 p-1 rounded-full">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-bold text-white truncate max-w-[80px]">
                            {profile ? (profile.full_name?.split(' ')[0] || 'User') : 'Masuk'}
                        </span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-full px-4 py-2.5 flex items-center shadow-lg w-full">
                    <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Cari destinasi impian..."
                        className="w-full outline-none text-gray-700 text-sm font-medium placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Main Menu Grid - Floating overlap */}
            <div className="px-5 -mt-8 relative z-20 mb-4 w-full">
                <div className="bg-white rounded-2xl p-4 shadow-md grid grid-cols-3 gap-2 w-full">
                    {mainMenus.map((menu, idx) => {
                        const Content = (
                            <>
                                <div className={`${menu.color} w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/10 shrink-0`}>
                                    {menu.icon}
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{menu.label}</span>
                            </>
                        );

                        if (menu.link) {
                            return (
                                <Link key={idx} to={menu.link} className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
                                    {Content}
                                </Link>
                            )
                        }

                        return (
                            <div key={idx} onClick={menu.action} className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
                                {Content}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content Stream */}
            <div className="space-y-6 pt-0 w-full overflow-hidden">

                {/* Promo Banners - Mobile Optimized */}
                <div className="px-4 w-full">
                    <div className="relative rounded-xl overflow-hidden shadow-sm aspect-[2.8/1] w-full bg-gray-100">
                        {banners.map((banner, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentBanner ? 'opacity-100' : 'opacity-0'}`}
                            >
                                <img
                                    src={banner}
                                    alt={`Promo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                        {/* Dots */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {banners.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${index === currentBanner ? 'bg-white w-4' : 'bg-white/60 w-1.5'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Promo Cards (Horizontal Scroll) */}
                <div className="pl-4 w-full">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 px-1">Promo Spesial</h2>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1 -mx-1 snap-x w-full">
                        {promoOffers.map((offer, idx) => (
                            <div key={idx} className={`min-w-[140px] p-3 rounded-xl border ${offer.bg} snap-center flex flex-col shadow-sm cursor-pointer shrink-0`}>
                                <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm mb-2">
                                    {offer.icon}
                                </div>
                                <h3 className={`text-xs font-bold mb-1 ${offer.textColor}`}>{offer.title}</h3>
                                <p className="text-gray-500 text-[10px] leading-tight">{offer.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Popular Trips - CUSTOM 2 COLUMN GRID */}
                <div className="px-4 w-full">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h2 className="text-lg font-bold text-gray-900">Perjalanan Terpopuler</h2>
                        <Link to="/" className="text-primary text-xs font-bold">Lihat Semua</Link>
                    </div>
                    {/* The 2-column Grid */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                        {trips.map((trip) => (
                            <MobileTripCard key={trip.id} {...trip} />
                        ))}
                    </div>
                </div>

                {/* Blog */}
                <BlogSection />
            </div>

            {/* Profile Menu Overlay */}
            {isUserMenuOpen && (
                <div className="fixed inset-0 z-[100] animate-fadeIn">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsUserMenuOpen(false)}></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[30px] p-6 pb-10 shadow-2xl animate-slideUp max-w-md mx-auto">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                                <User className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">{profile?.full_name || 'User'}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="text-xs text-primary font-black uppercase tracking-tight">
                                        Saldo: Rp {new Intl.NumberFormat('id-ID').format(profile?.balance || 0)}
                                    </p>
                                </div>
                                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold uppercase">
                                    <Sparkles size={10} /> Akun Terverifikasi
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button onClick={() => { navigate('/mobile-tickets'); setIsUserMenuOpen(false); }} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-pink-50 transition-colors group">
                                <div className="flex items-center gap-3 font-bold text-sm text-gray-700 group-hover:text-primary">
                                    <Ticket size={20} className="text-gray-400 group-hover:text-primary" />
                                    Pesanan Saya
                                </div>
                                <ChevronRight size={18} className="text-gray-300" />
                            </button>

                            <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-pink-50 transition-colors group">
                                <div className="flex items-center gap-3 font-bold text-sm text-gray-700 group-hover:text-primary">
                                    <Heart size={20} className="text-gray-400 group-hover:text-primary" />
                                    Wishlist
                                </div>
                                <ChevronRight size={18} className="text-gray-300" />
                            </button>

                            <button onClick={() => { window.open('https://wa.me/6281382471642', '_blank'); setIsUserMenuOpen(false); }} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-pink-50 transition-colors group">
                                <div className="flex items-center gap-3 font-bold text-sm text-gray-700 group-hover:text-primary">
                                    <Headphones size={20} className="text-gray-400 group-hover:text-primary" />
                                    Pusat Bantuan
                                </div>
                                <ChevronRight size={18} className="text-gray-300" />
                            </button>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full mt-6 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                        >
                            Keluar Akun
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileAppMenu;
