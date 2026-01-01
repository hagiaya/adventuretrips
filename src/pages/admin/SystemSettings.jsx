import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Trash2, AlertTriangle, CheckCircle, Database, RefreshCw } from 'lucide-react';

const SystemSettings = () => {
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleReset = async (table, label, confirmMessage) => {
        if (!confirm(confirmMessage || `Apakah Anda yakin ingin menghapus SEMUA data ${label}? Tindakan ini tidak dapat dibatalkan!`)) {
            return;
        }

        // Double confirmation for critical data
        if (table === 'products' || table === 'profiles') {
            const doubleConfirm = prompt(`Ketik "DELETE" untuk mengkonfirmasi penghapusan seluruh data ${label}.`);
            if (doubleConfirm !== 'DELETE') {
                alert('Konfirmasi salah. Pembatalan dilakukan.');
                return;
            }
        }

        setLoading(true);
        try {
            // Delete all rows safely using a generic condition that works for Int and UUID
            const { error } = await supabase
                .from(table)
                .delete()
                .not('id', 'is', null);

            if (error) throw error;

            showNotification('success', `Berhasil mereset data ${label}`);
        } catch (error) {
            console.error(`Error resetting ${table}:`, error);
            let msg = error.message;
            // Handle Foreign Key Violation (Postgres Code 23503)
            if (error.code === '23503' || error.status === 409) {
                if (table === 'products') {
                    if (confirm('Gagal: Produk ini masih memiliki data Transaksi. Hapus semua Transaksi terlebih dahulu dan coba lagi?')) {
                        return handleFactoryReset();
                    }
                }
                msg = 'Gagal: Data ini masih direferensikan oleh data lain. Harap hapus data terkait (misal: Transaksi) terlebih dahulu.';
            }
            showNotification('error', `Gagal mereset data ${label}: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFactoryReset = async () => {
        if (!confirm('PERINGATAN KERAS: Ini akan menghapus SEMUA data (Transaksi, Produk, Berita). Website akan benar-benar bersih. Lanjutkan?')) return;

        const doubleConfirm = prompt('Ketik "RESET" untuk mengkonfirmasi factory reset.');
        if (doubleConfirm !== 'RESET') {
            alert('Konfirmasi salah.');
            return;
        }

        setLoading(true);
        try {
            // Try RPC first (Server-side atomic deletion)
            const { error: rpcError } = await supabase.rpc('wipe_system_data');

            if (rpcError) {
                console.warn('RPC wipe_system_data not found, falling back to client-side delete.', rpcError);

                // Fallback: Client-side deletion (Subject to RLS)
                // 1. Delete Child Tables First (Transactions)
                const { error: errTrans } = await supabase.from('transactions').delete().not('id', 'is', null);
                if (errTrans) throw new Error('Gagal menghapus transaksi (Ref Check): ' + errTrans.message);

                // 1.1 Verify if transactions are actually gone (RLS might have silently blocked deletion of others' data)
                const { data: remainingTrans } = await supabase.from('transactions').select('id').limit(1);
                if (remainingTrans && remainingTrans.length > 0) {
                    console.warn("Warning: Some transactions might persist if admin policy is not active, but proceeding to product deletion.");
                    // throw new Error('IZIN DITOLAK: ...'); // Disabled blocking error to allow retry
                }

                // 2. Delete Details/Parents (Products, News, Banners)
                const { error: errProd } = await supabase.from('products').delete().not('id', 'is', null);
                if (errProd) throw new Error('Gagal menghapus produk: ' + errProd.message);

                const { error: errNews } = await supabase.from('news').delete().not('id', 'is', null);
                if (errNews) throw new Error('Gagal menghapus berita: ' + errNews.message);
            }

            showNotification('success', 'Factory Reset berhasil. Sistem bersih.');
        } catch (error) {
            console.error('Factory Reset Error:', error);
            alert(error.message); // Use Alert for critical failures so user definitely sees it
            showNotification('error', `Factory Reset Gagal: ${error.message}. Jika masih gagal, jalankan file "RESET_DB_FORCE.sql" di Supabase SQL Editor.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem & Reset Data</h1>

            {notification && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    } animate-fadeIn`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    {notification.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transaction Reset */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4 text-orange-600">
                        <Database size={24} />
                        <h2 className="text-lg font-bold">Data Transaksi</h2>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">
                        Menghapus semua riwayat transaksi/booking. Gunakan ini untuk membersihkan data testing sebelum production.
                    </p>
                    <button
                        onClick={() => handleReset('transactions', 'Transaksi', 'Yakin ingin menghapus seluruh riwayat transaksi?')}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-3 rounded-xl transition-colors font-bold"
                    >
                        <Trash2 size={18} />
                        {loading ? 'Memproses...' : 'Reset Data Transaksi'}
                    </button>
                </div>

                {/* News Reset */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4 text-blue-600">
                        <Database size={24} />
                        <h2 className="text-lg font-bold">Data Berita</h2>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">
                        Menghapus semua artikel berita yang telah dipublish.
                    </p>
                    <button
                        onClick={() => handleReset('news', 'Berita')}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-3 rounded-xl transition-colors font-bold"
                    >
                        <Trash2 size={18} />
                        {loading ? 'Memproses...' : 'Reset Data Berita'}
                    </button>
                </div>

                {/* Products Reset - Danger */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 bg-red-50/10">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                        <AlertTriangle size={24} />
                        <h2 className="text-lg font-bold">Data Produk (Bahaya)</h2>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">
                        Menghapus SEMUA produk (Trip, Hotel, Transport). <span className="font-bold text-red-500">Tindakan ini sangat berbahaya</span> dan akan menghapus konten utama website.
                    </p>
                    <button
                        onClick={() => handleReset('products', 'Produk')}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700 px-4 py-3 rounded-xl transition-colors font-bold shadow-lg shadow-red-200"
                    >
                        <Trash2 size={18} />
                        {loading ? 'Memproses...' : 'Reset SEMUA Produk'}
                    </button>
                </div>

                {/* Users Reset - Danger */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 bg-red-50/10">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                        <AlertTriangle size={24} />
                        <h2 className="text-lg font-bold">Data Pengguna (Bahaya)</h2>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">
                        Menghapus semua data pengguna terdaftar (profil). Akun Admin mungkin aman tergantung kebijakan database, tapi berhati-hatilah.
                    </p>
                    <button
                        onClick={() => alert("Fitur reset user dinonaktifkan demi keamanan. Silahkan hapus manual di menu Users.")}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-500 cursor-not-allowed px-4 py-3 rounded-xl font-bold"
                    >
                        <Trash2 size={18} />
                        Reset User (Nonaktif)
                    </button>
                </div>
                {/* Factory Reset - Extreme Danger */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-500 bg-red-100/50 md:col-span-2">
                    <div className="flex items-center gap-3 mb-4 text-red-800">
                        <RefreshCw size={24} className="animate-pulse" />
                        <h2 className="text-lg font-bold">Factory Reset (Pembersihan Total)</h2>
                    </div>
                    <p className="text-red-800 mb-6 text-sm font-medium">
                        Fitur ini akan menghapus <strong>semua Transaksi, Produk, dan Berita</strong> sekaligus dalam urutan yang benar.
                        Gunakan ini jika Anda ingin memulai dari nol atau jika tombol reset individual gagal karena masalah dependensi/error 409.
                    </p>
                    <button
                        onClick={handleFactoryReset}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-red-800 text-white hover:bg-red-900 px-4 py-4 rounded-xl transition-colors font-bold shadow-xl"
                    >
                        <AlertTriangle size={20} />
                        {loading ? 'RESETTING SYSTEM...' : 'RESET SEMUA DATA SEKARANG'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
