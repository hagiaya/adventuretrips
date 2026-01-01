import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Calendar, Car, Info, ArrowLeft, Fuel, Users, Settings, Phone, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { useTrip } from '../hooks/useTrips';
import { supabase } from '../lib/supabaseClient';
import { format, addDays } from 'date-fns';

const TransportDetail = ({ mobileMode = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { trip: vehicle, loading } = useTrip(id);
    const [selectedImage, setSelectedImage] = useState(0);

    // Booking State
    const [days, setDays] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [units, setUnits] = useState(1);
    const [withDriver, setWithDriver] = useState(true); // Default with driver

    // UI State
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [userProfile, setUserProfile] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentTransactionId, setCurrentTransactionId] = useState(null);

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

    // View Count Logic
    useEffect(() => {
        if (vehicle?.id) supabase.rpc('increment_product_view', { p_id: vehicle.id });
    }, [vehicle]);

    // Manual Payment Only

    const handleBooking = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            const event = new CustomEvent('open-auth-modal', {
                detail: { mode: 'login', alertMessage: 'Silakan login untuk menyewa' }
            });
            window.dispatchEvent(event);
            return;
        }

        if (!startDate) {
            alert("Silakan pilih Tanggal Sewa");
            return;
        }

        setIsProcessing(true);
        try {
            const currentPriceVal = parseInt(vehicle.price.replace(/[^0-9]/g, '')) || 0;
            const totalPrice = currentPriceVal * units * days;

            const endDate = format(addDays(new Date(startDate), days), 'yyyy-MM-dd');
            const itemDesc = `${vehicle.title} - ${startDate} to ${endDate} (${days} Days) - ${units} Unit(s) - ${withDriver ? 'With Driver' : 'Self Drive'}`;

            const { data: transaction, error } = await supabase.from('transactions').insert({
                product_id: vehicle.id,
                user_id: session.user.id,
                amount: totalPrice,
                status: 'pending',
                items: itemDesc,
                payment_method: 'Pending Choice'
            }).select().single();

            if (error) throw error;
            setCurrentTransactionId(transaction.id);
            setShowPaymentModal(true);

        } catch (err) {
            console.error(err);
            alert("Gagal memproses pemesanan: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayWithBalance = async () => {
        const currentPriceVal = parseInt(vehicle.price.replace(/[^0-9]/g, '')) || 0;
        const totalPrice = currentPriceVal * units * days;

        if (userBalance < totalPrice) {
            alert("Saldo tidak cukup.");
            return;
        }

        if (!window.confirm(`Konfirmasi pembayaran Rp ${totalPrice.toLocaleString('id-ID')} menggunakan Saldo?`)) return;

        setIsProcessing(true);
        try {
            const { error: balanceErr } = await supabase.from('profiles').update({ balance: userBalance - totalPrice }).eq('id', userProfile.id);
            if (balanceErr) throw balanceErr;

            const { error: txErr } = await supabase.from('transactions').update({
                status: 'success',
                payment_method: 'Saldo Dompet'
            }).eq('id', currentTransactionId);
            if (txErr) throw txErr;

            await supabase.from('balance_transactions').insert({
                user_id: userProfile.id,
                amount: -totalPrice,
                type: 'debit',
                description: `Pembayaran Sewa ${vehicle.title} #${currentTransactionId.substring(0, 8).toUpperCase()}`
            });

            setUserBalance(prev => prev - totalPrice);
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
    if (!vehicle) return <div className="min-h-screen flex items-center justify-center">Vehicle Not Found</div>;

    const { title, location, rating, reviews_count, gallery, description, price, features } = vehicle;
    const images = gallery || [vehicle.image_url];
    const currentPrice = parseInt(price.replace(/[^0-9]/g, '')) || 0;
    const specs = features?.specs || [];
    const includes = features?.includes || [];
    const vehicleType = features?.vehicle_type || 'Car';

    const calculateTotal = () => {
        return (currentPrice * units * days).toLocaleString('id-ID');
    }

    return (
        <div className={`bg-gray-50 min-h-screen pb-20 font-sans ${mobileMode ? 'max-w-md mx-auto shadow-2xl border-x border-gray-100' : ''}`}>

            {/* Header */}
            {mobileMode ? (
                <div className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 py-3 flex items-center gap-3 shadow-sm">
                    <Link to="/mobile-transport" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </Link>
                    <h1 className="font-bold text-md text-gray-900 truncate max-w-[200px]">{title}</h1>
                </div>
            ) : (
                <div className="bg-white border-b border-gray-100 container mx-auto px-4 py-4">
                    <Link to="/transport" className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">← Kembali ke Transportasi</Link>
                </div>
            )}

            <main className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <div className="aspect-video rounded-xl overflow-hidden shadow-sm relative bg-gray-100 flex items-center justify-center">
                            <img src={images[selectedImage]} className="w-full h-full object-cover" />
                        </div>

                        {/* Title & Specs */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md uppercase">{vehicleType}</span>
                                <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={12} /> {location}</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>

                            {/* Specs Grid */}
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                                {specs.map((spec, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 text-center shadow-sm">
                                        <div className="bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-600">
                                            {spec.includes('Seat') && <Users size={16} />}
                                            {spec.includes('Manual') || spec.includes('Auto') ? <Settings size={16} /> : <CheckCircle size={16} />}
                                        </div>
                                        <span className="text-xs font-bold text-gray-700 block">{spec}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Includes */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                                <h3 className="font-bold text-blue-900 mb-2 text-sm flex items-center gap-2"><CheckCircle size={16} /> Termasuk dalam Paket</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {includes.map((inc, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-blue-800">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                            {inc}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="prose max-w-none text-gray-600">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Deskripsi Layanan</h3>
                                <p className="whitespace-pre-line">{description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
                            <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-4">
                                <div>
                                    <p className="text-xs text-gray-400 decoration-double">Harga Sewa</p>
                                    <p className="text-2xl font-bold text-blue-600">Rp {currentPrice.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400">/ hari</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal Mulai Sewa</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 bg-gray-50 border rounded-lg text-sm font-bold"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Durasi (Hari)</label>
                                        <div className="flex items-center border rounded-lg overflow-hidden">
                                            <button onClick={() => setDays(Math.max(1, days - 1))} className="px-3 py-2 bg-gray-100 hover:bg-gray-200">-</button>
                                            <input type="text" className="w-full text-center text-sm font-bold p-2" value={days} readOnly />
                                            <button onClick={() => setDays(days + 1)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200">+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Jumlah Unit</label>
                                        <div className="flex items-center border rounded-lg overflow-hidden">
                                            <button onClick={() => setUnits(Math.max(1, units - 1))} className="px-3 py-2 bg-gray-100 hover:bg-gray-200">-</button>
                                            <input type="text" className="w-full text-center text-sm font-bold p-2" value={units} readOnly />
                                            <button onClick={() => setUnits(units + 1)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200">+</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Driver Toggle */}
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer max-w-full overflow-hidden" onClick={() => setWithDriver(!withDriver)}>
                                    <div className={`w-5 h-5 rounded border border-gray-300 flex items-center justify-center bg-white ${withDriver ? 'bg-blue-600 border-blue-600' : ''}`}>
                                        {withDriver && <CheckCircle className="text-white w-3 h-3" />}
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 select-none">Termasuk Supir</span>
                                </div>


                                <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Total Sewa</span>
                                    <span className="font-bold text-blue-600 text-lg">Rp {calculateTotal()}</span>
                                </div>

                                <button
                                    onClick={handleBooking}
                                    disabled={isProcessing}
                                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
                                >
                                    {isProcessing ? 'Memproses...' : 'Booking Rental'}
                                </button>
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
                                    <span className="font-bold">Rp {(parseInt(vehicle.price.replace(/[^0-9]/g, '')) * units * days).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-xs pt-2 border-t font-medium">
                                    <span>Saldo Kamu</span>
                                    <span className={userBalance >= (parseInt(vehicle.price.replace(/[^0-9]/g, '')) * units * days) ? 'text-green-600' : 'text-red-500'}>
                                        Rp {userBalance.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayWithBalance}
                                disabled={isProcessing || userBalance < (parseInt(vehicle.price.replace(/[^0-9]/g, '')) * units * days)}
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

export default TransportDetail;
