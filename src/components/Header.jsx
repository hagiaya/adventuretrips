import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, User, LogOut, CheckCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import WalletModal from './WalletModal';
import { Wallet } from 'lucide-react';

const Header = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [balance, setBalance] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [logoUrl, setLogoUrl] = useState('/logo.png');
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

    useEffect(() => {
        // Fetch Logo
        const fetchLogo = async () => {
            const { data } = await supabase
                .from('site_content')
                .select('content')
                .eq('key', 'site_logo')
                .single();
            if (data?.content) setLogoUrl(data.content);
        };
        fetchLogo();

        const fetchBalance = async (userId) => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('balance')
                    .eq('id', userId)
                    .single();
                if (data) setBalance(data.balance || 0);
            } catch (err) {
                console.error("Error fetching balance:", err);
            }
        };

        // Check local mock user first (for dev/demo)
        const mock = localStorage.getItem('mockUser');
        if (mock) {
            const parsedMock = JSON.parse(mock);
            setUser(parsedMock);
            if (parsedMock.id) fetchBalance(parsedMock.id);
        } else {
            // Check initial session
            supabase.auth.getSession().then(({ data: { session } }) => {
                const currentUser = session?.user;
                setUser(currentUser ?? null);
                if (currentUser) fetchBalance(currentUser.id);
            });
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user;
            setUser(currentUser ?? null);
            if (currentUser) fetchBalance(currentUser.id);
            else setBalance(0);
        });

        // Custom event for login toast
        const handleToast = (e) => {
            setToast({ show: true, message: e.detail.message });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
        };
        window.addEventListener('show-toast', handleToast);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('show-toast', handleToast);
        };
    }, []);

    const handleLogout = async () => {
        localStorage.removeItem('mockUser');
        await supabase.auth.signOut();
        setUser(null); // Ensure state clears
        setToast({ show: true, message: 'Logout Berhasil' });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
        // Reload to clear any persistent states if needed
        if (localStorage.getItem('mockUser')) window.location.reload();
    };

    const handleOpenAuth = (mode) => {
        const event = new CustomEvent('open-auth-modal', { detail: { mode } });
        window.dispatchEvent(event);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/trips?q=${encodeURIComponent(searchQuery)}`);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-white shadow-sm font-sans">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Logo */}
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <img src={logoUrl} alt="Adventure Trip" className="w-8 h-8 object-contain" />
                            <div className="text-2xl font-bold text-pink-500 tracking-tight">Adventure Trip</div>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-8 text-gray-600 font-medium text-sm">
                        <Link to="/" className="hover:text-primary transition-colors">Beranda</Link>
                        <Link to="/trips" className="hover:text-primary transition-colors">Open Trip</Link>
                        <Link to="/private-trip" className="hover:text-primary transition-colors">Private Trip</Link>
                        <Link to="/stay" className="hover:text-primary transition-colors">Akomodasi</Link>
                        <Link to="/transport" className="hover:text-primary transition-colors">Transportasi</Link>
                        <Link to="/tickets" className="hover:text-primary transition-colors">Ticket</Link>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <div className={`relative flex items-center transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-full max-w-[200px] lg:max-w-xs' : 'w-auto'}`}>
                            {isSearchOpen ? (
                                <form onSubmit={handleSearchSubmit} className="relative w-full">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari trip..."
                                        className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        autoFocus
                                        onBlur={() => {
                                            if (!searchQuery) setIsSearchOpen(false);
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-primary rounded-full text-white hover:bg-pink-600 transition-colors shadow-sm"
                                    >
                                        <Search className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSearchOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </form>
                            ) : (
                                <button
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                                    onClick={() => setIsSearchOpen(true)}
                                >
                                    <Search className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                                </button>
                            )}
                        </div>

                        {user ? (
                            <div className="hidden lg:flex items-center gap-3">
                                <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
                                    <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-primary font-bold">
                                        {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-bold text-gray-900 leading-none">
                                            {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                                        </span>
                                        <span className="text-[10px] font-bold text-primary mt-1 px-1.5 py-0.5 bg-pink-50 rounded">
                                            Rp {new Intl.NumberFormat('id-ID').format(balance)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsWalletModalOpen(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-primary text-white text-[11px] font-bold rounded-xl hover:bg-pink-600 transition-all shadow-md shadow-primary/20 hover:scale-105 active:scale-95 whitespace-nowrap"
                                >
                                    <Wallet size={14} />
                                    <span>Dompet</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    title="Keluar"
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="hidden lg:flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenAuth('login')}
                                    className="px-5 py-2 text-primary font-bold hover:bg-pink-50 rounded-lg transition-colors text-sm"
                                >
                                    Masuk
                                </button>
                                <button
                                    onClick={() => handleOpenAuth('register')}
                                    className="px-5 py-2 bg-primary text-white font-bold rounded-lg hover:bg-pink-700 transition-colors shadow-sm text-sm"
                                >
                                    Daftar
                                </button>
                            </div>
                        )}

                        <button
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[101] lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="fixed inset-y-0 right-0 w-[85%] max-w-[320px] bg-white shadow-2xl p-6 overflow-y-auto animate-slideInRight">
                        <div className="flex items-center justify-between mb-8">
                            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                                <span className="font-bold text-xl text-pink-500">Adventure Trip</span>
                            </Link>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Mobile Links */}
                        <nav className="flex flex-col gap-2 mb-8">
                            <Link
                                to="/"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl hover:bg-pink-50 text-gray-700 hover:text-primary font-medium transition-colors"
                            >
                                Beranda
                            </Link>
                            <Link
                                to="/trips"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl hover:bg-pink-50 text-gray-700 hover:text-primary font-medium transition-colors"
                            >
                                Open Trip
                            </Link>
                            <Link
                                to="/private-trip"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl hover:bg-pink-50 text-gray-700 hover:text-primary font-medium transition-colors"
                            >
                                Private Trip
                            </Link>
                            <Link
                                to="/stay"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl hover:bg-pink-50 text-gray-700 hover:text-primary font-medium transition-colors"
                            >
                                Akomodasi
                            </Link>
                            <Link
                                to="/transport"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl hover:bg-pink-50 text-gray-700 hover:text-primary font-medium transition-colors"
                            >
                                Transportasi
                            </Link>
                            <Link
                                to="/tickets"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl hover:bg-pink-50 text-gray-700 hover:text-primary font-medium transition-colors"
                            >
                                Ticket
                            </Link>
                        </nav>

                        {/* Mobile Auth */}
                        <div className="pt-6 border-t border-gray-100">
                            {user ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-4">
                                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-primary font-bold text-lg">
                                            {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{user.user_metadata?.full_name || 'User'}</div>
                                            <div className="text-[11px] font-bold text-primary mt-0.5">
                                                Saldo: Rp {new Intl.NumberFormat('id-ID').format(balance)}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Keluar
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            handleOpenAuth('login');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full py-3 text-primary font-bold border border-primary/20 hover:bg-pink-50 rounded-xl transition-colors"
                                    >
                                        Masuk
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleOpenAuth('register');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
                                    >
                                        Daftar Sekarang
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-24 right-4 z-[110] bg-white border border-green-100 shadow-xl rounded-xl p-4 flex items-center gap-3 animate-slideInLeft max-w-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Sukses</h4>
                        <p className="text-sm text-gray-500">{toast.message}</p>
                    </div>
                </div>
            )}
            {user && (
                <WalletModal
                    isOpen={isWalletModalOpen}
                    onClose={() => setIsWalletModalOpen(false)}
                    userId={user.id}
                    currentBalance={balance}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}
        </>
    );
};

export default Header;
