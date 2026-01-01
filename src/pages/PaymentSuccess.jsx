import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, ArrowRight, Download, Calendar, MapPin, Package, User, Clock, AlertCircle, Upload, Copy } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const PaymentSuccess = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isMobile = searchParams.get('mobile') === 'true';

    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [proofFile, setProofFile] = useState(null);

    const [bankAccounts, setBankAccounts] = useState([
        { bank: 'BCA', number: '880008123456', name: 'ADVENTURE TRIP INDONESIA', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg' },
        { bank: 'Mandiri', number: '1230009876543', name: 'ADVENTURE TRIP INDONESIA', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg' }
    ]);

    useEffect(() => {
        fetchTransaction();
        fetchPaymentSettings();
    }, [id]);

    const fetchPaymentSettings = async () => {
        try {
            const { data } = await supabase.from('payment_settings').select('manual_accounts').single();
            if (data && data.manual_accounts && Array.isArray(data.manual_accounts) && data.manual_accounts.length > 0) {
                // Map to match the UI structure if needed, or just use as is
                const formatted = data.manual_accounts.map(acc => ({
                    bank: acc.bank_name,
                    number: acc.account_number,
                    name: acc.account_holder,
                    logo: null // Or logic to map bank name to logo
                }));
                setBankAccounts(formatted);
            }
        } catch (err) {
            console.error("Error fetching payment settings:", err);
        }
    };

    const fetchTransaction = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('transactions')
                .select('*, product:products(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setTransaction(data);
        } catch (err) {
            console.error("Error fetching transaction", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        alert('Nomor rekening disalin!');
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleUploadProof = async () => {
        if (!proofFile) return alert("Pilih foto bukti transfer terlebih dahulu.");

        setUploading(true);
        try {
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `${id}_${Date.now()}.${fileExt}`;
            const filePath = `receipts/${fileName}`;

            // 1. Upload Image
            const { error: uploadError } = await supabase.storage
                .from('receipts') // Ensure this bucket exists in Supabase
                .upload(filePath, proofFile);

            if (uploadError) {
                // Determine if error is bucket not found
                if (uploadError.statusCode === "404") {
                    throw new Error("Bucket 'receipts' tidak ditemukan. Hubungi admin.");
                }
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            // 2. Update Transaction
            const { error: updateError } = await supabase
                .from('transactions')
                .update({
                    status: 'verification_pending',
                    receipt_url: publicUrl
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Refresh data
            await fetchTransaction();
            alert("Bukti transfer berhasil dikirim! Mohon tunggu verifikasi admin.");

            // Redirect to tickets page as requested
            navigate(isMobile ? '/mobile-tickets' : '/tickets');

        } catch (error) {
            console.error("Upload Error:", error);
            alert("Gagal mengupload bukti: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // --- TIMER LOGIC ---
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!transaction || (transaction.status !== 'pending' && transaction.status !== 'waiting_proof')) return;

        const DEADLINE_MINUTES = 60;
        const created = new Date(transaction.created_at).getTime();
        const deadline = created + (DEADLINE_MINUTES * 60 * 1000);

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = deadline - now;

            if (difference > 0) {
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft(`${hours > 0 ? hours + ':' : ''}${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`);
                setIsExpired(false);
            } else {
                setTimeLeft('00:00');
                setIsExpired(true);
            }
        };

        const timerId = setInterval(updateTimer, 1000);
        updateTimer(); // Initial call

        return () => clearInterval(timerId);
    }, [transaction]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Transaksi Tidak Ditemukan</h2>
                <Link to={isMobile ? "/mobilemenu" : "/"} className="text-primary hover:underline">Kembali ke Beranda</Link>
            </div>
        );
    }

    const StatusBadge = ({ status }) => {
        const styles = {
            confirmed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-800',
            waiting_proof: 'bg-orange-100 text-orange-800',
            verification_pending: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-red-100 text-red-700'
        };

        const labels = {
            confirmed: 'Berhasil / Lunas',
            pending: 'Menunggu Pembayaran',
            waiting_proof: 'Menunggu Bukti Transfer',
            verification_pending: 'Menunggu Verifikasi Admin',
            cancelled: 'Dibatalkan'
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${styles[status] || 'bg-gray-100 text-gray-800'} border-opacity-20`}>
                {labels[status] || status}
            </span>
        );
    };

    // --- VIEW: SUCCESS / CONFIRMED ---
    if (transaction.status === 'confirmed') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-green-500 p-8 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm relative z-10">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold mb-1 relative z-10">Pembayaran Berhasil!</h1>
                        <p className="opacity-90 relative z-10">E-Tiket telah diterbitkan.</p>
                    </div>

                    {/* Detail Ticket */}
                    <div className="p-6">
                        {/* Detailed Price Breakdown */}
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -mr-10 -mt-10"></div>

                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary" />
                                Rincian Pembayaran
                            </h3>

                            {(() => {
                                // Logic to reverse-calculate breakdown
                                const totalAmount = transaction.amount || 0;
                                const discountPct = transaction.product?.discount_percentage || 0;

                                // 1. Extract Tax (Assuming 11%)
                                // formula: Total = Subtotal * 1.11
                                const subtotal = totalAmount / 1.11;
                                const taxAmount = totalAmount - subtotal;

                                // 2. Extract Discount
                                // formula: Subtotal = OriginalPriceAfterDiscount
                                // OriginalPriceAfterDiscount = OriginalBase * (1 - discount/100)
                                // OriginalBase = Subtotal / ((100 - discount)/100)

                                let originalBase = subtotal;
                                if (discountPct > 0) {
                                    originalBase = subtotal / ((100 - discountPct) / 100);
                                }

                                const discountAmount = originalBase - subtotal;

                                return (
                                    <div className="space-y-3 text-sm">
                                        {/* Harga Normal */}
                                        <div className="flex justify-between items-center text-gray-500">
                                            <span>Harga Normal</span>
                                            <span>Rp {Math.round(originalBase).toLocaleString('id-ID')}</span>
                                        </div>

                                        {/* Diskon */}
                                        {discountPct > 0 && (
                                            <div className="flex justify-between items-center text-red-500">
                                                <span>Diskon ({discountPct}%)</span>
                                                <span>- Rp {Math.round(discountAmount).toLocaleString('id-ID')}</span>
                                            </div>
                                        )}

                                        {/* After Discount / Subtotal */}
                                        <div className="flex justify-between items-center text-gray-800 font-medium pt-2 border-t border-dashed border-gray-200">
                                            <span>Subtotal</span>
                                            <span>Rp {Math.round(subtotal).toLocaleString('id-ID')}</span>
                                        </div>

                                        {/* Tax */}
                                        <div className="flex justify-between items-center text-gray-500 text-xs">
                                            <span>Layanan & Biaya Lainnya (11%)</span>
                                            <span>+ Rp {Math.round(taxAmount).toLocaleString('id-ID')}</span>
                                        </div>

                                        {/* Grand Total */}
                                        <div className="flex justify-between items-center text-lg font-bold text-primary pt-3 mt-1 border-t border-gray-100">
                                            <span>Total Dibayar</span>
                                            <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                            <div className="flex gap-3 mb-3">
                                <img src={transaction.product?.image} className="w-16 h-16 rounded-lg object-cover bg-gray-200" alt="Trip" />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{transaction.product?.title}</h3>

                                    {/* Calculated Date Range */}
                                    {(() => {
                                        if (!transaction.date) return <p className="text-xs text-gray-500 mt-1">{transaction.items}</p>;

                                        const startDate = parseISO(transaction.date);
                                        let durationDays = 1;
                                        // Check duration in features or root duration field
                                        const durationStr = transaction.product?.features?.duration || transaction.product?.duration || '';
                                        if (durationStr) {
                                            const match = durationStr.toString().match(/(\d+)/);
                                            if (match) durationDays = parseInt(match[0]);
                                        }

                                        const endDate = addDays(startDate, durationDays - 1);
                                        const dateString = durationDays > 1
                                            ? `${format(startDate, 'dd MMM', { locale: idLocale })} - ${format(endDate, 'dd MMM yyyy', { locale: idLocale })}`
                                            : format(startDate, 'dd MMMM yyyy', { locale: idLocale });

                                        return (
                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-100 w-fit">
                                                <Calendar size={12} />
                                                <span>{dateString}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-200 border-dashed">
                                <span className="text-gray-500">ID Order</span>
                                <span className="font-mono font-bold text-gray-700">{transaction.id.substring(0, 8).toUpperCase()}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Link to={isMobile ? "/mobile-tickets" : "/tickets"} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-center block shadow-lg shadow-primary/30 hover:bg-primary-dark">
                                Lihat Tiket Saya
                            </Link>
                            <Link to={isMobile ? "/mobilemenu" : "/"} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-center block hover:bg-gray-50">
                                Kembali ke Beranda
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: WAITING PROOF OR VERIFICATION ---
    const isVerification = transaction.status === 'verification_pending';

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
            <div className="max-w-md mx-auto space-y-4">

                {/* Header Status */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isVerification ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        {isVerification ? <Clock className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">
                        {isVerification ? 'Menunggu Verifikasi' : 'Selesaikan Pembayaran'}
                    </h1>
                    <p className="text-sm text-gray-500 leading-relaxed px-4">
                        {isVerification
                            ? 'Admin kami sedang mengecek bukti transfer Anda. Proses ini memakan waktu maksimal 1x24 jam.'
                            : 'Silakan transfer ke salah satu rekening di bawah ini dan upload bukti transfer Anda.'}
                    </p>
                    <div className="mt-4">
                        <StatusBadge status={transaction.status} />
                    </div>
                </div>

                {/* Amount to Pay */}
                {!isVerification && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                        {/* Countdown Banner */}
                        {timeLeft && (
                            <div className={`mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${isExpired ? 'bg-red-100 text-red-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
                                <Clock size={16} />
                                <span>{isExpired ? 'Waktu Habis' : `Sisa Waktu: ${timeLeft}`}</span>
                            </div>
                        )}

                        <p className="text-sm text-gray-500 mb-1">Total Tagihan</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl font-bold text-gray-900">Rp {transaction.amount.toLocaleString('id-ID')}</span>
                            <button onClick={() => handleCopy(transaction.amount)} className="text-gray-400 hover:text-primary"><Copy size={16} /></button>
                        </div>
                        <div className="bg-yellow-50 text-yellow-800 text-xs px-3 py-2 rounded-lg mt-3 inline-block border border-yellow-100">
                            ⚠️ Mohon transfer sesuai nominal hingga 3 digit terakhir.
                        </div>
                    </div>
                )}

                {/* Bank Accounts List */}
                {!isVerification && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-500 ml-1">Rekening Tujuan</h3>
                        {bankAccounts.map((bank, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                                <div className="w-16 h-10 bg-gray-50 rounded flex items-center justify-center p-1 border border-gray-200">
                                    {bank.logo ? <img src={bank.logo} alt={bank.bank} className="h-full object-contain" /> : <span className="font-bold text-gray-400">{bank.bank}</span>}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400">{bank.name}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-lg text-gray-800 font-mono tracking-wide">{bank.number}</p>
                                        <button onClick={() => handleCopy(bank.number)} className="text-blue-600 hover:text-blue-700 text-xs font-bold">Salin</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Section or Proof Display */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        {isVerification ? 'Bukti Transfer Anda' : 'Konfirmasi Pembayaran'}
                    </h3>

                    {isVerification ? (
                        <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                            <img src={transaction.receipt_url} alt="Bukti Transfer" className="w-full h-auto" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {proofFile ? (
                                    <div className="text-green-600">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                                        <p className="font-bold text-sm truncate">{proofFile.name}</p>
                                        <p className="text-xs">Klik untuk ganti file</p>
                                    </div>
                                ) : (
                                    <div className="text-gray-400">
                                        <Upload className="w-8 h-8 mx-auto mb-2" />
                                        <p className="font-bold text-sm text-gray-600">Upload Bukti Transfer</p>
                                        <p className="text-xs">Format: JPG, PNG (Max 2MB)</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleUploadProof}
                                disabled={uploading || !proofFile}
                                className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                                {uploading ? 'Mengupload...' : 'Kirim Bukti Pembayaran'}
                            </button>
                        </div>
                    )}
                </div>

                {isVerification && (
                    <div className="text-center pt-4">
                        <Link to={isMobile ? "/mobile-tickets" : "/tickets"} className="text-primary font-bold hover:underline">
                            Cek Status di Menu Tiket
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
