import React, { useState } from 'react';
import { X, Library, CreditCard, AlertCircle, CheckCircle, Loader, ArrowRight, Wallet } from 'lucide-react';
import { requestWithdrawal } from '../utils/withdrawals';
import { supabase } from '../lib/supabaseClient';
import KYCModal from './KYCModal';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

const WalletModal = ({ isOpen, onClose, userId, currentBalance, onSuccess }) => {
    const [mode, setMode] = useState('menu'); // 'menu', 'topup', 'withdraw', 'success'
    const [amount, setAmount] = useState('');
    const [bankData, setBankData] = useState({
        bank_name: '',
        account_number: '',
        account_holder: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [kycStatus, setKycStatus] = useState(null); // 'verified', 'pending', 'rejected', or null
    const [showKYCModal, setShowKYCModal] = useState(false);

    React.useEffect(() => {
        if (isOpen && userId) {
            fetchKycStatus();
        }
    }, [isOpen, userId]);

    const fetchKycStatus = async () => {
        const { data } = await supabase.from('profiles').select('kyc_status').eq('id', userId).single();
        setKycStatus(data?.kyc_status);
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        setError(null);

        const withdrawalAmount = parseFloat(amount);
        if (isNaN(withdrawalAmount) || withdrawalAmount < 10000) {
            setError("Minimal penarikan adalah Rp 10.000");
            return;
        }

        if (withdrawalAmount > currentBalance) {
            setError("Saldo tidak mencukupi.");
            return;
        }

        if (!bankData.bank_name || !bankData.account_number || !bankData.account_holder) {
            setError("Harap lengkapi data rekening.");
            return;
        }

        setLoading(true);
        try {
            const result = await requestWithdrawal(userId, withdrawalAmount, bankData);
            if (result.success) {
                setMode('success');
                if (onSuccess) onSuccess();
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async () => {
        setError(null);
        const topupAmount = parseFloat(amount);
        if (isNaN(topupAmount) || topupAmount < 10000) {
            setError("Minimal top up adalah Rp 10.000");
            return;
        }

        setLoading(true);
        try {
            // Get Midtrans Keys from settings
            const { data: settings } = await supabase.from('payment_settings').select('*').single();
            const serverKey = settings.mode === 'sandbox' ? settings.sandbox_server_key : settings.prod_server_key;

            // Create a pseudo-transaction for the top up
            const orderId = `TOPUP-${Date.now()}`;

            // In a real Midtrans integration, this would call your backend to get Snap Token.
            // For now, we simulate by showing manual instructions or opening Midtrans if configured.
            // Since this is a frontend-only edit without new server endpoints:

            alert("Sistem Top Up Midtrans sedang disiapkan. Sementara gunakan bank transfer dan konfirmasi ke admin.");
            window.open('https://wa.me/6281818433490?text=' + encodeURIComponent(`Halo Admin, saya ingin Top Up saldo sebesar Rp ${topupAmount.toLocaleString('id-ID')}`), '_blank');
            onClose();
        } catch (err) {
            setError("Gagal memproses top up.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderContent = () => {
        switch (mode) {
            case 'menu':
                return (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">Dompet Saya</h2>
                            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="bg-gradient-to-br from-primary to-pink-600 rounded-3xl p-6 mb-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Saldo Tersedia</p>
                            <h3 className="text-3xl font-black">Rp {new Intl.NumberFormat('id-ID').format(currentBalance)}</h3>
                            <Wallet className="absolute bottom-4 right-4 opacity-20 w-12 h-12" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => { setMode('topup'); setAmount(''); }}
                                className="flex flex-col items-center gap-3 p-5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all group"
                            >
                                <div className="bg-white p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-black">Top Up</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (kycStatus === 'verified') {
                                        setMode('withdraw');
                                        setAmount('');
                                    } else {
                                        setShowKYCModal(true);
                                    }
                                }}
                                className="flex flex-col items-center gap-3 p-5 bg-green-50 text-green-700 rounded-2xl border border-green-100 hover:bg-green-100 transition-all group"
                            >
                                <div className="bg-white p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform relative">
                                    <Library className="w-6 h-6" />
                                    {kycStatus !== 'verified' && (
                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border-2 border-white">
                                            <ShieldAlert size={8} />
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-black">Tarik Saldo</span>
                                {kycStatus !== 'verified' && kycStatus !== 'pending' && (
                                    <span className="text-[9px] font-bold text-red-500 opacity-80 -mt-2">Perlu KYC</span>
                                )}
                                {kycStatus === 'pending' && (
                                    <span className="text-[9px] font-bold text-yellow-600 opacity-80 -mt-2">KYC Diproses</span>
                                )}
                            </button>
                        </div>
                    </div>
                );

            case 'topup':
                return (
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setMode('menu')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <Library size={18} className="rotate-180" />
                            </button>
                            <h2 className="text-xl font-black text-gray-900">Isi Saldo</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Jumlah Top Up</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Min. 10.000"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-gray-900 text-lg"
                                    />
                                </div>
                            </div>

                            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </div>}

                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-[10px] text-blue-700 font-bold uppercase mb-2">Pilih Nominal Cepat</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {['50000', '100000', '500000'].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setAmount(val)}
                                            className="py-2 bg-white rounded-lg text-xs font-bold text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"
                                        >
                                            {parseInt(val) / 1000}k
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleTopUp}
                                disabled={loading || !amount}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-pink-600 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader className="animate-spin" size={18} /> : 'Lanjut Pembayaran'}
                            </button>
                        </div>
                    </div>
                );

            case 'withdraw':
                return (
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setMode('menu')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <Library size={18} className="rotate-180" />
                            </button>
                            <h2 className="text-xl font-black text-gray-900">Tarik Saldo</h2>
                        </div>

                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Jumlah Tarik</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-gray-900"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Bank / E-Wallet (BCA, OVO, dll)"
                                    value={bankData.bank_name}
                                    onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-medium"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Nomor Rekening / HP"
                                    value={bankData.account_number}
                                    onChange={(e) => setBankData({ ...bankData, account_number: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold font-mono"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Atas Nama"
                                    value={bankData.account_holder}
                                    onChange={(e) => setBankData({ ...bankData, account_holder: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-medium"
                                    required
                                />
                            </div>

                            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </div>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-pink-600 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader className="animate-spin" size={18} /> : 'Ajukan Penarikan'}
                            </button>
                        </form>
                    </div>
                );

            case 'success':
                return (
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Berhasil!</h2>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            Permintaan penarikan saldo kamu sedang diproses, mohon tunggu 1x24 jam.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-gray-800 transition-all"
                        >
                            Oke, Mengerti
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl relative animate-slideUp">
                {renderContent()}
            </div>

            <KYCModal
                isOpen={showKYCModal}
                onClose={() => setShowKYCModal(false)}
                userId={userId}
                onSuccess={() => {
                    fetchKycStatus();
                    setShowKYCModal(false);
                }}
            />
        </div>
    );
};

export default WalletModal;
