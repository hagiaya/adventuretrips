import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Calendar, MapPin, Users, Download, Share2, Printer, CheckCircle } from 'lucide-react';

const TicketDetail = () => {
    const { id } = useParams();
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*, product:products(*), products:product_id(*)') // Try both aliases to be safe
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setTransaction(data);
            } catch (error) {
                console.error("Error fetching ticket:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-gray-500 font-medium">Sedang memuat E-Ticket Anda...</p>
                </div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <h1 className="text-xl font-bold text-gray-900 mb-2">Tiket Tidak Ditemukan</h1>
                <Link to="/tickets" className="text-primary hover:underline">Kembali ke Daftar Tiket</Link>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans print:bg-white print:p-0">
            {/* Header Navigation */}
            <div className="max-w-md mx-auto mb-6 flex justify-between items-center print:hidden">
                <Link to="/tickets" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-1" />
                    <span className="font-bold text-sm">Kembali</span>
                </Link>
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="p-2 bg-white rounded-full text-gray-600 shadow-sm hover:text-primary transition-colors">
                        <Printer size={20} />
                    </button>
                    <button className="p-2 bg-white rounded-full text-gray-600 shadow-sm hover:text-primary transition-colors">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Ticket Card */}
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden relative print:shadow-none print:max-w-none">
                {/* Decorative Circles */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>

                {/* Status Header */}
                <div className="bg-gradient-to-r from-primary to-pink-600 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white/20 p-2 rounded-full mb-2 backdrop-blur-sm">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-lg font-bold tracking-wider uppercase">E-Ticket Confirmed</h1>
                        <p className="text-xs opacity-90 mt-1">Invoice: #{transaction.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Ticket Body */}
                <div className="p-6 relative">
                    {/* Access Hole Cutouts (Visual only) */}
                    <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full"></div>
                    <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full"></div>

                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                            {transaction.product?.title || transaction.products?.title || transaction.items || 'Trip Booking'}
                        </h2>
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wide">
                            {transaction.product?.category || transaction.products?.category || 'Open Trip'}
                        </span>
                    </div>

                    <div className="space-y-5">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase mb-1">
                                    <Calendar size={12} /> Date
                                </span>
                                <p className="font-bold text-gray-900 text-sm">
                                    {new Date(transaction.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {/* Note: ideally use transaction travel date if available */}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase mb-1">
                                    <Users size={12} /> Pax
                                </span>
                                <p className="font-bold text-gray-900 text-sm">
                                    {transaction.items && typeof transaction.items === 'string' && transaction.items.includes('Pax') ?
                                        transaction.items.match(/(\d+)\s*Pax/)?.[1] || '1' : '1'} Orang
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <span className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase mb-1">
                                <MapPin size={12} /> Meeting Point
                            </span>
                            <p className="font-bold text-gray-900 text-sm">
                                {transaction.meeting_point || transaction.product?.location || transaction.products?.location || 'Akan diinfokan Admin'}
                            </p>
                        </div>

                        {/* Participant List (if available) */}
                        {transaction.participants && transaction.participants.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase mb-2">
                                    <Users size={12} /> Participants
                                </span>
                                <ul className="text-sm font-medium text-gray-800 space-y-1">
                                    {transaction.participants.map((p, idx) => {
                                        const participantName = typeof p === 'string' ? p : (p.name || p.full_name || 'Peserta');
                                        return (
                                            <li key={idx} className="flex gap-2">
                                                <span className="text-gray-400 w-4">{idx + 1}.</span>
                                                <span>{participantName}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {/* QR Code Section */}
                        <div className="border-t-2 border-dashed border-gray-100 pt-6 mt-6 flex flex-col items-center">
                            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm mb-3">
                                <QRCodeSVG value={`https://webtravel.com/validate/${transaction.id}`} size={120} />
                            </div>
                            <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">Scan to Verify</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-900 p-4 text-center">
                    <p className="text-white/60 text-[10px] uppercase tracking-wider">Adventure Trip Indonesia</p>
                    <p className="text-white/40 text-[9px] mt-1">Authorized E-Ticket • Non-Refundable</p>
                </div>
            </div>

            <div className="mt-6 text-center print:hidden">
                <button
                    onClick={handlePrint}
                    className="w-full max-w-md bg-white border border-gray-200 text-gray-900 font-bold py-3 rounded-xl shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                    <Download size={18} /> Download E-Ticket
                </button>
            </div>
        </div>
    );
};

export default TicketDetail;
