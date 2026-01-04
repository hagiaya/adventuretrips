import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    CheckCircle, XCircle, Search, Eye,
    User, Mail, Phone, Calendar,
    Shield, Loader, X, ExternalLink,
    AlertCircle, Clock
} from 'lucide-react';
import { sendWhatsApp } from '../../utils/whatsapp';

const KYCManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending'); // pending, verified, rejected
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchKYCList();
    }, []);

    const fetchKYCList = async () => {
        setLoading(true);
        try {
            // Fetch users with their pending withdrawals to show context
            const { data, error } = await supabase
                .from('profiles')
                .select('*, withdrawals(amount, status)')
                .not('kyc_status', 'is', null)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching KYC list:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId, targetPhone, fullName) => {
        // ... (existing code)
    };

    const handleReject = async (userId, targetPhone, fullName) => {
        // ... (existing code)
    };

    const filteredUsers = users.filter((u) => {
        // ... (existing code)
    });

    // ... (helper functions)

    // Helper to get pending withdrawal amount
    const getPendingWithdrawal = (user) => {
        if (!user.withdrawals || user.withdrawals.length === 0) return 0;
        return user.withdrawals
            .filter(w => w.status === 'pending')
            .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans">
            {/* ... (Header and Filters) ... */}

            {/* Content Area */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Kontak</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Identitas</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Penarikan</th> {/* Added Column */}
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {/* ... (Loading/Empty states) ... */}
                            {filteredUsers.map((u) => {
                                const pendingAmount = getPendingWithdrawal(u);
                                return (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {/* ... (User Column) ... */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600">
                                                    {u.full_name?.charAt(0) || u.email?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{u.full_name || 'Guest'}</div>
                                                    <div className="text-[10px] text-gray-400 font-medium">Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* ... (Contact Column) ... */}
                                            <div className="text-xs space-y-1">
                                                <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                                                    <Mail size={12} className="text-gray-400" /> {u.email}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                                                    <Phone size={12} className="text-gray-400" /> {u.phone || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs">
                                                <div className="font-black text-gray-900 uppercase tracking-tight">{u.kyc_full_name || u.full_name}</div>
                                                <div className="text-gray-500 font-mono mt-0.5">{u.kyc_id_number || 'NIK: -'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {pendingAmount > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
                                                    Rp {pendingAmount.toLocaleString('id-ID')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs font-medium">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(u.kyc_status)}`}>
                                                {u.kyc_status === 'pending' ? 'WAITING' : u.kyc_status === 'verified' ? 'APPROVED' : 'REJECTED'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => { setSelectedUser(u); setIsDetailModalOpen(true); }}
                                                className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-primary hover:text-white transition-all border border-gray-100"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* KYC Detail Modal */}
            {isDetailModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDetailModalOpen(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative animate-slideUp">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Detail Verifikasi</h2>
                                    <p className="text-gray-500 text-sm">Tinjau kesesuaian data identitas.</p>
                                </div>
                                <button onClick={() => setIsDetailModalOpen(false)} className="p-2 bg-gray-50 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Pending Withdrawal Alert in Detail */}
                            {getPendingWithdrawal(selectedUser) > 0 && (
                                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-orange-800 uppercase tracking-widest">Permintaan Penarikan Aktif</p>
                                        <p className="font-black text-gray-900">
                                            User ini sedang mengajukan penarikan sebesar <span className="text-orange-600">Rp {getPendingWithdrawal(selectedUser).toLocaleString('id-ID')}</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">

                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nama di Identitas</label>
                                        <p className="font-bold text-gray-900">{selectedUser.kyc_full_name}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">NIK / No Identitas</label>
                                        <p className="font-bold text-gray-900 font-mono tracking-wider">{selectedUser.kyc_id_number}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Waktu Submit</label>
                                        <p className="font-bold text-gray-900">{new Date(selectedUser.updated_at).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nomor Rekening</label>
                                        <p className="font-bold text-gray-900 font-mono tracking-wider">{selectedUser.kyc_bank_account || '-'}</p>
                                    </div>

                                    {/* Link to show pending withdrawal amount if exists */}
                                    {getPendingWithdrawal(selectedUser) > 0 && (
                                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                            <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">Total Penarikan (Pending)</label>
                                            <p className="font-black text-orange-600 text-lg">
                                                Rp {getPendingWithdrawal(selectedUser).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-100 rounded-2xl aspect-[1.6/1] overflow-hidden border border-gray-200 relative group">
                                        <img src={selectedUser.kyc_id_image} className="w-full h-full object-cover" alt="KTP" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <a href={selectedUser.kyc_id_image} target="_blank" rel="noreferrer" className="bg-white p-2 rounded-full shadow-lg">
                                                <ExternalLink size={20} className="text-gray-900" />
                                            </a>
                                        </div>
                                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[8px] font-bold rounded uppercase">Foto Identitas (KTP)</div>
                                    </div>
                                    <div className="bg-gray-100 rounded-2xl aspect-[1.6/1] overflow-hidden border border-gray-200 relative group">
                                        <img src={selectedUser.kyc_selfie_image} className="w-full h-full object-cover" alt="Selfie" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <a href={selectedUser.kyc_selfie_image} target="_blank" rel="noreferrer" className="bg-white p-2 rounded-full shadow-lg">
                                                <ExternalLink size={20} className="text-gray-900" />
                                            </a>
                                        </div>
                                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[8px] font-bold rounded uppercase">Foto Selfie + Identitas</div>
                                    </div>
                                </div>
                            </div>

                            {selectedUser.kyc_status === 'pending' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleReject(selectedUser.id, selectedUser.phone, selectedUser.full_name)}
                                        disabled={processingId === selectedUser.id}
                                        className="py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm border border-red-100 hover:bg-red-100 transition-all"
                                    >
                                        Tolak Pengajuan
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedUser.id, selectedUser.phone, selectedUser.full_name)}
                                        disabled={processingId === selectedUser.id}
                                        className="py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-pink-600 transition-all"
                                    >
                                        {processingId === selectedUser.id ? <Loader className="animate-spin inline" /> : 'Setujui Verifikasi'}
                                    </button>
                                </div>
                            ) : (
                                <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${selectedUser.kyc_status === 'verified' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                    }`}>
                                    {selectedUser.kyc_status === 'verified' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    <div>
                                        <p>Status: {selectedUser.kyc_status?.toUpperCase()}</p>
                                        {selectedUser.kyc_rejected_reason && <p className="text-xs opacity-80 mt-1 font-medium">Alasan: {selectedUser.kyc_rejected_reason}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KYCManagement;
