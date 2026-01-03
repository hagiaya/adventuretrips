import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Users, ShoppingBag, CreditCard, Radio, TrendingUp, Loader, ArrowRight, Image, Calendar as CalendarIcon, Filter, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const DashboardHome = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        users: 0,
        trips: 0,
        accommodations: 0,
        transportation: 0,
        revenueSuccess: 0,
        revenuePending: 0,
        revenueCanceled: 0,
        news: 0,
        promos: 0,
        privateTrips: 0
    });
    const [recentTransactions, setRecentTransactions] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Users
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            // 2. Fetch Products and categorize
            const { data: allProducts } = await supabase.from('products').select('category, features').eq('is_deleted', false);
            let tripCount = 0;
            let accomCount = 0;
            let transportCount = 0;

            allProducts?.forEach(p => {
                const features = p.features || {};
                let type = features.product_type;
                if (!type) {
                    if (['Hotel', 'Villa', 'Resort', 'Homestay', 'Glamping'].includes(p.category)) type = 'Accommodation';
                    else if (['MPV', 'SUV', 'Bus', 'Minibus', 'Luxury', 'Sewa Motor'].includes(p.category)) type = 'Transportation';
                    else type = 'Trip';
                }
                if (type === 'Trip') tripCount++;
                else if (type === 'Accommodation') accomCount++;
                else if (type === 'Transportation') transportCount++;
            });

            // 3. Fetch News
            const { count: newsCount } = await supabase.from('news').select('*', { count: 'exact', head: true });

            // 4. Fetch Promos (Banners)
            const { count: promoCount } = await supabase.from('banners').select('*', { count: 'exact', head: true });

            // 5. Fetch Private Trips
            let ptCount = 0;
            try {
                const { count, error: ptError } = await supabase.from('trip_requests').select('*', { count: 'exact', head: true });
                if (!ptError) ptCount = count || 0;
            } catch (e) {
                console.warn('trip_requests table might not exist yet');
            }

            // 6. Fetch Revenue (Success, Pending, Canceled)
            const { data: transactions } = await supabase.from('transactions').select('amount, status');

            let revSuccess = 0;
            let revPending = 0;
            let revCanceled = 0;

            transactions?.forEach(curr => {
                const amountStr = String(curr.amount || '0').replace(/[^0-9]/g, '');
                const amount = Number(amountStr);
                const status = curr.status?.toLowerCase();

                if (['success', 'paid', 'settlement', 'confirmed'].includes(status)) {
                    revSuccess += amount;
                } else if (['pending', 'waiting_proof', 'waiting', 'capture'].includes(status)) {
                    revPending += amount;
                } else if (['cancelled', 'expired', 'deny', 'cancel'].includes(status)) {
                    revCanceled += amount;
                }
            });

            setStats({
                users: userCount || 0,
                trips: tripCount,
                accommodations: accomCount,
                transportation: transportCount,
                revenueSuccess: revSuccess,
                revenuePending: revPending,
                revenueCanceled: revCanceled,
                news: newsCount || 0,
                promos: promoCount || 0,
                privateTrips: ptCount || 0
            });

            // 8. Fetch Recent Activity
            const { data: recent } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentTransactions(recent || []);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    const statCards = [
        {
            label: 'Total Pengguna',
            value: stats.users,
            icon: <Users className="text-blue-600" />,
            bg: 'bg-blue-50',
            description: 'User terdaftar'
        },
        {
            label: 'Total Trip',
            value: stats.trips,
            icon: <ShoppingBag className="text-pink-600" />,
            bg: 'bg-pink-50',
            description: 'Paket Open Trip'
        },
        {
            label: 'Total Akomodasi',
            value: stats.accommodations,
            icon: <TrendingUp className="text-purple-600" />,
            bg: 'bg-purple-50',
            description: 'Hotel/Villa'
        },
        {
            label: 'Total Transportasi',
            value: stats.transportation,
            icon: <Car className="text-amber-600" />,
            bg: 'bg-amber-50',
            description: 'Unit Kendaraan'
        },
        {
            label: 'Private Trips',
            value: stats.privateTrips,
            icon: <TrendingUp className="text-indigo-600" />,
            bg: 'bg-indigo-50',
            description: 'Request custom'
        },
        {
            label: 'Pendapatan Sukses',
            value: formatCurrency(stats.revenueSuccess),
            icon: <CreditCard className="text-green-600" />,
            bg: 'bg-green-50',
            description: 'Paid/Success'
        },
        {
            label: 'Pendapatan Pending',
            value: formatCurrency(stats.revenuePending),
            icon: <CreditCard className="text-amber-600" />,
            bg: 'bg-amber-50',
            description: 'Menunggu bayar'
        },
        {
            label: 'Pendapatan Canceled',
            value: formatCurrency(stats.revenueCanceled),
            icon: <CreditCard className="text-red-600" />,
            bg: 'bg-red-50',
            description: 'Gagal/Expired'
        }
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader className="animate-spin text-primary" size={40} />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {statCards.map((stat, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform`}>
                                        {stat.icon}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {stat.description}
                                    </span>
                                </div>
                                <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                                <p className={`text-xl font-bold text-gray-900 mt-1 ${stat.label.includes('Pendapatan') ? 'truncate' : ''}`}>
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h2>
                            <Link to="/admin/transactions" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                                Lihat Semua <ArrowRight size={16} />
                            </Link>
                        </div>

                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                Belum ada data transaksi terbaru.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {recentTransactions.map((t) => (
                                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                INV
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">Invoice #{t.id.slice(0, 8)}</p>
                                                <p className="text-xs text-gray-500">
                                                    {t.user_id || 'User Guest'} • {new Date(t.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 text-sm">
                                                Rp {Number(t.amount).toLocaleString('id-ID')}
                                            </p>
                                            <p className={`text-xs font-bold ${['success', 'paid', 'settlement', 'confirmed'].includes(t.status) ? 'text-green-600' :
                                                ['pending', 'waiting_proof', 'waiting', 'capture'].includes(t.status) ? 'text-yellow-600' :
                                                    'text-red-600'
                                                }`}>
                                                {t.status?.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardHome;
