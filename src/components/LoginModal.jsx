import React, { useState } from 'react';
import { X, Mail, Phone, MapPin, User, Lock, ArrowRight, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const PROVINCES = [
    "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", "Sumatera Selatan",
    "Bangka Belitung", "Bengkulu", "Lampung", "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah",
    "DI Yogyakarta", "Jawa Timur", "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat",
    "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara",
    "Sulawesi Barat", "Sulawesi Tengah", "Sulawesi Tenggara", "Sulawesi Selatan", "Gorontalo",
    "Maluku", "Maluku Utara", "Papua Barat", "Papua", "Papua Tengah", "Papua Pegunungan", "Papua Selatan", "Papua Barat Daya"
].sort();

const LoginModal = ({ isOpen, onClose, initialMode = 'login', alertMessage = null }) => {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState(initialMode); // 'login' | 'register'
    const [showPassword, setShowPassword] = useState(false);

    // Reset mode when isOpen changes to match initialMode preference if provided
    React.useEffect(() => {
        if (isOpen) setMode(initialMode);
    }, [isOpen, initialMode]);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [province, setProvince] = useState('');

    if (!isOpen) return null;

    const clearForm = () => {
        setEmail('');
        setPassword('');
        setFullName('');
        setWhatsapp('');
        setProvince('');
        setShowPassword(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;

            // Dispatch success event
            const eventCustom = new CustomEvent('show-toast', { detail: { message: 'Login Berhasil! Selamat datang.' } });
            window.dispatchEvent(eventCustom);

            onClose();
            clearForm();
        } catch (err) {
            console.error(err);
            alert("Gagal login: " + (err.message || "Email atau password salah."));
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Basic validation
        if (password.length < 6) {
            alert("Password minimal 6 karakter");
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        phone: whatsapp,
                        province: province,
                        whatsapp: whatsapp // Saving as metadata just in case
                    }
                }
            });

            if (error) throw error;

            if (data?.user?.identities?.length === 0) {
                alert('Email ini sudah terdaftar. Silakan login.');
                setMode('login');
            } else {
                alert('Registrasi Berhasil! Silakan cek email Anda untuk verifikasi (jika diaktifkan) atau langsung login.');
                // Automatically switch to login or close depending on flow. For now, switch to login.
                setMode('login');
                clearForm();
            }
        } catch (err) {
            console.error(err);
            alert("Gagal registrasi: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0,0,0,0.1);
                    border-radius: 20px;
                }
            `}</style>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 animate-[fadeIn_0.3s_ease-out]">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

                {/* Modal Content */}
                <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-3xl rounded-b-none sm:rounded-2xl shadow-2xl overflow-hidden relative transform transition-all animate-[slideUp_0.3s_ease-out] z-10 max-h-[90vh] flex flex-col">

                    {/* Header */}
                    <div className="bg-white p-6 pb-4 text-center relative border-b border-gray-100 flex-shrink-0">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors hidden sm:block"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                            {mode === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
                        </h2>
                        {alertMessage && (
                            <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg font-medium">
                                {alertMessage}
                            </div>
                        )}
                        {!alertMessage && (
                            <p className="text-sm text-gray-500">
                                {mode === 'login' ? 'Masuk untuk mengakses perjalanan impianmu' : 'Lengkapi data diri untuk pengalaman terbaik'}
                            </p>
                        )}
                    </div>

                    {/* Scrollable Body */}
                    <div className="p-6 pt-4 space-y-4 pb-10 sm:pb-6 overflow-y-auto custom-scrollbar">

                        {/* Tab Switcher */}
                        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                            <button
                                onClick={() => setMode('login')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Masuk
                            </button>
                            <button
                                onClick={() => setMode('register')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Daftar
                            </button>
                        </div>

                        {mode === 'login' ? (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Alamat Email"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-700 placeholder-gray-400"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Kata Sandi"
                                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-700 placeholder-gray-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-pink-700 transition-colors shadow-lg shadow-pink-500/30 disabled:bg-gray-300 flex items-center justify-center gap-2 mt-4"
                                >
                                    {loading ? 'Memproses...' : 'Masuk Sekarang'} <ArrowRight size={18} />
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-3">
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Nama Lengkap"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-700 placeholder-gray-400"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Alamat Email"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-700 placeholder-gray-400"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="tel"
                                            required
                                            value={whatsapp}
                                            onChange={(e) => setWhatsapp(e.target.value)}
                                            placeholder="Nomor WhatsApp (08xxx)"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-700 placeholder-gray-400"
                                        />
                                    </div>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select
                                            required
                                            value={province}
                                            onChange={(e) => setProvince(e.target.value)}
                                            className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-700 appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Pilih Asal Provinsi</option>
                                            {PROVINCES.map((prov, idx) => (
                                                <option key={idx} value={prov}>{prov}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={6}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Buat Kata Sandi (Min 6 Karakter)"
                                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-700 placeholder-gray-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-pink-700 transition-colors shadow-lg shadow-pink-500/30 disabled:bg-gray-300 flex items-center justify-center gap-2 mt-4"
                                >
                                    {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'} <ArrowRight size={18} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginModal;
