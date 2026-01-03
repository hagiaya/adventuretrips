import React, { useState, useEffect } from 'react';
import { Ticket, MessageCircle, ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const TicketsPage = ({ mobileMode = false }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState([]);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsLoggedIn(true);
                setUserId(session.user.id);
                fetchTickets(session.user.id);
            } else {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const fetchTickets = async (uid) => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*, products:product_id(*)') // Join with products to get details
                .eq('user_id', uid)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenLogin = () => {
        const event = new CustomEvent('open-auth-modal', {
            detail: { mode: 'login', alertMessage: 'Silakan login untuk melihat tiket Anda' }
        });
        window.dispatchEvent(event);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed':
            case 'success':
                return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">E-Ticket Terbit</span>;
            case 'pending':
                return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">Menunggu Pembayaran</span>;
            case 'waiting_proof':
                return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 animate-pulse">Upload Bukti Transfer</span>;
            case 'verification_pending':
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">Menunggu Verifikasi Admin</span>;
            case 'cancelled':
            case 'failed':
                return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Dibatalkan</span>;
            default:
                return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${mobileMode ? 'pb-20' : 'pt-24'}`}>
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    <div className="text-gray-400 font-medium">Memuat tiket Anda...</div>
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className={`min-h-screen bg-gray-50 ${mobileMode ? 'pb-20 max-w-md mx-auto shadow-2xl border-x border-gray-100' : 'pt-24 pb-20'}`}>
                {mobileMode && (
                    <div className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 py-3 flex items-center gap-3 shadow-sm">
                        <Link to="/mobilemenu" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-800" />
                        </Link>
                        <h1 className="font-bold text-md text-gray-900">Tiket Saya</h1>
                    </div>
                )}
                <div className={`flex flex-col items-center justify-center h-[60vh] px-6 text-center ${mobileMode ? '' : 'container mx-auto'}`}>
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <Lock className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Dibatasi</h2>
                    <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">Silakan login terlebih dahulu untuk melihat dan mengelola pesanan tiket liburan Anda.</p>
                    <button
                        onClick={handleOpenLogin}
                        className="bg-primary text-white font-bold py-3.5 px-10 rounded-xl shadow-lg hover:bg-pink-700 transition-all active:scale-95 w-full max-w-xs"
                    >
                        Masuk / Daftar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-50 ${mobileMode ? 'pb-24 max-w-md mx-auto shadow-2xl border-x border-gray-100' : 'pt-24 pb-20'}`}>

            {/* Mobile Header */}
            {mobileMode && (
                <div className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 py-3 flex items-center gap-3 shadow-sm">
                    <Link to="/mobilemenu" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </Link>
                    <h1 className="font-bold text-md text-gray-900">Tiket Saya ({tickets.length})</h1>
                </div>
            )}

            <div className={`container mx-auto px-4 max-w-3xl ${mobileMode ? 'py-4' : ''}`}>
                {!mobileMode && (
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tiket Saya</h1>
                        <p className="text-gray-500">Kelola pesanan dan rincian perjalanan Anda di sini.</p>
                    </div>
                )}

                {tickets.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mt-4">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ticket className="w-10 h-10 text-blue-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Belum Ada Tiket</h3>
                        <p className="text-gray-500 mb-8 text-sm max-w-sm mx-auto">Anda belum memiliki pesanan aktif saat ini. Yuk mulai petualangan baru bersama kami!</p>

                        <div className="space-y-4 max-w-xs mx-auto">
                            <Link to={mobileMode ? "/mobile-trips" : "/trips"} className="block w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-pink-700 transition-all shadow-lg shadow-primary/30">
                                Cari Trip Sekarang
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-4 flex flex-col gap-4">
                                    {/* Header: ID & Status */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs text-gray-400 font-mono">Invoice: #{ticket.id.slice(0, 8)}</span>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{ticket.items || 'Trip Booking'}</h3>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(ticket.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                        <div>
                                            {getStatusBadge(ticket.status)}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-50 my-1"></div>

                                    {/* Footer: Price & Action */}
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-gray-500">Total Pembayaran</p>
                                            <p className="font-bold text-primary">Rp {parseInt(ticket.amount).toLocaleString('id-ID')}</p>
                                        </div>

                                        {/* Dynamic Action Buttons based on Status */}
                                        {ticket.status === 'confirmed' || ticket.status === 'success' ? (
                                            <Link to={`/ticket/${ticket.id}`} className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100 hover:bg-green-100 transition-colors">
                                                Lihat E-Ticket
                                            </Link>
                                        ) : ticket.status === 'waiting_proof' ? (
                                            <Link to={`/payment-success/${ticket.id}?mobile=${mobileMode}`} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-500/30 hover:bg-orange-600 transition-all animate-pulse">
                                                Upload Bukti
                                            </Link>
                                        ) : ticket.status === 'verification_pending' ? (
                                            <a
                                                href={`https://wa.me/6281818433490?text=Halo Admin, saya ingin cek status verifikasi pesanan invoice no: ${ticket.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-bold shadow-md shadow-green-500/30 hover:bg-green-600 transition-all flex items-center gap-1"
                                            >
                                                <MessageCircle size={14} /> Chat CS
                                            </a>
                                        ) : ticket.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <Link to={`/payment-success/${ticket.id}?mobile=${mobileMode}`} className="px-3 py-2 text-blue-600 bg-blue-50 rounded-lg text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-all">
                                                    Info
                                                </Link>
                                                <a
                                                    href={`https://wa.me/6281818433490?text=Halo Admin, saya ingin konfirmasi pembayaran untuk pesanan invoice no: ${ticket.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-1"
                                                >
                                                    <MessageCircle size={14} /> Chat CS
                                                </a>
                                            </div>
                                        ) : (
                                            <Link to={`/payment-success/${ticket.id}?mobile=${mobileMode}`} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-100 transition-colors">
                                                Detail
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketsPage;
