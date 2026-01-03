import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Radio, Receipt, LogOut, Menu, X, User, Image, Settings, Crown, ChevronDown, ChevronUp, Map, Home, Truck, Plus, MessageCircle, FileText, Library, ShieldCheck } from 'lucide-react';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProductMenuOpen, setIsProductMenuOpen] = useState(
        location.pathname.startsWith('/admin/products') ||
        location.pathname.startsWith('/admin/stays')
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    const menuItems = [
        { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/admin/content', icon: <FileText size={20} />, label: 'Manajemen Konten' },
        { path: '/admin/banners', icon: <Image size={20} />, label: 'Manajemen Banner' },
        { path: '/admin/popups', icon: <MessageCircle size={20} />, label: 'Manajemen Popup' },
        {
            label: 'Manajemen Produk',
            icon: <ShoppingBag size={20} />,
            isSub: true,
            isOpen: isProductMenuOpen,
            setOpen: setIsProductMenuOpen,
            activePath: '/admin/products', // Just a base for highlighting if needed, but safe to ignore for consolidated
            children: [
                { path: '/admin/products/trips', label: 'Open Trip', icon: <Map size={16} /> },
                { path: '/admin/products/transport', label: 'Transportasi', icon: <Truck size={16} /> },
                { path: '/admin/products/stays', label: 'Akomodasi', icon: <Home size={16} /> },
                { path: '/admin/stays/categories', label: 'Kategori Akomodasi', icon: <Plus size={16} /> },
            ]
        },
        { path: '/admin/news', icon: <Radio size={20} />, label: 'Manajemen Berita' },
        { path: '/admin/transactions', icon: <Receipt size={20} />, label: 'Manajemen Transaksi' },
        { path: '/admin/private-trips', icon: <Crown size={20} />, label: 'Private Trips' },
        { path: '/admin/users', icon: <User size={20} />, label: 'Manajemen Pengguna' },
        { path: '/admin/kyc', icon: <ShieldCheck size={20} />, label: 'Verifikasi KYC' },
        { path: '/admin/partners', icon: <Image size={20} />, label: 'Manajemen Partner' },
        { path: '/admin/withdrawals', icon: <Library size={20} />, label: 'Manajemen Penarikan' },
        { path: '/admin/payment-settings', icon: <Receipt size={20} />, label: 'Pengaturan Pembayaran' },
        { path: '/admin/settings', icon: <Settings size={20} />, label: 'Pengaturan Sistem' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                    <span className="text-xl font-bold text-primary">Admin Panel</span>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => (
                        <div key={item.label || item.path}>
                            {item.isSub ? (
                                <>
                                    <button
                                        onClick={() => item.setOpen(!item.isOpen)}
                                        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${(item.activePath && location.pathname.startsWith(item.activePath)) || (item.children && item.children.some(child => location.pathname.startsWith(child.path))) ? 'text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon}
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        {item.isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    {item.isOpen && (
                                        <div className="ml-4 pl-4 border-l border-gray-100 mt-1 space-y-1">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.path}
                                                    to={child.path}
                                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${location.pathname === child.path ? 'bg-pink-50 text-primary font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                                                >
                                                    {child.icon}
                                                    <span>{child.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-pink-50 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8 justify-between">
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-500 p-2 -ml-2">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-4 ml-auto">
                        <div className="text-sm text-right hidden md:block">
                            <p className="font-bold text-gray-900">Admin User</p>
                            <p className="text-xs text-gray-500">Super Admin</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                            {/* Placeholder Avatar */}
                            <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
