import React, { useState } from 'react';
import { Crown, Calendar, Users, MapPin, DollarSign, Send, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const PrivateTripPage = ({ isMobile }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        destination: '',
        pickup_point: '',
        start_date: '',
        duration: '',
        pax: '',
        budget_min: '',
        budget_max: '',
        special_requests: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get current user if logged in (optional)
            const { data: { session } } = await supabase.auth.getSession();
            const payload = {
                ...formData,
                user_id: session?.user?.id || null,
                duration: parseInt(formData.duration) || 0,
                pax: parseInt(formData.pax) || 0,
                budget_min: parseInt(formData.budget_min.replace(/[^0-9]/g, '')) || 0,
                budget_max: parseInt(formData.budget_max.replace(/[^0-9]/g, '')) || 0,
            };

            const { error } = await supabase.from('trip_requests').insert(payload);

            if (error) throw error;

            setSuccess(true);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('Error submitting private trip request:', error);
            alert('Gagal mengirim permintaan: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${isMobile ? 'pb-20' : 'pt-24'}`}>
                <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center animate-fadeIn">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Permintaan Terkirim!</h2>
                    <p className="text-gray-500 mb-6">
                        Tim kami akan segera menghubungi Anda melalui WhatsApp/Email untuk penawaran terbaik.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(isMobile ? '/mobilemenu' : '/')}
                            className="w-full bg-primary text-white py-3 rounded-xl font-bold"
                        >
                            Kembali ke Beranda
                        </button>
                        <button
                            onClick={() => {
                                setSuccess(false);
                                setFormData({
                                    full_name: '',
                                    phone: '',
                                    email: '',
                                    destination: '',
                                    pickup_point: '',
                                    start_date: '',
                                    duration: '',
                                    pax: '',
                                    budget_min: '',
                                    budget_max: '',
                                    special_requests: ''
                                });
                            }}
                            className="w-full text-primary font-bold py-3"
                        >
                            Buat Permintaan Baru
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-24 max-w-md mx-auto shadow-2xl border-x border-gray-100' : 'pt-24 pb-20'}`}>

            {/* Header */}
            {isMobile ? (
                <div className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 py-3 flex items-center gap-3 shadow-sm">
                    <Link to="/mobilemenu" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </Link>
                    <h1 className="font-bold text-md text-gray-900">Request Private Trip</h1>
                </div>
            ) : (
                <div className="container mx-auto px-4 mb-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-4">
                        <Crown className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Private Trip Services</h1>
                    <p className="text-gray-500 max-w-xl mx-auto">
                        Rencanakan liburan impian Anda dengan fleksibilitas penuh. Tentukan tujuan, waktu, dan budget Anda sendiri.
                    </p>
                </div>
            )}

            <div className={`container mx-auto px-4 ${!isMobile && 'max-w-3xl'}`}>
                {/* Intro Banner Card */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Crown className="w-6 h-6 text-yellow-300" />
                            <h2 className="text-lg font-bold">Kenapa Private Trip?</h2>
                        </div>
                        <ul className="text-sm space-y-1 opacity-90 pl-1">
                            <li className="flex items-center gap-2">✓ Jadwal Fleksibel (Bebas Pilih Tanggal)</li>
                            <li className="flex items-center gap-2">✓ Destinasi Suka-suka</li>
                            <li className="flex items-center gap-2">✓ Fasilitas Eksklusif (Mobil/Hotel Private)</li>
                            <li className="flex items-center gap-2">✓ Privasi Terjamin (Hanya Group Kamu)</li>
                        </ul>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                            <Users size={18} className="text-primary" /> Data Pemesan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    required
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                    placeholder="Contoh: Budi Santoso"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nomor WhatsApp</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                    placeholder="0812..."
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Email (Opsional)</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                placeholder="email@example.com"
                            />
                        </div>
                    </div>

                    {/* Trip Details */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                            <MapPin size={18} className="text-primary" /> Rencana Perjalanan
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Penjemputan & Pengantaran</label>
                            <input
                                type="text"
                                name="pickup_point"
                                required
                                value={formData.pickup_point}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                placeholder="Contoh: Cilegon - Serang"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Destinasi Tujuan</label>
                            <input
                                type="text"
                                name="destination"
                                required
                                value={formData.destination}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                placeholder="Contoh: Labuan Bajo, Bali, Jepang, dll"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal Mulai</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="start_date"
                                        required
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium pl-10"
                                    />
                                    <Calendar className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Durasi (Hari)</label>
                                <input
                                    type="number"
                                    name="duration"
                                    min="1"
                                    required
                                    value={formData.duration}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                    placeholder="3"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Jumlah Peserta (Pax)</label>
                            <input
                                type="number"
                                name="pax"
                                min="1"
                                required
                                value={formData.pax}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                placeholder="Total peserta..."
                            />
                        </div>
                    </div>

                    {/* Budget & Notes */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                            <DollarSign size={18} className="text-primary" /> Budget & Request
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Budget Min / Pax</label>
                                <input
                                    type="text"
                                    name="budget_min"
                                    value={formData.budget_min}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                    placeholder="Rp 2.000.000"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Budget Max / Pax</label>
                                <input
                                    type="text"
                                    name="budget_max"
                                    value={formData.budget_max}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                    placeholder="Rp 5.000.000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Catatan Tambahan</label>
                            <textarea
                                name="special_requests"
                                value={formData.special_requests}
                                onChange={handleChange}
                                rows="3"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                placeholder="Contoh: Saya ingin hotel bintang 4, ada anak kecil, makanan halal, dll..."
                            ></textarea>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? 'Mengirim...' : (
                            <>
                                <Send size={20} /> Kirim Permintaan
                            </>
                        )}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default PrivateTripPage;
