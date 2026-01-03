import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { approveWithdrawal, rejectWithdrawal } from '../../utils/withdrawals';
import {
    Clock, CheckCircle, XCircle, Search,
    ArrowRight, Library, CreditCard, User,
    AlertCircle, Filter, Download, MoreVertical,
    Check, X, Loader
} from 'lucide-react';

const WithdrawalManagement = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('withdrawals')
                .select('*, profiles(full_name, phone, email)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWithdrawals(data || []);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm("Konfirmasi bahwa Anda telah mentransfer uang ke rekening nasabah. Lanjutkan?")) return;

        setProcessingId(id);
        try {
            const result = await approveWithdrawal(id);
            if (result.success) {
                alert("Penarikan berhasil disetujui dan notifikasi WA terkirim.");
                fetchWithdrawals();
            } else {
                alert("Gagal: " + result.error);
            }
        } catch (err) {
            alert("Terjadi kesalahan.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        const note = window.prompt("Alasan penolakan? (Saldo akan dikembalikan ke user)");
        if (note === null) return;

        setProcessingId(id);
        try {
            const result = await rejectWithdrawal(id, note);
            if (result.success) {
                alert("Penarikan dibatalkan dan saldo dikembalikan ke user.");
                fetchWithdrawals();
            } else {
                alert("Gagal: " + result.error);
            }
        } catch (err) {
            alert("Terjadi kesalahan.");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredWithdrawals = withdrawals.filter(w => {
        const matchesSearch =
            w.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.account_number.includes(searchQuery) ||
            w.bank_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || w.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Penarikan</h1>
                    <p className="text-gray-500 font-medium">Verifikasi dan proses permintaan pencairan saldo user.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <Search className="w-5 h-5 text-gray-400 ml-2" />
                        <input
                            type="text"
                            placeholder="Cari User / Rekening..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium w-48 lg:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-50 p-3 rounded-2xl">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Menunggu</p>
                            <p className="text-2xl font-black text-gray-900">{withdrawals.filter(w => w.status === 'pending').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-50 p-3 rounded-2xl">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selesai</p>
                            <p className="text-2xl font-black text-gray-900">{withdrawals.filter(w => w.status === 'completed').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/5 p-3 rounded-2xl">
                            <Library className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Pencairan</p>
                            <p className="text-2xl font-black text-gray-900">
                                Rp {new Intl.NumberFormat('id-ID').format(withdrawals.filter(w => w.status === 'completed').reduce((acc, curr) => acc + Number(curr.amount), 0))}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'pending', 'completed', 'cancelled'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${statusFilter === f
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                            : 'bg-white text-gray-500 border-gray-100 hover:border-primary/30'
                            }`}
                    >
                        {f === 'all' ? 'Semua' : f === 'pending' ? 'Menunggu' : f === 'completed' ? 'Selesai' : 'Dibatalkan'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User / Tanggal</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Rekening Tujuan</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Jumlah</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader className="animate-spin text-primary" size={32} />
                                            <p className="text-gray-400 font-bold">Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredWithdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-gray-400 font-bold">
                                        Tidak ada data yang ditemukan.
                                    </td>
                                </tr>
                            ) : filteredWithdrawals.map((w) => (
                                <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center font-bold text-primary shrink-0">
                                                {w.profiles?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{w.profiles?.full_name || 'User'}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(w.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 inline-block">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Library size={14} className="text-gray-400" />
                                                <span className="text-[11px] font-black text-primary uppercase tracking-wider">{w.bank_name}</span>
                                            </div>
                                            <div className="font-mono text-sm font-bold text-gray-900 leading-none">{w.account_number}</div>
                                            <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tight">AN: {w.account_holder}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-gray-900">
                                            Rp {Number(w.amount).toLocaleString('id-ID')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(w.status)}`}>
                                            {w.status === 'pending' ? 'WAITING' : w.status === 'completed' ? 'PAID' : 'DECLINED'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {w.status === 'pending' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleApprove(w.id)}
                                                    disabled={processingId === w.id}
                                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all border border-green-200"
                                                    title="Konfirmasi Bayar"
                                                >
                                                    {processingId === w.id ? <Loader className="animate-spin" size={18} /> : <Check size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(w.id)}
                                                    disabled={processingId === w.id}
                                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-200"
                                                    title="Tolak"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-[10px] font-bold text-gray-400 italic">
                                                No Actions
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WithdrawalManagement;
