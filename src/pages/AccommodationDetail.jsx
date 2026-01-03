import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Calendar, Wifi, CheckCircle, Info, Share2, Heart, ArrowLeft, ShieldCheck, Award, Loader, Eye, ArrowRight, User, Coffee, Wind, Car } from 'lucide-react';
import { useTrip } from '../hooks/useTrips';
import { supabase } from '../lib/supabaseClient';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import StayCalendar from '../components/StayCalendar';

const AccommodationDetail = ({ mobileMode = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { trip: hotel, loading } = useTrip(id);
    const [activeTab, setActiveTab] = useState('deskripsi');
    const [selectedImage, setSelectedImage] = useState(0);

    // Booking State
    const [rooms, setRooms] = useState(1);
    const [nightDuration, setNightDuration] = useState(1);
    const [checkInDate, setCheckInDate] = useState('');
    const [paymentType, setPaymentType] = useState('full'); // 'full' or 'dp'
    const [customerData, setCustomerData] = useState({
        name: '',
        phone: '',
        email: ''
    });

    // UI State
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [viewCount, setViewCount] = useState(0);

    // Payment State
    const [currentTransactionId, setCurrentTransactionId] = useState(null);
    const [paymentSettings, setPaymentSettings] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [userBalance, setUserBalance] = useState(0);
    const [userProfile, setUserProfile] = useState(null);

    // Fetch Payment Settings and Balance
    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: settings } = await supabase.from('payment_settings').select('*').single();
            if (settings) setPaymentSettings(settings);

            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (profile) {
                    setUserProfile(profile);
                    setUserBalance(profile.balance || 0);
                }
            }
        };
        fetchInitialData();
    }, []);

    // Effect for Views
    useEffect(() => {
        if (hotel) setViewCount(hotel.views_count || 0);
    }, [hotel]);

    useEffect(() => {
        const incrementView = async () => {
            if (hotel?.id) {
                await supabase.rpc('increment_product_view', { p_id: hotel.id });
                setViewCount(prev => prev + 1);
            }
        };
        if (hotel?.id) incrementView();
    }, [hotel?.id]);

    // Helper Calculation
    const getBasePrice = () => {
        if (!hotel) return 0;
        const baseRate = parseInt((hotel.price || '').toString().replace(/[^0-9]/g, '')) || 0;
        if (!checkInDate) return baseRate * rooms * nightDuration;

        let total = 0;
        try {
            const startDate = parseISO(checkInDate);
            const safeSchedules = Array.isArray(hotel.schedules) ? hotel.schedules : [];

            for (let i = 0; i < nightDuration; i++) {
                const currentDate = format(addDays(startDate, i), 'yyyy-MM-dd');
                const schedule = safeSchedules.find(s => s.date === currentDate);
                let dayPrice = baseRate;
                if (schedule && schedule.price) {
                    dayPrice = parseInt(schedule.price.toString().replace(/[^0-9]/g, '')) || baseRate;
                }
                total += dayPrice;
            }
        } catch (e) { return baseRate * rooms * nightDuration; }
        return total * rooms;
    };

    const handleBooking = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            const event = new CustomEvent('open-auth-modal', {
                detail: { mode: 'login', alertMessage: 'Silakan login untuk memesan' }
            });
            window.dispatchEvent(event);
            return;
        }

        if (!checkInDate) {
            alert("Silakan pilih tanggal Check-in");
            return;
        }

        if (!customerData.name || !customerData.phone || !customerData.email) {
            alert("Mohon lengkapi data pemesan (Nama, No HP/WA, dan Email)");
            return;
        }

        setIsProcessing(true);
        try {
            const userId = session?.user?.id;
            const basePrice = getBasePrice();
            const taxPercentage = paymentSettings?.tax_percentage || 0;
            const taxAmount = Math.round(basePrice * (taxPercentage / 100));
            const totalPrice = basePrice + taxAmount;

            const finalAmount = paymentType === 'dp' ? Math.round(totalPrice * 0.5) : totalPrice;

            const checkOut = format(addDays(new Date(checkInDate), nightDuration), 'yyyy-MM-dd');
            // Simplified item description
            const itemDesc = `${hotel.title} (${hotel.category})\nCheck-in: ${checkInDate}\nCheck-out: ${checkOut}\n${rooms} Kamar x ${nightDuration} Malam\nPemesan: ${customerData.name}`;

            const { data: transaction, error } = await supabase.from('transactions').insert({
                product_id: hotel.id,
                user_id: userId,
                amount: finalAmount,
                status: 'pending',
                items: itemDesc,
                payment_method: 'Pending Choice',
                metadata: {
                    type: 'stay',
                    customer_name: customerData.name,
                    customer_phone: customerData.phone,
                    customer_email: customerData.email,
                    check_in: checkInDate,
                    night_duration: nightDuration,
                    rooms: rooms,
                    base_price: basePrice,
                    tax_amount: taxAmount,
                    total_price: totalPrice,
                    is_dp: paymentType === 'dp'
                }
            }).select().single();

            if (error) throw error;
            setCurrentTransactionId(transaction.id);
            setShowPaymentModal(true);

        } catch (err) {
            console.error("Booking Error:", err);
            alert("Gagal memproses pemesanan: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayWithBalance = async () => {
        const basePrice = getBasePrice();
        const taxPercentage = paymentSettings?.tax_percentage || 0;
        const taxAmount = Math.round(basePrice * (taxPercentage / 100));
        const totalPrice = basePrice + taxAmount;
        const amountToPay = paymentType === 'dp' ? Math.round(totalPrice * 0.5) : totalPrice;

        if (userBalance < amountToPay) {
            alert("Saldo tidak cukup.");
            return;
        }

        if (!window.confirm(`Konfirmasi pembayaran Rp ${amountToPay.toLocaleString('id-ID')} menggunakan Saldo?`)) return;

        setIsProcessing(true);
        try {
            const { error: balanceErr } = await supabase.from('profiles').update({ balance: userBalance - amountToPay }).eq('id', userProfile.id);
            if (balanceErr) throw balanceErr;

            const { error: txErr } = await supabase.from('transactions').update({
                status: 'success',
                payment_method: 'Saldo Dompet'
            }).eq('id', currentTransactionId);
            if (txErr) throw txErr;

            await supabase.from('balance_transactions').insert({
                user_id: userProfile.id,
                amount: -amountToPay,
                type: 'debit',
                description: `Pembayaran ${hotel.title} #${currentTransactionId.substring(0, 8).toUpperCase()}`
            });

            setUserBalance(prev => prev - amountToPay);
            navigate(`/payment-success/${currentTransactionId}?mobile=${mobileMode}`);
        } catch (e) {
            alert("Gagal: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualPayment = async () => {
        setIsProcessing(true);
        try {
            await supabase.from('transactions').update({
                status: 'waiting_proof',
                payment_method: 'Manual Transfer'
            }).eq('id', currentTransactionId);
            navigate(`/payment-success/${currentTransactionId}?mobile=${mobileMode}`);
        } catch (e) {
            alert("Gagal: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!hotel) return <div className="min-h-screen flex items-center justify-center">Hotel Not Found</div>;

    const { title, location, gallery, description, price, features, schedules, category, organizer, terms } = hotel;
    const images = (gallery && gallery.length > 0) ? gallery : (hotel.image_url ? [hotel.image_url] : []);
    const currentPriceStr = (price || '').toString().replace(/[^0-9]/g, '');
    const currentPrice = parseInt(currentPriceStr) || 0;

    // Safety check for facilities
    const facilities = (Array.isArray(features?.facilities) ? features.facilities : [])
        || (Array.isArray(hotel.facilities) ? hotel.facilities : []);

    // Handle terms safely (could be string or array)
    let policies = [];
    if (Array.isArray(terms)) {
        policies = terms;
    } else if (typeof terms === 'string' && terms) {
        policies = terms.split('\n').filter(p => p.trim());
    } else if (Array.isArray(features?.terms)) {
        policies = features.terms;
    }

    const basePrice = getBasePrice();
    const taxPercentage = paymentSettings?.tax_percentage || 0;
    const taxAmount = Math.round(basePrice * (taxPercentage / 100));
    const totalPrice = basePrice + taxAmount;
    const payAmount = paymentType === 'dp' ? Math.round(totalPrice * 0.5) : totalPrice;

    return (
        <div className={`bg-gray-50 min-h-screen pb-20 font-sans ${mobileMode ? 'max-w-md mx-auto shadow-2xl border-x border-gray-100' : ''}`}>

            {/* Header */}
            {mobileMode ? (
                <div className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 py-3 flex items-center gap-3 shadow-sm">
                    <Link to="/mobile-stay" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </Link>
                    <h1 className="font-bold text-md text-gray-900 truncate max-w-[200px]">{title}</h1>
                </div>
            ) : (
                <div className="bg-white border-b border-gray-100 container mx-auto px-4 py-4">
                    <Link to="/stay" className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">← Kembali ke Penginapan</Link>
                </div>
            )}

            <main className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <div className="aspect-video rounded-xl overflow-hidden shadow-sm relative">
                            <img src={images[selectedImage]} className="w-full h-full object-cover" />
                            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                                {selectedImage + 1} / {images.length}
                            </div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {images.map((img, idx) => (
                                <button key={idx} onClick={() => setSelectedImage(idx)} className={`w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-orange-500' : 'border-transparent'}`}>
                                    <img src={img} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>

                        {/* Title & Info */}
                        <div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                                    {category || 'Akomodasi'}
                                </span>
                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                    {organizer || 'Adventure Trip'}
                                </span>
                            </div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 mb-2">{title}</h1>
                                    <div className="flex items-center text-sm text-gray-500 gap-4 mb-6">
                                        <span className="flex items-center gap-1.5"><MapPin size={16} className="text-primary" /> {location}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Facilities Grid */}
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                                <h3 className="font-bold mb-3 text-sm">Fasilitas Utama</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {facilities.map((fac, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            {fac === 'Wifi' && <Wifi size={16} className="text-blue-500" />}
                                            {fac === 'Pool' && <div className="text-blue-400 font-bold">🏊</div>}
                                            {fac === 'AC' && <Wind size={16} className="text-cyan-500" />}
                                            {fac === 'Parking' && <Car size={16} className="text-gray-600" />}
                                            {fac === 'Breakfast' && <Coffee size={16} className="text-orange-600" />}
                                            <span>{fac}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="prose max-w-none text-gray-600 mb-10">
                                <h3 className="text-xl font-black text-gray-900 mb-4 border-l-4 border-primary pl-4">Deskripsi Akomodasi</h3>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm leading-relaxed whitespace-pre-line">
                                    {description}
                                </div>
                            </div>

                            {policies.length > 0 && (
                                <div className="prose max-w-none text-gray-600">
                                    <h3 className="text-xl font-black text-gray-900 mb-4 border-l-4 border-primary pl-4">Kebijakan & Syarat</h3>
                                    <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 shadow-sm">
                                        <ul className="space-y-2">
                                            {policies.map((p, idx) => (
                                                <li key={idx} className="flex gap-2 items-start text-sm">
                                                    <Info size={16} className="text-red-400 shrink-0 mt-0.5" />
                                                    <span>{p}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
                            <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-4">
                                <div>
                                    <p className="text-xs text-gray-400 decoration-double">Mulai dari</p>
                                    <p className="text-2xl font-bold text-orange-500">Rp {currentPrice.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400">/ kamar / malam</p>
                                </div>
                                <div className="text-right">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Tersedia</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-3">Pilih Tanggal Check-In & Lihat Harga</label>
                                    <StayCalendar
                                        schedules={schedules}
                                        selectedDate={checkInDate}
                                        onSelect={setCheckInDate}
                                        rooms={rooms}
                                        nightDuration={nightDuration}
                                        defaultPrice={currentPrice}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Durasi (Malam)</label>
                                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                                            <button onClick={() => setNightDuration(Math.max(1, nightDuration - 1))} className="px-4 py-3 bg-gray-50 hover:bg-gray-100 font-bold">-</button>
                                            <input type="text" className="w-full text-center text-sm font-bold p-2 outline-none" value={nightDuration} readOnly />
                                            <button onClick={() => setNightDuration(nightDuration + 1)} className="px-4 py-3 bg-gray-50 hover:bg-gray-100 font-bold">+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Jumlah Kamar</label>
                                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                                            <button onClick={() => setRooms(Math.max(1, rooms - 1))} className="px-4 py-3 bg-gray-50 hover:bg-gray-100 font-bold">-</button>
                                            <input type="text" className="w-full text-center text-sm font-bold p-2 outline-none" value={rooms} readOnly />
                                            <button onClick={() => setRooms(rooms + 1)} className="px-4 py-3 bg-gray-50 hover:bg-gray-100 font-bold">+</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Pemesan</h4>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Nama Lengkap"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={customerData.name}
                                            onChange={e => setCustomerData({ ...customerData, name: e.target.value })}
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Nomor HP / WhatsApp"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={customerData.phone}
                                            onChange={e => setCustomerData({ ...customerData, phone: e.target.value })}
                                        />
                                        <input
                                            type="email"
                                            placeholder="Alamat Email"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={customerData.email}
                                            onChange={e => setCustomerData({ ...customerData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opsi Pembayaran</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setPaymentType('full')}
                                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${paymentType === 'full' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white text-gray-400'}`}
                                        >
                                            <span className="text-xs font-bold">Full Payment</span>
                                            <span className="text-[10px]">Lunas 100%</span>
                                        </button>
                                        <button
                                            onClick={() => setPaymentType('dp')}
                                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${paymentType === 'dp' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white text-gray-400'}`}
                                        >
                                            <span className="text-xs font-bold">DP (50%)</span>
                                            <span className="text-[10px]">Booking Fee</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Rincian Pembayaran Breakdown */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                    <h4 className="text-sm font-bold text-gray-900">Rincian Pembayaran</h4>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
                                            <span>Tanggal Menginap</span>
                                            <span className="font-bold text-gray-800">
                                                {checkInDate ? `${format(new Date(checkInDate), 'dd MMM yyyy')} - ${format(addDays(new Date(checkInDate), nightDuration), 'dd MMM yyyy')}` : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Sewa ({nightDuration} Malam, {rooms} Kamar)</span>
                                            <span>Rp {basePrice.toLocaleString('id-ID')}</span>
                                        </div>
                                        {taxPercentage > 0 && (
                                            <div className="flex justify-between">
                                                <span>Pajak & Layanan ({taxPercentage}%)</span>
                                                <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg text-primary">
                                            <span>Total Tagihan</span>
                                            <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                                        </div>
                                        {paymentType === 'dp' && (
                                            <div className="flex justify-between text-primary font-bold border-t border-primary/20 pt-2 mt-2">
                                                <span>Bayar Sekarang (DP 50%)</span>
                                                <span>Rp {payAmount.toLocaleString('id-ID')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleBooking}
                                    disabled={isProcessing}
                                    className="w-full bg-primary text-white font-black py-4 rounded-xl hover:bg-pink-700 transition-all shadow-xl shadow-pink-200 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader className="animate-spin" size={20} />
                                            <span>Memproses...</span>
                                        </div>
                                    ) : (paymentType === 'dp' ? 'Bayar DP Sekarang' : 'Pesan & Bayar')}
                                </button>
                                <p className="text-[10px] text-gray-400 text-center mt-2">Dengan memesan, Anda menyetujui syarat & ketentuan yang berlaku.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold">Pilih Pembayaran</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl text-sm border">
                                <div className="flex justify-between mb-2">
                                    <span>Tagihan</span>
                                    <span className="font-bold">Rp {payAmount.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-xs pt-2 border-t font-medium">
                                    <span>Saldo Kamu</span>
                                    <span className={userBalance >= payAmount ? 'text-green-600' : 'text-red-500'}>
                                        Rp {userBalance.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayWithBalance}
                                disabled={isProcessing || userBalance < payAmount}
                                className="w-full py-4 rounded-xl font-bold border-2 transition-all flex items-center justify-between px-6 bg-primary text-white border-primary disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                            >
                                <span>Bayar pakai Saldo</span>
                                <ArrowRight size={18} />
                            </button>

                            <button
                                onClick={handleManualPayment}
                                disabled={isProcessing}
                                className="w-full py-4 rounded-xl font-bold border-2 border-orange-500 text-orange-600 bg-white hover:bg-orange-50 transition-all"
                            >
                                Transfer Bank (Manual)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccommodationDetail;
