import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, MoreHorizontal, CheckCircle, XCircle, Clock, Loader, Eye, Image as ImageIcon, CreditCard, Shield, Trash2, CheckSquare, Square } from 'lucide-react';
import { format, parseISO, addDays, subDays, eachDayOfInterval, eachMonthOfInterval, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import emailjs from '@emailjs/browser';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

const TransactionManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'trip', 'private', 'stay', 'transport'
    const [viewTransaction, setViewTransaction] = useState(null);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [chartView, setChartView] = useState('day'); // 'day', 'month', 'year'
    const [chartData, setChartData] = useState([]);
    const [revenueStats, setRevenueStats] = useState({
        openTrip: 0,
        privateTrip: 0,
        accommodation: 0,
        transportation: 0,
        total: 0
    });
    const [isRefunding, setIsRefunding] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredTransactions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredTransactions.map(t => t.id));
        }
    };

    const toggleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Delete Handlers
    const handleDelete = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan.")) return;

        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Remove from local state
            setTransactions(prev => prev.filter(t => t.id !== id));
            setSelectedIds(prev => prev.filter(sid => sid !== id));
            alert("Transaksi berhasil dihapus.");
        } catch (error) {
            console.error("Error deleting transaction:", error);
            alert("Gagal menghapus transaksi: " + error.message);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} transaksi yang dipilih?`)) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .in('id', selectedIds);

            if (error) throw error;

            // Remove from local state
            setTransactions(prev => prev.filter(t => !selectedIds.includes(t.id)));
            setSelectedIds([]);
            alert("Transaksi terpilih berhasil dihapus.");
        } catch (error) {
            console.error("Error bulk deleting:", error);
            alert("Gagal menghapus beberapa transaksi: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // EMAILJS CONFIGURATION (HARAP DIISI)
    // 1. Login/Daftar di https://www.emailjs.com/ (Gratis)
    // 2. Add Service (pilih Gmail) -> Dapatkan SERVICE_ID
    // 3. Add Email Template -> Dapatkan TEMPLATE_ID
    //    - Buat template dengan variable: {{to_name}}, {{order_id}}, {{trip_title}}, {{amount}}, {{participants}}, {{link}}, {{status}}
    // 4. Account -> API Keys -> Dapatkan PUBLIC_KEY
    const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID_HERE";
    const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID_HERE";
    const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY_HERE";

    useEffect(() => {
        fetchTransactions();
    }, [chartView]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*, product:products(*)')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching transactions:', error.message);
            } else {
                setTransactions(data || []);
                processStatsAndChart(data || []);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const processStatsAndChart = (allTransactions) => {
        const confirmedTx = allTransactions.filter(t =>
            ['success', 'paid', 'confirmed', 'settlement'].includes(t.status?.toLowerCase())
        );

        // 1. Calculate Revenue Stats
        const stats = { openTrip: 0, privateTrip: 0, accommodation: 0, transportation: 0, total: 0 };

        confirmedTx.forEach(t => {
            const amount = Number(String(t.amount || 0).replace(/[^0-9]/g, ''));
            stats.total += amount;

            if (t.items?.toLowerCase().includes('private trip')) {
                stats.privateTrip += amount;
            } else if (t.product) {
                const features = t.product.features || {};
                let type = features.product_type;
                if (!type) {
                    if (['Hotel', 'Villa', 'Resort', 'Homestay', 'Glamping'].includes(t.product.category)) type = 'Accommodation';
                    else if (['MPV', 'SUV', 'Bus', 'Minibus', 'Luxury', 'Sewa Motor'].includes(t.product.category)) type = 'Transportation';
                    else type = 'Trip';
                }

                if (type === 'Trip') stats.openTrip += amount;
                else if (type === 'Accommodation') stats.accommodation += amount;
                else if (type === 'Transportation') stats.transportation += amount;
            } else {
                // Fallback attempt to categorize by items string
                const itemsStr = (t.items || '').toLowerCase();
                if (itemsStr.includes('trip') || itemsStr.includes('jalan')) stats.openTrip += amount;
                else if (itemsStr.includes('hotel') || itemsStr.includes('villa')) stats.accommodation += amount;
                else if (itemsStr.includes('sewa') || itemsStr.includes('mobil') || itemsStr.includes('motor')) stats.transportation += amount;
                else stats.openTrip += amount; // Final fallback
            }
        });
        setRevenueStats(stats);

        // 2. Process Chart Data (Historical Trend)
        let processedChartData = [];
        const now = new Date();

        if (chartView === 'day') {
            const days = eachDayOfInterval({ start: subDays(now, 6), end: now });
            processedChartData = days.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const val = confirmedTx
                    .filter(t => t.created_at && t.created_at.includes(dayStr))
                    .reduce((sum, t) => sum + Number(String(t.amount || 0).replace(/[^0-9]/g, '')), 0);
                return { label: format(day, 'dd MMM', { locale: id }), value: val };
            });
        } else if (chartView === 'month') {
            const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
            processedChartData = months.map(m => {
                const monthKey = format(m, 'yyyy-MM');
                const val = confirmedTx
                    .filter(t => t.created_at && t.created_at.includes(monthKey))
                    .reduce((sum, t) => sum + Number(String(t.amount || 0).replace(/[^0-9]/g, '')), 0);
                return { label: format(m, 'MMM yy', { locale: id }), value: val };
            });
        } else if (chartView === 'year') {
            const years = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()];
            processedChartData = years.map(yr => {
                const yearStr = String(yr);
                const val = confirmedTx
                    .filter(t => t.created_at && t.created_at.includes(yearStr))
                    .reduce((sum, t) => sum + Number(String(t.amount || 0).replace(/[^0-9]/g, '')), 0);
                return { label: yearStr, value: val };
            });
        }
        setChartData(processedChartData);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    const getTransactionType = (t) => {
        if (t.items?.toLowerCase().includes('private trip')) return { id: 'private', label: 'Private Trip', color: 'bg-indigo-100 text-indigo-700' };

        let type = 'trip';
        if (t.product) {
            const features = t.product.features || {};
            type = features.product_type?.toLowerCase() || '';
            if (!type) {
                if (['Hotel', 'Villa', 'Resort', 'Homestay', 'Glamping'].includes(t.product.category)) type = 'accommodation';
                else if (['MPV', 'SUV', 'Bus', 'Minibus', 'Luxury', 'Sewa Motor'].includes(t.product.category)) type = 'transportation';
                else type = 'trip';
            }
        } else {
            const itemsStr = (t.items || '').toLowerCase();
            if (itemsStr.includes('hotel') || itemsStr.includes('villa')) type = 'accommodation';
            else if (itemsStr.includes('sewa') || itemsStr.includes('mobil') || itemsStr.includes('motor')) type = 'transportation';
            else type = 'trip';
        }

        if (type.includes('accommodation') || type === 'stay') return { id: 'stay', label: 'Akomodasi', color: 'bg-emerald-100 text-emerald-700' };
        if (type.includes('transportation') || type === 'transport') return { id: 'transport', label: 'Transportasi', color: 'bg-amber-100 text-amber-700' };
        return { id: 'trip', label: 'Open Trip', color: 'bg-pink-100 text-pink-700' };
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'success': case 'paid': return 'bg-green-50 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'waiting_proof': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'verification_pending': return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-300';
            case 'cancelled':
            case 'cancel': case 'failed': return 'bg-red-50 text-red-700 border-red-200';
            case 'refunded': return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-300';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const handleExportExcel = () => {
        const dataToExport = filteredTransactions.map(t => ({
            'ID Invoice': t.id.substring(0, 8).toUpperCase(),
            'Tanggal': format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
            'Item': t.items || 'Booking',
            'Kategori': getTransactionType(t).label,
            'Customer ID': t.user_id,
            'Metode': t.payment_method || 'Midtrans',
            'Total': Number(t.amount),
            'Status': t.status?.toUpperCase()
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, `Laporan_Transaksi_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Laporan Transaksi Webtravel", 14, 15);
        doc.setFontSize(10);
        doc.text(`Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`, 14, 22);

        const tableColumn = ["Invoice", "Item", "Kategori", "Total", "Status", "Tanggal"];
        const tableRows = filteredTransactions.map(t => [
            t.id.substring(0, 8).toUpperCase(),
            t.items || 'Booking',
            getTransactionType(t).label,
            `Rp ${Number(t.amount).toLocaleString('id-ID')}`,
            t.status?.toUpperCase(),
            format(new Date(t.created_at), 'dd/MM/yy')
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'striped',
            headStyles: { fillColor: [236, 72, 153] }, // Primary pink color
        });

        doc.save(`Laporan_Transaksi_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    };

    const handleStatusUpdate = async (id, newStatus) => {
        const confirmMsg = newStatus === 'confirmed' ? "Konfirmasi pembayaran ini valid?" :
            newStatus === 'cancelled' ? "Tolak pembayaran ini?" :
                `Ubah status jadi ${newStatus}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const { error } = await supabase
                .from('transactions')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchTransactions();
            if (viewTransaction?.id === id) {
                setViewTransaction(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            alert('Gagal update status: ' + error.message);
        }
    };

    const handleRefundToBalance = async (transaction) => {
        if (!transaction.user_id) {
            alert("Gagal: User ID tidak ditemukan dalam transaksi ini.");
            return;
        }

        const refundAmount = Number(transaction.amount);
        const confirmMsg = `Refund Rp ${refundAmount.toLocaleString('id-ID')} ke saldo user ${transaction.user_id}?\n\nTransaksi akan ditandai sebagai 'REFUNDED'.`;

        if (!window.confirm(confirmMsg)) return;

        setIsRefunding(true);
        try {
            // 1. Get current balance
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', transaction.user_id)
                .single();

            if (profileError) throw profileError;

            const newBalance = (profile.balance || 0) + refundAmount;

            // 2. Update Balance
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', transaction.user_id);

            if (updateError) throw updateError;

            // 3. Update Transaction Status
            const { error: txError } = await supabase
                .from('transactions')
                .update({ status: 'refunded' })
                .eq('id', transaction.id);

            if (txError) throw txError;

            // 4. Log transaction
            await supabase.from('balance_transactions').insert({
                user_id: transaction.user_id,
                amount: refundAmount,
                type: 'credit',
                description: `Refund pembatalan pesanan #${transaction.id.substring(0, 8).toUpperCase()}`
            });

            alert(`Berhasil! Rp ${refundAmount.toLocaleString('id-ID')} telah ditambahkan ke saldo user.`);

            fetchTransactions();
            if (viewTransaction?.id === transaction.id) {
                setViewTransaction(prev => ({ ...prev, status: 'refunded' }));
            }
        } catch (error) {
            console.error("Refund error:", error);
            alert("Gagal melakukan refund: " + error.message);
        } finally {
            setIsRefunding(false);
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

        const typeInfo = getTransactionType(t);
        const matchesType = typeFilter === 'all' || typeInfo.id === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    return (
        <div className="space-y-6 relative">
            {/* Transaction Detail Modal */}
            {viewTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setViewTransaction(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>

                        {/* Left Side: Proof / Product Image */}
                        <div className="w-full md:w-1/3 bg-gray-100 flex items-center justify-center p-4 border-r border-gray-200 relative">
                            {viewTransaction.receipt_url ? (
                                <div className="space-y-2 w-full">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Bukti Transfer</p>
                                    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
                                        <img
                                            src={viewTransaction.receipt_url}
                                            alt="Proof"
                                            className="w-full h-auto object-contain max-h-[60vh]"
                                            onClick={() => window.open(viewTransaction.receipt_url, '_blank')}
                                        />
                                    </div>
                                    <a href={viewTransaction.receipt_url} target="_blank" rel="noreferrer" className="block text-center text-xs text-blue-600 hover:underline">
                                        Lihat Gambar Penuh
                                    </a>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Tidak ada bukti transfer</p>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Details */}
                        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Detail Transaksi</h2>
                                    <p className="text-sm text-gray-500 font-mono">#{viewTransaction.id}</p>
                                </div>
                                <button onClick={() => setViewTransaction(null)} className="text-gray-400 hover:text-gray-600">
                                    <XCircle size={28} />
                                </button>
                            </div>

                            {/* Verification Actions */}
                            {viewTransaction.status === 'verification_pending' && (
                                <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="text-blue-600" />
                                        <div>
                                            <p className="font-bold text-blue-900">Perlu Verifikasi</p>
                                            <p className="text-xs text-blue-700">Cek bukti transfer disamping sebelum konfirmasi.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate(viewTransaction.id, 'confirmed')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm shadow-md shadow-green-200"
                                        >
                                            Terima Valid
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(viewTransaction.id, 'cancelled')}
                                            className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-bold text-sm"
                                        >
                                            Tolak Invalid
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Status</label>
                                        <div className="mt-1">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewTransaction.status)} uppercase tracking-wider`}>
                                                {viewTransaction.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">No. Order</label>
                                        <p className="font-medium text-gray-900 mt-1 flex items-center gap-2">
                                            #{viewTransaction.id}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Tanggal Order</label>
                                        <p className="font-medium text-gray-900 mt-1">
                                            {new Date(viewTransaction.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Jadwal Trip</label>
                                        <p className="font-medium text-gray-900 mt-1">
                                            {(() => {
                                                if (!viewTransaction.date) return '-';

                                                const startDate = parseISO(viewTransaction.date);
                                                let durationDays = 1;
                                                // Try to get duration from product features or root
                                                const durationStr = viewTransaction.product?.features?.duration || viewTransaction.product?.duration || '';

                                                if (durationStr) {
                                                    const match = durationStr.toString().match(/(\d+)/);
                                                    if (match) durationDays = parseInt(match[0]);
                                                }

                                                const endDate = addDays(startDate, durationDays - 1);

                                                if (durationDays > 1) {
                                                    return `${format(startDate, 'dd MMM', { locale: id })} - ${format(endDate, 'dd MMM yyyy', { locale: id })}`;
                                                }
                                                return format(startDate, 'dd MMMM yyyy', { locale: id });
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Produk / Layanan yang Dipesan</label>
                                        <div className="flex items-start gap-4 mt-2">
                                            {viewTransaction.product?.image_url && (
                                                <img src={viewTransaction.product.image_url} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900 text-lg">{viewTransaction.product?.title || viewTransaction.items}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                    {viewTransaction.product?.category && (
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Filter size={12} /> {viewTransaction.product.category}
                                                        </span>
                                                    )}
                                                    {viewTransaction.product?.location && (
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <ImageIcon size={12} /> {viewTransaction.product.location}
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-bold text-primary">
                                                        {viewTransaction.items?.includes('(DP)') ? 'Down Payment (50%)' : 'Full Payment (100%)'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Participant List */}
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Data Peserta</label>
                                <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                                    {/* Handle JSONB array for participants */}
                                    {Array.isArray(viewTransaction.participants) && viewTransaction.participants.length > 0 ? (
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 w-10">#</th>
                                                    <th className="px-4 py-3">Nama Lengkap</th>
                                                    <th className="px-4 py-3">No. KTP</th>
                                                    <th className="px-4 py-3">Tgl Lahir</th>
                                                    <th className="px-4 py-3">Jenis Kelamin</th>
                                                    <th className="px-4 py-3">No. HP</th>
                                                    <th className="px-4 py-3">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {viewTransaction.participants.map((p, idx) => {
                                                    const pax = typeof p === 'string' ? { name: p } : p;
                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-gray-400 font-mono">{idx + 1}</td>
                                                            <td className="px-4 py-3 font-bold text-gray-900">{pax.name || '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600 font-mono">{pax.ktp || '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600">{pax.dob || '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600">{pax.gender || '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600">{pax.phone || '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600">{pax.email || '-'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 italic text-sm">
                                            Tidak ada data peserta rinci.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Rincian Harga</label>
                                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2 text-sm shadow-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Total Tagihan</span>
                                        <span className="font-bold text-gray-900">Rp {Number(viewTransaction.amount).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
                                        * Harga sudah termasuk layanan & pajak.
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Transaksi</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                            title="Export Excel"
                        >
                            <FileSpreadsheet size={16} /> Excel
                        </button>
                        <div className="w-px h-4 bg-gray-200 self-center mx-1"></div>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-md transition-all"
                            title="Export PDF"
                        >
                            <FileText size={16} /> PDF
                        </button>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Total Revenue: {formatCurrency(revenueStats.total)}</span>
                    <button onClick={fetchTransactions} className="text-primary hover:underline text-sm font-medium">Refresh Data</button>
                </div>
            </div>

            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Revenue Open Trip', value: revenueStats.openTrip, color: 'text-pink-600', bg: 'bg-pink-50' },
                    { label: 'Revenue Private Trip', value: revenueStats.privateTrip, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Revenue Akomodasi', value: revenueStats.accommodation, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Revenue Transportasi', value: revenueStats.transportation, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">{item.label}</p>
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(item.value)}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Historical Revenue Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Grafik Trend Pendapatan</h2>
                        <p className="text-sm text-gray-500">Berdasarkan seluruh transaksi sukses/confirmed</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                        {[
                            { key: 'day', label: 'Harian' },
                            { key: 'month', label: 'Bulanan' },
                            { key: 'year', label: 'Tahunan' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setChartView(tab.key)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${chartView === tab.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[300px] w-full overflow-hidden">
                    {chartData && chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg">
                                                    <p className="text-xs font-bold text-gray-400 mb-1">{payload[0].payload.label}</p>
                                                    <p className="text-sm font-bold text-primary">{formatCurrency(payload[0].value)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                            Belum ada data pendapatan untuk periode ini.
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Actions & Selection Info */}
            {selectedIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex justify-between items-center animate-fadeIn">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="text-blue-600" size={20} />
                        <span className="text-sm font-bold text-blue-800">{selectedIds.length} Transaksi Dipilih</span>
                    </div>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md"
                    >
                        <Trash2 size={16} /> Hapus Terpilih
                    </button>
                </div>
            )}

            {/* Status Filter Tabs */}
            <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Filter Status</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['all', 'pending', 'waiting_proof', 'verification_pending', 'confirmed', 'refunded', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${statusFilter === status
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {status === 'all' ? 'Semua Status' :
                                status === 'verification_pending' ? 'Butuh Verifikasi' :
                                    status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                            {status === 'verification_pending' && transactions.filter(t => t.status === 'verification_pending').length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {transactions.filter(t => t.status === 'verification_pending').length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Type Filter Tabs */}
            <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Filter Kategori</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {[
                        { id: 'all', label: 'Semua Produk' },
                        { id: 'trip', label: 'Open Trip' },
                        { id: 'private', label: 'Private Trip' },
                        { id: 'stay', label: 'Akomodasi' },
                        { id: 'transport', label: 'Transportasi' }
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => setTypeFilter(type.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${typeFilter === type.id
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari ID Invoice atau User ID..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-4">
                                    <div className="flex items-center">
                                        <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                                            {selectedIds.length > 0 && selectedIds.length === filteredTransactions.length ? (
                                                <CheckSquare size={20} className="text-primary" />
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </button>
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Invoice</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Item Info</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Kategori</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Metode</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Bukti</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader className="animate-spin" size={24} />
                                            <p>Memuat data transaksi...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Filter size={32} className="text-gray-300" />
                                            <p>Tidak ada transaksi yang cocok dengan filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <tr key={t.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedIds.includes(t.id) ? 'bg-blue-50/50' : ''}`} onClick={() => setViewTransaction(t)}>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => toggleSelectOne(t.id)} className="text-gray-400 hover:text-primary">
                                                {selectedIds.includes(t.id) ? (
                                                    <CheckSquare size={20} className="text-primary" />
                                                ) : (
                                                    <Square size={20} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs text-gray-500">#{t.id.slice(0, 8)}</span>
                                                <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col max-w-[200px]">
                                                <span className="font-medium text-gray-900 line-clamp-2 text-sm">{t.items || 'Trip Booking'}</span>
                                                <span className="text-xs text-gray-500 mt-0.5 truncate">{t.user_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const type = getTransactionType(t);
                                                return (
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${type.color}`}>
                                                        {type.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {t.payment_method || 'Midtrans'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">Rp {Number(t.amount).toLocaleString('id-ID')}</span>
                                                <span className="text-[10px] text-gray-400">Total</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(t.status)} uppercase tracking-wider`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.receipt_url ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setViewTransaction(t); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md transition-colors border border-gray-200"
                                                >
                                                    <ImageIcon size={14} /> Lihat
                                                </button>
                                            ) : (
                                                <span className="text-gray-300 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setViewTransaction(t)}
                                                    className="p-1.5 bg-white border border-gray-200 text-gray-600 rounded hover:bg-primary hover:text-white hover:border-primary transition-colors"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {t.status === 'verification_pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(t.id, 'confirmed')}
                                                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:text-green-700 transition-colors border border-green-200 tooltip-trigger"
                                                            title="Verifikasi Valid"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(t.id, 'cancelled')}
                                                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors border border-red-200"
                                                            title="Tolak / Tidak Valid"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                ) : t.status === 'pending' ? (
                                                    <button
                                                        onClick={() => handleStatusUpdate(t.id, 'confirmed')}
                                                        className="p-1.5 hover:bg-green-100 text-gray-400 hover:text-green-600 rounded transition-colors"
                                                        title="Mark as Paid"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                ) : ['success', 'paid', 'confirmed', 'settlement'].includes(t.status?.toLowerCase()) ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRefundToBalance(t); }}
                                                        className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
                                                        title="Refund ke Saldo"
                                                    >
                                                        <CreditCard size={18} />
                                                    </button>
                                                ) : (
                                                    <button className="p-1.5 text-gray-300 pointer-events-none">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                                    className="p-1.5 bg-white border border-gray-200 text-gray-400 rounded hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                                                    title="Hapus Transaksi"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransactionManagement;
