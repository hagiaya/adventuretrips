import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, User, Mail, Phone, Calendar, MoreHorizontal, Shield, Edit2, Trash2, CheckCircle, X } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ full_name: '', role: 'user', phone: '', balance: 0 });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("--- DEBUG CONNECTION START ---");

            // 1. Check Auth Session
            const { data: sessionData } = await supabase.auth.getSession();
            console.log("Current Session:", sessionData?.session ? "LOGGED IN" : "NOT LOGGED IN");
            console.log("User Email:", sessionData?.session?.user?.email);

            // 2. Query Profiles
            const res = await supabase.from('profiles').select('*');

            if (res.error) {
                console.error("Supabase Error Detail:", res.error);
                throw res.error;
            }

            console.log("Raw Data from Supabase:", res.data);
            console.log("Data Length:", res.data?.length);

            if (res.data?.length === 0) {
                console.warn("KONEKSI BERHASIL TAPI DATA KOSONG. Kemungkinan besar RLS (Row Level Security) masih aktif di Supabase dan memblokir akses anon.");
            }

            setUsers(res.data || []);
        } catch (err) {
            console.error('Debug Fetch Error:', err);
            setError(`${err.code || 'ERROR'}: ${err.message}`);
        } finally {
            setLoading(false);
            console.log("--- DEBUG CONNECTION END ---");
        }
    };

    const handleVerify = async (userId) => {
        if (!confirm('Verifikasi user ini secara manual?')) return;
        setProcessing(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_verified: true })
                .eq('id', userId);

            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, is_verified: true } : u));
            setActiveDropdown(null);
        } catch (error) {
            alert('Gagal verifikasi user: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Yakin ingin menghapus user ini? Data tidak dapat dikembalikan.')) return;
        setProcessing(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            setUsers(users.filter(u => u.id !== userId));
            setActiveDropdown(null);
        } catch (error) {
            alert('Gagal menghapus user: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setEditForm({
            full_name: user.full_name || '',
            role: user.role || 'user',
            phone: user.phone || '',
            balance: user.balance || 0
        });
        setShowEditModal(true);
        setActiveDropdown(null);
    };

    const handleEditSave = async () => {
        setProcessing(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editForm.full_name,
                    role: editForm.role,
                    phone: editForm.phone,
                    balance: parseFloat(editForm.balance) || 0
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
            setShowEditModal(false);
            setEditingUser(null);
        } catch (error) {
            alert('Gagal update user: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                <div className="overflow-x-visible">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">User</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Kontak</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Role</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Bergabung</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Saldo</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">Memuat data pengguna...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-red-500 font-medium">
                                        Gagal memuat data: {error}
                                        <button onClick={fetchUsers} className="ml-2 underline text-red-700">Coba Lagi</button>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        Tidak ada data pengguna ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 relative">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User size={20} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{user.full_name || 'Tanpa Nama'}</p>
                                                    <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail size={14} />
                                                    <span>{user.email}</span>
                                                </div>
                                                {user.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone size={14} />
                                                        <span>{user.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex w-fit items-center gap-1 ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                user.role === 'sales' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                    'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                <Shield size={12} />
                                                {user.role || 'User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_verified ? (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-100">
                                                    Unverified
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {new Date(user.created_at).toLocaleDateString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-primary text-sm">
                                            Rp {(user.balance || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeDropdown === user.id && (
                                                <div className="absolute right-8 top-8 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden text-left animate-fadeIn">
                                                    {!user.is_verified && (
                                                        <button
                                                            onClick={() => handleVerify(user.id)}
                                                            className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            <CheckCircle size={16} className="text-green-500" />
                                                            Verifikasi Manual
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Edit2 size={16} className="text-blue-500" />
                                                        Edit User
                                                    </button>
                                                    <div className="h-px bg-gray-100 my-0"></div>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={16} />
                                                        Hapus User
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-fadeIn">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900 mb-6">Edit User</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="+62..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role Akun</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="sales">Sales</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo User (Rp)</label>
                                <input
                                    type="number"
                                    value={editForm.balance}
                                    onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-primary"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Gunakan angka tanpa titik/koma (Contoh: 500000)</p>
                            </div>

                            <button
                                onClick={handleEditSave}
                                disabled={processing}
                                className="w-full bg-primary text-white py-2.5 rounded-lg font-bold hover:bg-pink-600 transition-colors mt-4 disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
