import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { approveWithdrawal, rejectWithdrawal } from '../../utils/withdrawals';
import {
    Clock, CheckCircle, XCircle, Search,
    ArrowRight, Library, CreditCard, User,
    AlertCircle, Filter, Download, MoreVertical,
    Check, X, Loader, Upload, Trash2
} from 'lucide-react';

const WithdrawalManagement = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    // New state for approval form
    const [approvalStep, setApprovalStep] = useState('detail'); // 'detail' or 'form'
    const [transactionNumber, setTransactionNumber] = useState('');
    const [proofImage, setProofImage] = useState(null);
    const [proofImagePreview, setProofImagePreview] = useState(null);

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            // Fetch withdrawals with profile info AND kyc details
            const { data, error } = await supabase
                .from('withdrawals')
                .select('*, profiles(full_name, phone, email, kyc_status, kyc_id_image, kyc_selfie_image)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWithdrawals(data || []);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProofImage(file);
            setProofImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadProof = async (file, withdrawalId) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `withdrawal-proof-${withdrawalId}-${Math.random()}.${fileExt}`;
        const filePath = `withdrawals/${fileName}`;

        // Reusing product-images for now, or use a new bucket if you prefer.
        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleApproveSubmit = async () => {
        if (!transactionNumber || !proofImage) {
            alert("Harap lengkapi nomor transaksi dan bukti transfer.");
            return;
        }

        if (!window.confirm("Konfirmasi transfer sudah dilakukan? Notifikasi WA akan dikirim ke user.")) return;

        setProcessingId(selectedWithdrawal.id);
        try {
            // 1. Upload Proof
            const proofUrl = await uploadProof(proofImage, selectedWithdrawal.id);

            // 2. Approve
            const result = await approveWithdrawal(selectedWithdrawal.id, transactionNumber, proofUrl);

            if (result.success) {
                alert("Penarikan berhasil disetujui, data tersimpan, dan notifikasi WA terkirim.");
                setIsActionModalOpen(false);
                fetchWithdrawals();
            } else {
                alert("Gagal: " + result.error);
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan saat upload atau update: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const openDeailModal = (withdrawal) => {
        setSelectedWithdrawal(withdrawal);
        setApprovalStep('detail'); // Reset to detail view
        setTransactionNumber('');
        setProofImage(null);
        setProofImagePreview(null);
        setIsActionModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus data penarikan ini? Data yang dihapus tidak dapat dikembalikan.')) return;
        setProcessingId(id);
        try {
            const { error } = await supabase.from('withdrawals').delete().eq('id', id);
            if (error) throw error;
            alert("Data penarikan berhasil dihapus.");
            fetchWithdrawals();
        } catch (err) {
            alert("Gagal menghapus data: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        setIsActionModalOpen(false); // Close detail modal if open
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

    // ... (filters and styles remain same)

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
            {/* ... (Header and Stats remain same) ... */}
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
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Detail KYC</th> {/* New Column */}
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Rekening Tujuan</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Jumlah</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader className="animate-spin text-primary" size={32} />
                                            <p className="text-gray-400 font-bold">Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredWithdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-400 font-bold">
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
                                        <button
                                            onClick={() => { setSelectedWithdrawal(w); setIsActionModalOpen(true); }}
                                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                        >
                                            <User size={14} /> Lihat Verifikasi
                                        </button>
                                        <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded border ${w.profiles?.kyc_status === 'verified' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                            {w.profiles?.kyc_status?.toUpperCase() || 'UNVERIFIED'}
                                        </span>
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
                                        <div className="flex items-center justify-end gap-2">
                                            {w.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => openDeailModal(w)}
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
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDelete(w.id)}
                                                disabled={processingId === w.id}
                                                className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-gray-200"
                                                title="Hapus Data"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail/Approval Modal */}
            {isActionModalOpen && selectedWithdrawal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsActionModalOpen(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative animate-slideUp">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">
                                        {approvalStep === 'detail' ? 'Detail Penarikan' : 'Konfirmasi Transfer'}
                                    </h2>
                                    <p className="text-gray-500 text-sm">
                                        {approvalStep === 'detail' ? 'Validasi data user sebelum transfer.' : 'Masukkan bukti transfer untuk user.'}
                                    </p>
                                </div>
                                <button onClick={() => setIsActionModalOpen(false)} className="p-2 bg-gray-50 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            {approvalStep === 'detail' ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">User Request</label>
                                                <p className="font-bold text-gray-900">{selectedWithdrawal.profiles?.full_name}</p>
                                                <p className="text-xs text-gray-500">{selectedWithdrawal.profiles?.email}</p>
                                            </div>
                                            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">Jumlah Transfer</label>
                                                <p className="text-2xl font-black text-orange-600">
                                                    Rp {Number(selectedWithdrawal.amount).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Rekening Tujuan</label>
                                                <div className="font-mono font-bold text-lg">{selectedWithdrawal.account_number}</div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs font-bold uppercase bg-white px-2 py-0.5 rounded border border-gray-200">{selectedWithdrawal.bank_name}</span>
                                                    <span className="text-xs text-gray-500 font-bold uppercase">AN: {selectedWithdrawal.account_holder}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Dokumen KYC User</label>
                                            {selectedWithdrawal.profiles?.kyc_id_image ? (
                                                <div className="bg-gray-100 rounded-2xl aspect-[1.6/1] overflow-hidden border border-gray-200 relative group">
                                                    <img src={selectedWithdrawal.profiles.kyc_id_image} className="w-full h-full object-cover" alt="KTP" />
                                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[8px] font-bold rounded uppercase">KTP</div>
                                                </div>
                                            ) : (
                                                <div className="h-24 bg-gray-50 rounded-2xl flex items-center justify-center text-xs text-gray-400 font-bold border-2 border-dashed border-gray-200">
                                                    Tidak ada foto KTP
                                                </div>
                                            )}

                                            {selectedWithdrawal.profiles?.kyc_selfie_image ? (
                                                <div className="bg-gray-100 rounded-2xl aspect-[1.6/1] overflow-hidden border border-gray-200 relative group">
                                                    <img src={selectedWithdrawal.profiles.kyc_selfie_image} className="w-full h-full object-cover" alt="Selfie" />
                                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[8px] font-bold rounded uppercase">Selfie</div>
                                                </div>
                                            ) : (
                                                <div className="h-24 bg-gray-50 rounded-2xl flex items-center justify-center text-xs text-gray-400 font-bold border-2 border-dashed border-gray-200">
                                                    Tidak ada foto Selfie
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedWithdrawal.status === 'pending' ? (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleReject(selectedWithdrawal.id)}
                                                className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100 hover:bg-red-100"
                                            >
                                                Tolak Permintaan
                                            </button>
                                            <button
                                                onClick={() => setApprovalStep('form')}
                                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700"
                                            >
                                                Proses Transfer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-gray-500 font-bold mb-2">Status: {selectedWithdrawal.status.toUpperCase()}</p>
                                            {selectedWithdrawal.transaction_number && (
                                                <p className="text-xs text-gray-400">No. TRX: {selectedWithdrawal.transaction_number}</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                // APPROVAL FORM STEP
                                <div className="space-y-4">
                                    <button onClick={() => setApprovalStep('detail')} className="mb-4 text-xs font-bold text-gray-400 hover:text-gray-900 flex items-center gap-1">
                                        &larr; Kembali ke Detail
                                    </button>

                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nomor Transaksi / Referensi Bank</label>
                                        <input
                                            type="text"
                                            value={transactionNumber}
                                            onChange={(e) => setTransactionNumber(e.target.value)}
                                            placeholder="Contoh: TRF-12345678"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Bukti Transfer (Resi)</label>
                                        <label className="relative block aspect-[3/1] bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all overflow-hidden group">
                                            {proofImagePreview ? (
                                                <img src={proofImagePreview} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                                    <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                                        <Upload size={20} className="text-primary" />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase">Upload Foto Resi</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </label>
                                    </div>

                                    <button
                                        onClick={handleApproveSubmit}
                                        disabled={processingId === selectedWithdrawal.id || !transactionNumber || !proofImage}
                                        className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-green-700 transition-all disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
                                    >
                                        {processingId === selectedWithdrawal.id ? <Loader className="animate-spin" size={18} /> : 'Konfirmasi & Kirim WA'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawalManagement;
