import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Calendar, Clock, CheckCircle, Info, Share2, Heart, ArrowLeft, ShieldCheck, Award, Loader, Eye, ArrowRight, Upload, MessageCircle, CreditCard } from 'lucide-react';
import { useTrip } from '../hooks/useTrips';
import { supabase } from '../lib/supabaseClient';
import TripReviews from './TripReviews';
import TripCalendar from './TripCalendar';
import { formatNumber } from '../utils/formatters';
import { addToRecentlyViewed } from '../utils/recentlyViewed';

const TripDetail = ({ mobileMode = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { trip, loading, refetch } = useTrip(id); // Added refetch
    const [activeTab, setActiveTab] = useState('deskripsi');
    const [selectedImage, setSelectedImage] = useState(0);

    // Booking State
    const [pax, setPax] = useState(1);
    const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0);


    const [selectedPackageIndices, setSelectedPackageIndices] = useState([]); // Array for multiple selection
    const [selectedMeetingPoint, setSelectedMeetingPoint] = useState(null);
    // Updated to store full object details
    const [participantsData, setParticipantsData] = useState([{ name: '', ktp: '', dob: '', gender: 'Laki-laki', phone: '', email: '' }]);
    const [paymentType, setPaymentType] = useState('full'); // 'full' or 'dp'
    const [isFavorite, setIsFavorite] = useState(false);

    // UI State
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    // Payment Settings
    const [paymentSettings, setPaymentSettings] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentTransactionId, setCurrentTransactionId] = useState(null); // Keep this state
    const [paymentMethod, setPaymentMethod] = useState('midtrans');
    const [simulatedMethod, setSimulatedMethod] = useState('BCA Virtual Account');
    const [userBalance, setUserBalance] = useState(0);
    const [userProfile, setUserProfile] = useState(null);

    // Fetch Payment Settings and User Balance
    useEffect(() => {
        const fetchInitialData = async () => {
            // Payment Settings
            const { data: settings } = await supabase.from('payment_settings').select('*').single();
            if (settings) setPaymentSettings(settings);

            // User Profile (Balance)
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                if (profile) {
                    setUserProfile(profile);
                    setUserBalance(profile.balance || 0);
                }
            }
        };
        fetchInitialData();
    }, []);

    // Reset selected image and schedule when trip changes
    useEffect(() => {
        setSelectedImage(0);
        if (trip) {
            setSelectedScheduleIndex(0);
            setSelectedPackageIndices([]); // Reset to empty array
            setSelectedMeetingPoint(null);
            setPax(1);
            setParticipantsData([{ name: '', ktp: '', dob: '', gender: 'Laki-laki', phone: '', email: '' }]);
            setPaymentType('full');
            window.scrollTo(0, 0);
        }
    }, [trip]);

    // State for local view count to allow immediate updates
    const [viewCount, setViewCount] = useState(0);
    const [reviewStats, setReviewStats] = useState({ rating: 0, count: 0 });
    const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);

    // Sync viewCount when trip data loads
    useEffect(() => {
        if (trip) {
            setViewCount(trip.views_count || 0);
        }
    }, [trip]);

    // Fetch Review Stats
    useEffect(() => {
        const fetchReviewStats = async () => {
            if (!trip?.id) return;

            // Check UUID format
            const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trip.id);
            if (!isUuid) return; // Static ID, stick to mock data if any

            const { data, error } = await supabase
                .from('reviews')
                .select('rating')
                .eq('product_id', trip.id);

            if (!error && data && data.length > 0) {
                const totalRating = data.reduce((acc, curr) => acc + (curr.rating || 0), 0);
                const avgRating = totalRating / data.length;
                setReviewStats({
                    rating: parseFloat(avgRating.toFixed(1)),
                    count: data.length
                });
            } else {
                // No reviews yet
                setReviewStats({
                    rating: 0,
                    count: 0
                });
            }
        };

        fetchReviewStats();
    }, [trip?.id, statsRefreshTrigger]);

    // Increment View Count
    useEffect(() => {
        const incrementView = async () => {
            if (trip?.id) {
                console.log("Incrementing view for trip:", trip.id);
                const { error } = await supabase.rpc('increment_product_view', { p_id: trip.id });
                //...

                if (error) {
                    console.error("Failed to increment view:", error);
                } else {
                    setViewCount(prev => prev + 1);
                    // Add to local history
                    addToRecentlyViewed(trip.id);
                }
            }
        };

        if (trip?.id) {
            incrementView();
        }
    }, [trip?.id]);

    // --- PRICING & TAX CALCULATIONS ---
    const schedules = trip?.schedules || [];
    const hasSchedules = schedules.length > 0;
    const packages = trip?.features?.packages || [];
    const hasPackages = packages.length > 0;

    // 1. Base Schedule Price
    let basePrice = 0;
    let maxQuota = 20; // Default fallback
    let selectedDateString = '';
    let selectedSchedule = null;

    if (trip && hasSchedules) {
        selectedSchedule = schedules[selectedScheduleIndex] || schedules[0];
        if (selectedSchedule) {
            basePrice = parseInt(selectedSchedule.price) || 0;
            maxQuota = parseInt(selectedSchedule.quota) - (parseInt(selectedSchedule.booked) || 0);

            // Calculate Date Range
            const startDateStr = selectedSchedule.date;
            let rangeString = startDateStr;

            try {
                // Fix Timezone Issue: Parse YYYY-MM-DD explicitly as local time
                // new Date("2026-01-01") parses as UTC, which can shift to Dec 31 in Western timezones
                const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
                const startDate = new Date(sYear, sMonth - 1, sDay);

                if (!isNaN(startDate.getTime())) {
                    // Parse Duration (e.g. "3 Hari 2 Malam", "3D2N", "3 Days")
                    const durationStr = trip.features?.duration || trip.duration || "";
                    // Try multple regex patterns
                    let days = 1;
                    const daysMatch = durationStr.match(/(\d+)\s*(?:Hari|Day|D)/i);

                    if (daysMatch) {
                        days = parseInt(daysMatch[1]);
                    } else {
                        // Fallback: look for the first number if no unit found
                        const numMatch = durationStr.match(/(\d+)/);
                        if (numMatch) days = parseInt(numMatch[1]);
                    }

                    if (days > 1) {
                        const endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + days - 1);

                        const startDay = startDate.getDate();
                        const startMonth = startDate.toLocaleDateString('id-ID', { month: 'short' });
                        const startYear = startDate.getFullYear();

                        const endDay = endDate.getDate();
                        const endMonth = endDate.toLocaleDateString('id-ID', { month: 'short' });
                        const endYear = endDate.getFullYear();

                        if (startYear === endYear) {
                            if (startMonth === endMonth) {
                                rangeString = `${startDay} - ${endDay} ${startMonth} ${startYear}`;
                            } else {
                                rangeString = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
                            }
                        } else {
                            rangeString = `${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`;
                        }
                    } else {
                        // Single Day
                        rangeString = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                    }
                }
            } catch (e) {
                console.error("Date calc error", e);
            }

            selectedDateString = rangeString;
        }
    } else if (trip) {
        // Fallback for older data format
        basePrice = parseInt(trip?.price?.toString().replace(/[^0-9]/g, '')) || 0;
    }

    // Meeting Point Pricing Logic (Dynamic based on Selected Schedule AND concurrent schedules on same date)
    const meetingPoints = React.useMemo(() => {
        let points = [];

        // Find all schedules that match the selected date
        // This handles cases where multiple schedules exist for the same day (e.g. different MPs)
        const relevantSchedules = selectedSchedule
            ? schedules.filter(s => s.date === selectedSchedule.date)
            : [];

        if (relevantSchedules.length > 0) {
            relevantSchedules.forEach(sched => {
                // Find global index for switching
                const sIdx = schedules.indexOf(sched);
                const schedBasePrice = parseInt(sched.price) || basePrice;
                const rawPoints = sched.meetingPoints || sched.meeting_points || [];

                if (Array.isArray(rawPoints) && rawPoints.length > 0) {
                    const schedulePoints = rawPoints.map(mp => {
                        if (typeof mp === 'object') {
                            return {
                                name: mp.name,
                                price: parseInt(mp.price) || schedBasePrice,
                                scheduleIndex: sIdx
                            };
                        } else if (typeof mp === 'string') {
                            return {
                                name: mp,
                                price: schedBasePrice,
                                scheduleIndex: sIdx
                            };
                        }
                        return null;
                    }).filter(Boolean);
                    points.push(...schedulePoints);
                }
            });
        }

        // Deduplicate points by name + price to avoid visual clutter?
        // Ideally we keep them if they are distinct options. 
        // If same name and price, better to dedup.
        const uniquePoints = [];
        const seen = new Set();
        points.forEach(p => {
            const key = `${p.name}-${p.price}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniquePoints.push(p);
            }
        });

        // 2. Fallback: Check Global Trip Meeting Point (Legacy/Global fallback)
        if (uniquePoints.length === 0 && trip && trip.meeting_point) {
            uniquePoints.push({ name: trip.meeting_point, price: basePrice });
        }

        return uniquePoints;
    }, [selectedSchedule, schedules, trip, basePrice]);

    // Determine Base Price based on selection
    // If meeting point selected, use its price. Else use lowest MP price.
    const activeBasePrice = selectedMeetingPoint
        ? (parseInt(selectedMeetingPoint.price) || 0)
        : (meetingPoints.length > 0
            ? Math.min(...meetingPoints.map(mp => parseInt(mp.price) || 0))
            : basePrice);

    // Auto-select lowest price meeting point if none selected
    useEffect(() => {
        if (meetingPoints.length > 0 && !selectedMeetingPoint) {
            // Find lowest price meeting point default
            const lowestPriceMp = meetingPoints.reduce((min, curr) =>
                (parseInt(curr.price) || 0) < (parseInt(min.price) || 0) ? curr : min
                , meetingPoints[0]);

            setSelectedMeetingPoint(lowestPriceMp);
        }
    }, [selectedScheduleIndex, trip, meetingPoints]); // Re-run when points change

    // Reset meeting point when schedule changes
    useEffect(() => {
        setSelectedMeetingPoint(null);
    }, [selectedScheduleIndex]);

    // Sync Participant Data with Pax
    useEffect(() => {
        setParticipantsData(prev => {
            if (prev.length < pax) {
                // Add new empty participant objects
                const newItems = Array(pax - prev.length).fill(null).map(() => ({
                    name: '',
                    ktp: '',
                    dob: '',
                    gender: 'Laki-laki',
                    phone: '',
                    email: ''
                }));
                return [...prev, ...newItems];
            } else if (prev.length > pax) {
                return prev.slice(0, pax);
            }
            return prev;
        });
    }, [pax]);

    // 2. Add Package Variant Price (Multiple)
    let variantPrice = 0;
    let selectedPackageName = 'Basic (Tanpa Add-on)';

    if (hasPackages && selectedPackageIndices.length > 0) {
        const selectedNames = [];
        selectedPackageIndices.forEach(idx => {
            const pkg = packages[idx];
            if (pkg) {
                // Assume 0th item is the main additive price
                const pPrice = parseInt(pkg.items?.[0]?.price || 0);
                variantPrice += pPrice;
                selectedNames.push(pkg.name);
            }
        });
        selectedPackageName = selectedNames.join(', ');
    }

    // 3. Tax & Discount Calculation
    const discountPct = trip?.discount_percentage || 0;

    // activeBasePrice is treated as "Harga Normal" (Before Discount)
    const pricePerPaxNormal = activeBasePrice;
    const pricePerPaxDiscount = Math.round(pricePerPaxNormal * (discountPct / 100));
    const pricePerPaxFinal = pricePerPaxNormal - pricePerPaxDiscount;

    // Total Price Calculation
    const totalNormalPrice = pricePerPaxNormal * pax;
    const totalDiscount = pricePerPaxDiscount * pax;
    const totalVariantPrice = variantPrice * pax;

    // Subtotal (Base + Variants - Discount)
    const subtotal = (pricePerPaxFinal * pax) + totalVariantPrice;

    // Tax
    const taxRate = (paymentSettings?.tax_percentage ?? 0) / 100;
    const taxAmount = Math.round(subtotal * taxRate);
    const totalWithTax = subtotal + taxAmount;
    const totalToPay = paymentType === 'dp' ? Math.round(totalWithTax * 0.5) : totalWithTax;
    // ------------------------------------

    const handleBooking = async () => {
        // 1. Check Auth
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            const event = new CustomEvent('open-auth-modal', {
                detail: { mode: 'login', alertMessage: 'Oops, maaf kamu belum masuk' }
            });
            window.dispatchEvent(event);
            return;
        }

        setIsProcessing(true);
        setShowPopup(true);

        try {
            const totalPrice = totalWithTax;
            const userId = session?.user?.id;
            // Generate a simpler Order ID for readability
            const orderId = `TRIP-${Date.now().toString().slice(-6)}`;

            // 1. Insert to Supabase (Record Pending Transaction)
            const { data: transaction, error } = await supabase.from('transactions').insert({
                product_id: trip.id,
                user_id: userId,
                amount: totalToPay,
                status: 'pending',
                date: selectedSchedule?.date, // Save the selected date
                items: `${trip.title} - ${selectedDateString} (${selectedPackageName}) - ${pax} Pax - MP: ${selectedMeetingPoint?.name || '-'} - (${paymentType.toUpperCase()})`,
                participants: participantsData, // Now storing full objects
                meeting_point: selectedMeetingPoint?.name,
                payment_method: 'Manual Transfer'
            }).select().single();

            if (error) throw error;
            setCurrentTransactionId(transaction.id);

            // Wait a bit for the user to see "Processing"
            await new Promise(resolve => setTimeout(resolve, 1500));

            setIsProcessing(false);
            setShowPopup(false);

            // Open Payment Choice Modal
            setShowPaymentModal(true);

        } catch (err) {
            alert("Gagal memproses pesanan: " + err.message);
            console.error(err);
            setIsProcessing(false);
            setShowPopup(false);
        }
    };

    // Load Midtrans Snap Script
    useEffect(() => {
        if (!paymentSettings) return;

        const scriptUrl = paymentSettings.mode === 'sandbox'
            ? 'https://app.sandbox.midtrans.com/snap/snap.js'
            : 'https://app.midtrans.com/snap/snap.js';

        const clientKey = paymentSettings.mode === 'sandbox'
            ? paymentSettings.sandbox_client_key
            : paymentSettings.prod_client_key;

        // Check if script already loaded
        const scriptId = 'midtrans-script';
        const existingScript = document.getElementById(scriptId);

        if (!existingScript) {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.id = scriptId;
            script.setAttribute('data-client-key', clientKey);
            script.async = true;
            document.body.appendChild(script);
        } else {
            // If switching modes, might need to reload script, but usually simple refresh handles it.
            // For now assume page reload on settings change or robust enough.
        }

        return () => {
            // Optional cleanup
        }
    }, [paymentSettings]);

    const [showMockSnap, setShowMockSnap] = useState(false);

    // Mock Snap Component
    const SnapMock = ({ onClose, onSuccess, total, orderId }) => {
        const [method, setMethod] = useState(null);
        const [isPaid, setIsPaid] = useState(false);

        const methods = [
            { id: 'gopay', name: 'GoPay / QRIS', icon: 'https://docs.midtrans.com/asset/image/payment-list/gopay.png' },
            { id: 'va', name: 'Virtual Account', icon: 'https://docs.midtrans.com/asset/image/payment-list/bca.png' },
            { id: 'cc', name: 'Credit / Debit Card', icon: 'https://docs.midtrans.com/asset/image/payment-list/visa.png' },
        ];

        const handlePay = () => {
            setIsPaid(true);
            setTimeout(() => {
                onSuccess();
            }, 1000);
        };

        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fadeIn">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">Total</h3>
                            <p className="font-bold text-xl text-primary">Rp {total.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Order ID</p>
                            <p className="text-xs font-mono text-gray-600">{orderId}</p>
                        </div>
                    </div>

                    {/* Content */}
                    < div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3" >
                        {!method ? (
                            <>
                                <p className="text-sm font-semibold text-gray-500 mb-2">Select Payment Method</p>
                                {methods.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMethod(m.id)}
                                        className="w-full bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between hover:border-primary transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Simplified Icon Placeholder if image fails */}
                                            <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-500 font-bold">
                                                IMG
                                            </div>
                                            <span className="font-medium text-gray-700 group-hover:text-primary transition-colors">{m.name}</span>
                                        </div>
                                        <ArrowRight size={16} className="text-gray-300 group-hover:text-primary" />
                                    </button>
                                ))}
                            </>
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 animate-slideIn">
                                <button onClick={() => setMethod(null)} className="text-xs text-blue-600 font-bold mb-2 flex items-center gap-1 hover:underline">
                                    <ArrowLeft size={12} /> Change Method
                                </button>

                                {method === 'va' && (
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-800 border-b pb-2">BCA Virtual Account</h4>
                                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <p className="text-xs text-gray-500">Virtual Account Number</p>
                                            <p className="text-xl font-mono font-bold text-gray-800 tracking-wider">88000 812 3456 789</p>
                                        </div>
                                        <div className="bg-yellow-50 p-2 rounded text-[10px] text-yellow-800 border border-yellow-100">
                                            Please complete payment within 23:59:59.
                                        </div>
                                    </div>
                                )}

                                {method === 'gopay' && (
                                    <div className="flex flex-col items-center py-4 space-y-4">
                                        <h4 className="font-bold text-gray-800">Scan QRIS with Gojek/OVO</h4>
                                        <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                            <p className="text-xs text-gray-400 font-bold">QR CODE SIMULATION</p>
                                        </div>
                                    </div>
                                )}

                                {method === 'cc' && (
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-gray-800 border-b pb-2">Credit Card Details</h4>
                                        <input type="text" placeholder="Card Number" className="w-full text-sm p-3 border rounded focus:ring-1 focus:ring-primary outline-none" disabled value="4444 4444 4444 4444" />
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="MM/YY" className="w-1/2 text-sm p-3 border rounded focus:ring-1 focus:ring-primary outline-none" disabled value="12/28" />
                                            <input type="text" placeholder="CVV" className="w-1/2 text-sm p-3 border rounded focus:ring-1 focus:ring-primary outline-none" disabled value="123" />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handlePay}
                                    disabled={isPaid}
                                    className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                                >
                                    {isPaid ? <Loader className="animate-spin" size={16} /> : 'Complete Payment'}
                                </button>
                            </div>
                        )}
                    </div >

                    {/* Footer */}
                    < div className="bg-gray-50 p-3 border-t text-center" >
                        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
                    </div >
                </div >
            </div >
        )
    };

    const handlePayWithBalance = async () => {
        if (userBalance < totalToPay) {
            alert("Saldo tidak cukup. Silakan gunakan metode lain.");
            return;
        }

        if (!window.confirm(`Konfirmasi pembayaran Rp ${totalToPay.toLocaleString('id-ID')} menggunakan Saldo Dompet?`)) {
            return;
        }

        setIsProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session.user.id;

            // 1. Deduct Balance
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ balance: userBalance - totalToPay })
                .eq('id', userId);

            if (balanceError) throw balanceError;

            // 2. Update Transaction Status
            const { error: txError } = await supabase
                .from('transactions')
                .update({
                    status: 'success',
                    payment_method: 'Saldo Dompet'
                })
                .eq('id', currentTransactionId);

            if (txError) throw txError;

            // 3. Log Balance Transaction
            await supabase.from('balance_transactions').insert({
                user_id: userId,
                amount: -totalToPay,
                type: 'debit',
                description: `Pembayarana pesanan #${currentTransactionId.substring(0, 8).toUpperCase()}`
            });

            // 4. Update local state
            setUserBalance(prev => prev - totalToPay);

            // 5. Navigate to Success
            navigate(`/payment-success/${currentTransactionId}?mobile=${mobileMode}`);

        } catch (error) {
            console.error("Balance Payment Error:", error);
            alert("Gagal memproses pembayaran saldo: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // ... UI Rendering Updated ...

    const handlePaymentProcess = async () => {
        setIsProcessing(true);
        try {
            if (!currentTransactionId) {
                throw new Error("Transaction ID missing");
            }

            // Always use Manual Payment logic
            const { error } = await supabase
                .from('transactions')
                .update({
                    status: 'waiting_proof',
                    payment_method: 'Manual Transfer'
                })
                .eq('id', currentTransactionId);

            if (error) throw error;

            // Simulate short loading for UX
            await new Promise(resolve => setTimeout(resolve, 1000));
            navigate(`/payment-success/${currentTransactionId}?mobile=${mobileMode}`);

        } catch (error) {
            console.error("Payment Process Error:", error);
            alert("Gagal memproses pembayaran: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleWhatsAppRedirect = () => {
        const phone = "6281818433490";
        const message = `Halo Admin, saya ingin konfirmasi pembayaran:%0A` +
            `*Order ID:* ${currentTransactionId}%0A` +
            `*Trip:* ${trip?.title}%0A` +
            `*Paket:* ${selectedPackageName}%0A` +
            `*Tanggal:* ${selectedDateString}%0A` +
            `*Meeting Point:* ${selectedMeetingPoint?.name || '-'}%0A` +
            `*Peserta:* ${pax} Pax (${participantsData.map(p => p.name).join(', ')})%0A` +
            `*Total:* Rp ${totalWithTax.toLocaleString('id-ID')}`;

        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    };

    const handleTanyaAdmin = () => {
        const phone = "6281818433490";
        const message = `Halo Admin Adventure Trip, saya ingin bertanya tentang paket: ${trip?.title}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleShare = async () => {
        // Construct URL using Slug if available, otherwise ID
        // Note: We use window.location.origin to get the current domain (localhost or production)
        const urlIdentifier = trip?.slug || trip?.id;
        const shareUrl = `${window.location.origin}/trip/${urlIdentifier}`;

        const shareData = {
            title: trip?.title,
            text: `Yuk liburan bareng ke ${trip?.title}! Cek detailnya di sini:`,
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                alert("Link berhasil disalin ke clipboard!");
            }
        } catch (err) {
            console.error("Share error:", err);
        }
    };

    const handleToggleFavorite = () => {
        setIsFavorite(!isFavorite);
        // Toast or simple alert
        if (!isFavorite) {
            // alert("Berhasil ditambahkan ke Wishlist!");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center text-gray-500 flex flex-col items-center gap-2">
                    <Loader className="animate-spin text-primary" size={32} />
                    <p>Memuat detail trip...</p>
                </div>
            </div>
        );
    }


    if (!trip) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip tidak ditemukan</h2>
                    <Link to={mobileMode ? "/mobilemenu" : "/"} className="text-primary hover:underline">Kembali</Link>
                </div>
            </div>
        );
    }

    const { title, location, rating, reviews, gallery, description, itinerary, includes, category } = trip;
    const images = gallery && gallery.length > 0 ? gallery : [trip.image];

    // Tax Calculation (Variables inherited from top scope)

    return (
        <div className={`bg-gray-50 min-h-screen pb-20 font-sans ${mobileMode ? 'max-w-md mx-auto shadow-2xl border-x border-gray-100' : ''}`}>
            {/* Header / Breadcrumb */}
            {mobileMode ? (
                <div className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 py-3 flex items-center gap-3 shadow-sm">
                    <Link to="/mobilemenu" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </Link>
                    <h1 className="font-bold text-md text-gray-900 truncate">Detail Trip</h1>
                </div>
            ) : (
                <div className="bg-white border-b border-gray-100">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center text-sm text-gray-500 gap-2">
                            <Link to="/" className="hover:text-primary">Beranda</Link>
                            <span>/</span>
                            <Link to="/" className="hover:text-primary">Trip</Link>
                            <span>/</span>
                            <span className="text-gray-900 font-medium truncate max-w-[200px]">{title}</span>
                        </div>
                    </div>
                </div>
            )}

            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-pink-100 text-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{category}</span>
                                {trip.discount_percentage > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        Hemat {trip.discount_percentage}%
                                    </span>
                                )}
                                <div className="flex items-center text-gray-500 text-sm">
                                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                    {location}
                                </div>
                            </div>
                            {/* Trip Oleh Badge */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-500 font-medium">
                                    Trip Oleh <span className="text-primary font-bold">{trip.organizer || 'Adventure Trip'}</span>
                                </p>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">{title}</h1>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center">
                                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1" />
                                    <span className="font-bold text-gray-900 mr-1">
                                        {/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trip.id)
                                            ? reviewStats.rating
                                            : rating}
                                    </span>
                                    <span className="text-gray-500">
                                        ({/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trip.id)
                                            ? reviewStats.count
                                            : reviews} reviews)
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span>{trip.features?.duration || trip.duration || (Array.isArray(itinerary) ? `${itinerary.length} Hari` : 'Lihat Detail')}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Eye className="w-4 h-4" />
                                    <span>{formatNumber(viewCount)} Dilihat</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleShare}
                                className="p-2 rounded-full hover:bg-gray-100 border border-gray-200 transition-colors"
                            >
                                <Share2 className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                onClick={handleToggleFavorite}
                                className={`p-2 rounded-full border transition-all ${isFavorite ? 'bg-pink-50 border-primary shadow-sm' : 'hover:bg-gray-100 border-gray-200'}`}
                            >
                                <Heart className={`w-5 h-5 ${isFavorite ? 'text-primary fill-primary' : 'text-gray-600'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Gallery */}
                        <div className="space-y-4">
                            <div className="aspect-video rounded-2xl overflow-hidden shadow-sm">
                                <img
                                    src={images[selectedImage]}
                                    alt={title}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-300'}`}
                                    >
                                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-20 z-10">
                            <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
                                {['deskripsi', 'fasilitas', 'itinerary', 's&k', 'ulasan'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary bg-pink-50/50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                    >
                                        {tab === 's&k' ? 'S&K' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                            {activeTab === 'deskripsi' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <h3 className="text-xl font-bold text-gray-900">Tentang Trip Ini</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                                        {description}
                                    </p>
                                    <div className="bg-pink-50 p-4 rounded-lg border border-pink-100 flex items-center gap-3">
                                        <Award className="w-6 h-6 text-primary shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Adventure Trip “Good Travel for All People”</h4>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'fasilitas' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <h3 className="text-xl font-bold text-gray-900">Harga Termasuk</h3>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc list-inside text-gray-600 ml-2">
                                        {includes && includes.map((item, idx) => (
                                            <li key={idx} className="text-gray-700">{item}</li>
                                        ))}
                                    </ul>
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">Harga Tidak Termasuk</h3>
                                        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
                                            {(trip.features?.excludes || trip.excludes || ['Tiket Pesawat PP', 'Pengeluaran Pribadi', 'Tipping Guide/Crew sukarela']).map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}



                            {activeTab === 'itinerary' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <h3 className="text-xl font-bold text-gray-900">Rencana Perjalanan</h3>
                                    {typeof itinerary === 'string' ? (
                                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{itinerary}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-0">
                                            {itinerary && itinerary.length > 0 ? itinerary.map((item, idx) => (
                                                <div key={idx} className="flex gap-4 group">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-pink-100 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-pink-200 group-hover:bg-primary group-hover:text-white transition-colors">
                                                            {item.day || idx + 1}
                                                        </div>
                                                        {idx !== itinerary.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 my-2 group-hover:bg-pink-100 transition-colors"></div>}
                                                    </div>
                                                    <div className="pb-8">
                                                        <h4 className="font-bold text-gray-900 mb-1">
                                                            Hari ke-{item.day || idx + 1}
                                                            {item.time && <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">{item.time}</span>}
                                                        </h4>
                                                        <p className="text-gray-600">{item.activity}</p>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-gray-500 italic">Jadwal perjalanan belum tersedia.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 's&k' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <h3 className="text-xl font-bold text-gray-900">Syarat & Ketentuan</h3>
                                    {trip.terms && trip.terms.length > 0 ? (
                                        <ul className="list-disc list-inside space-y-3 text-gray-600">
                                            {trip.terms.map((term, idx) => (
                                                <li key={idx} className="text-gray-700">{term}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <ul className="list-disc list-inside space-y-3 text-gray-600">
                                            <li><strong className="text-gray-800">Pendaftaran:</strong> Wajib melakukan DP minimal 50% untuk mengamankan slot.</li>
                                            <li><strong className="text-gray-800">Pelunasan:</strong> Pembayaran lunas maksimal H-7 sebelum keberangkatan.</li>
                                            <li><strong className="text-gray-800">Pembatalan:</strong>
                                                <ul className="pl-6 mt-1 space-y-1 list-circle">
                                                    <li>H-14: Pengembalian dana 50%</li>
                                                    <li>H-7: Dana hangus (tidak ada pengembalian)</li>
                                                </ul>
                                            </li>
                                            <li><strong className="text-gray-800">Reschedule:</strong> Perubahan jadwal diperbolehkan maksimal H-14 (tergantung ketersediaan).</li>
                                            <li><strong className="text-gray-800">Force Majeure:</strong> Jika terjadi bencana alam atau kondisi darurat, trip akan dijadwalkan ulang tanpa biaya tambahan.</li>
                                            <li>Peserta wajib membawa kartu identitas yang berlaku.</li>
                                        </ul>
                                    )}
                                </div>
                            )}

                            {activeTab === 'ulasan' && (
                                <TripReviews
                                    tripId={trip.id}
                                    // initialReviews={trip.reviewsList} 
                                    onReviewSubmitted={() => setStatsRefreshTrigger(prev => prev + 1)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <div></div>
                                {maxQuota > 0 ? (
                                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                        Sisa {maxQuota} Slot
                                    </div>
                                ) : (
                                    <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                        Penuh
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 mb-6">
                                {/* Package Selection (If Available) */}
                                {hasPackages && (
                                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-3">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-xs font-bold text-indigo-900">Pilih Add-on (Bisa lebih dari 1)</label>
                                                {selectedPackageIndices.length > 0 && (
                                                    <button
                                                        onClick={() => setSelectedPackageIndices([])}
                                                        className="text-[10px] underline text-indigo-700 font-bold"
                                                    >
                                                        Reset Add-on
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {packages.map((pkg, idx) => {
                                                    const pkgPrice = parseInt(pkg.items?.[0]?.price || 0);
                                                    const isSelected = selectedPackageIndices.includes(idx);
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedPackageIndices(prev => {
                                                                    if (prev.includes(idx)) {
                                                                        return prev.filter(i => i !== idx);
                                                                    } else {
                                                                        return [...prev, idx];
                                                                    }
                                                                });
                                                            }}
                                                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors flex flex-col items-center gap-0.5 ${isSelected
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                                                                }`}
                                                        >
                                                            <span>{pkg.name}</span>
                                                            <span className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-indigo-600 font-bold'}`}>
                                                                + Rp {pkgPrice.toLocaleString('id-ID')}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tanggal</label>
                                    <div className="mb-4">
                                        <TripCalendar
                                            schedules={schedules}
                                            selectedIndex={selectedScheduleIndex}
                                            onSelect={setSelectedScheduleIndex}
                                            duration={trip.features?.duration || trip.duration}
                                        />
                                    </div>
                                </div>
                                <div className="animate-fadeIn">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Meeting Point</label>
                                    <div className="space-y-2 mb-4">
                                        {meetingPoints.length > 0 ? (
                                            meetingPoints.map((mp, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setSelectedMeetingPoint(mp);
                                                        if (mp.scheduleIndex !== undefined && mp.scheduleIndex !== selectedScheduleIndex) {
                                                            setSelectedScheduleIndex(mp.scheduleIndex);
                                                        }
                                                    }}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${selectedMeetingPoint?.name === mp.name ? 'border-primary bg-blue-50 ring-1 ring-primary' : 'border-gray-200 hover:border-blue-300'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={16} className={selectedMeetingPoint?.name === mp.name ? 'text-primary' : 'text-gray-400'} />
                                                        <span className="text-sm font-medium text-gray-800">{mp.name}</span>
                                                    </div>
                                                    {mp.price > 0 && (
                                                        <span className="text-xs font-bold text-primary">Rp {mp.price.toLocaleString('id-ID')}</span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                                                Meeting point akan diinfokan admin.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Peserta</label>
                                    <div className="flex items-center border border-gray-300 rounded-lg p-1">
                                        <button
                                            onClick={() => setPax(prev => Math.max(1, prev - 1))}
                                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md font-bold text-xl"
                                        >-</button>
                                        <input type="text" value={pax} className="flex-1 text-center font-bold text-gray-900 outline-none w-10" readOnly />
                                        <button
                                            onClick={() => setPax(prev => Math.min(maxQuota, prev + 1))}
                                            className="w-10 h-10 flex items-center justify-center text-primary hover:bg-pink-50 rounded-md font-bold text-xl"
                                            disabled={pax >= maxQuota}
                                        >+</button>
                                    </div>
                                </div>
                            </div>

                            {/* Participant Names Input */}
                            <div className="mb-6 animate-fadeIn">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data Peserta</label>
                                <div className="space-y-2">
                                    {participantsData.map((participant, idx) => (
                                        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                                            <h5 className="font-bold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-100 flex items-center justify-between">
                                                <span>Data Peserta {idx + 1}</span>
                                                {idx === 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Pemesan Utama</span>}
                                            </h5>
                                            <div className="space-y-3">
                                                {/* Nama Lengkap */}
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Nama Lengkap"
                                                        value={participant.name}
                                                        onChange={(e) => {
                                                            const newData = [...participantsData];
                                                            newData[idx].name = e.target.value;
                                                            setParticipantsData(newData);
                                                        }}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    />
                                                    <p className="text-[10px] text-gray-400 mt-1 pl-1">Pastikan sesuai dengan KTP</p>
                                                </div>

                                                {/* Nomor KTP */}
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Nomor KTP"
                                                        value={participant.ktp}
                                                        onChange={(e) => {
                                                            const newData = [...participantsData];
                                                            // Allow only numbers
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            newData[idx].ktp = val;
                                                            setParticipantsData(newData);
                                                        }}
                                                        maxLength={16}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    />
                                                    <p className="text-[10px] text-gray-400 mt-1 pl-1">Diperuntukkan bagi keperluan pihak asuransi perjalanan</p>
                                                </div>

                                                {/* Tanggal Lahir */}
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block pl-1">Tanggal Lahir</label>
                                                    <input
                                                        type="date"
                                                        value={participant.dob}
                                                        onChange={(e) => {
                                                            const newData = [...participantsData];
                                                            newData[idx].dob = e.target.value;
                                                            setParticipantsData(newData);
                                                        }}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-700"
                                                    />
                                                </div>

                                                {/* Jenis Kelamin */}
                                                <div>
                                                    <select
                                                        value={participant.gender}
                                                        onChange={(e) => {
                                                            const newData = [...participantsData];
                                                            newData[idx].gender = e.target.value;
                                                            setParticipantsData(newData);
                                                        }}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white text-gray-700 appearance-none cursor-pointer"
                                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                                                    >
                                                        <option value="Laki-laki">Laki-laki</option>
                                                        <option value="Perempuan">Perempuan</option>
                                                    </select>
                                                </div>

                                                {/* Nomor Ponsel */}
                                                <div>
                                                    <input
                                                        type="tel"
                                                        placeholder="Nomor Ponsel (WA)"
                                                        value={participant.phone}
                                                        onChange={(e) => {
                                                            const newData = [...participantsData];
                                                            newData[idx].phone = e.target.value;
                                                            setParticipantsData(newData);
                                                        }}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    />
                                                </div>

                                                {/* Email Address - Only mandatory for first person maybe? Or all? Assuming all based on form */}
                                                <div>
                                                    <input
                                                        type="email"
                                                        placeholder="Alamat Email"
                                                        value={participant.email}
                                                        onChange={(e) => {
                                                            const newData = [...participantsData];
                                                            newData[idx].email = e.target.value;
                                                            setParticipantsData(newData);
                                                        }}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Type Selection */}
                            <div className="mb-6 animate-fadeIn">
                                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                                    <span>Opsi Pembayaran</span>
                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-normal">Pilih salah satu</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setPaymentType('full')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentType === 'full'
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}`}
                                    >
                                        <span className="font-bold text-sm">Full Payment</span>
                                        <span className="text-[10px] mt-1 opacity-70">Bayar Lunas 100%</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentType('dp')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentType === 'dp'
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}`}
                                    >
                                        <span className="font-bold text-sm">Down Payment (50%)</span>
                                        <span className="text-[10px] mt-1 opacity-70">Booking Fee Terlebih Dahulu</span>
                                    </button>
                                </div>
                                <div className="mt-3 bg-blue-50 border border-blue-100 p-3 rounded-lg">
                                    <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                                        💡 **Catatan:** Jika memilih pelunasan (DP), sisa tagihan 50% wajib dilunasi paling lambat H-7 sebelum keberangkatan.
                                    </p>
                                </div>
                            </div>

                            {/* Order Details / Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4 animate-fadeIn">
                                <h4 className="font-bold text-gray-800 mb-3 text-sm border-b border-gray-200 pb-2">Rincian Pesanan</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Item</span>
                                        <span className="font-medium text-gray-900 text-right w-1/2 line-clamp-1">{title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Tanggal</span>
                                        <span className="font-medium text-gray-900">{selectedDateString}</span>
                                    </div>

                                    {/* Price Breakdown Logic */}
                                    {(() => {
                                        return (
                                            <>
                                                {/* 1. Normal Price (Base from MP) */}
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 whitespace-nowrap">
                                                        Harga Normal ({pax} Pax x Rp {Number(pricePerPaxFinal).toLocaleString('id-ID')})
                                                    </span>
                                                    <span className="font-medium text-gray-900">
                                                        Rp {totalNormalPrice.toLocaleString('id-ID')}
                                                    </span>
                                                </div>

                                                {/* 2. Package Add-ons */}
                                                {hasPackages && totalVariantPrice > 0 && (
                                                    <div className="flex justify-between text-indigo-600">
                                                        <span>Add-on ({selectedPackageName})</span>
                                                        <span className="font-medium">
                                                            + Rp {totalVariantPrice.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* 3. Discount */}
                                                {discountPct > 0 && (
                                                    <div className="flex justify-between text-red-500">
                                                        <span>Diskon ({discountPct}%)</span>
                                                        <span className="font-medium">
                                                            - Rp {totalDiscount.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Tax Breakdown */}
                                                <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                                                    <span className="font-bold text-gray-700">Subtotal</span>
                                                    <span className="font-bold text-gray-900">
                                                        Rp {subtotal.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-gray-500 text-xs mt-1">
                                                    <span>Layanan, Asuransi, & Biaya Lainnya</span>
                                                    <span>+ Rp {taxAmount.toLocaleString('id-ID')}</span>
                                                </div>
                                            </>
                                        );
                                    })()}

                                    <div className="text-xs text-right text-gray-400 mt-1 italic">
                                        Total 1 Item dalam daftar
                                    </div>
                                </div>
                            </div>

                            {/* Total Price Calculation Display */}
                            <div className="mb-4 pt-4 border-t border-gray-100 space-y-2">
                                <div className="flex justify-between items-center text-gray-500 text-sm">
                                    <span>Total (100%)</span>
                                    <span className={paymentType === 'dp' ? 'line-through' : 'font-bold'}>
                                        Rp {totalWithTax.toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {paymentType === 'dp' && (
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-primary font-bold">Tagihan Sekarang (DP 50%)</span>
                                            <span className="text-[10px] text-gray-400">Sisa 50% dibayar H-7</span>
                                        </div>
                                        <span className="text-2xl font-bold text-primary">
                                            Rp {totalToPay.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}

                                {paymentType === 'full' && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-900 font-bold">Total Pembayaran</span>
                                        <span className="text-2xl font-bold text-primary">
                                            Rp {totalToPay.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleBooking}
                                disabled={isProcessing || maxQuota <= 0}
                                className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 mb-3 hover:scale-[1.02] transform duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader className="animate-spin" size={20} /> Memproses...
                                    </>
                                ) : (maxQuota <= 0 ? 'Habis Terjual' : 'Bayar')}
                            </button>

                            <button
                                onClick={handleTanyaAdmin}
                                className="w-full bg-white text-gray-700 border border-gray-300 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={18} className="text-green-500" />
                                Tanya Admin
                            </button>

                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                                <ShieldCheck className="w-4 h-4 text-green-500" />
                                <span>Transaksi Aman & Terpercaya</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main >

            {/* Booking Processing / Success Popup */}
            {
                showPopup && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100 transition-transform">
                            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                                <Clock className="w-10 h-10 text-primary animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Memproses Pesanan</h3>
                            <p className="text-gray-500 mb-6">Mohon menunggu sebentar...</p>
                        </div>
                    </div>
                )
            }

            {/* Payment Selection Modal */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                            {/* Decoration */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Pembayaran</h3>
                                {paymentSettings?.mode === 'sandbox' ? (
                                    <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full uppercase tracking-wide border border-yellow-200">
                                        Sandbox Mode (Simulasi)
                                    </span>
                                ) : (
                                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase tracking-wide border border-green-200">
                                        Manual Confirmation
                                    </span>
                                )}
                            </div>

                            {/* Payment Method Selection (HIDDEN - FORCED MANUAL) */}
                            {/* 
                            <div className="flex justify-between mb-4">
                                <span className="text-gray-500">Metode</span>
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200">
                                    Transfer Bank Manual
                                </span>
                            </div>
                            */}

                            <div className="space-y-4">
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-left mb-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-500">Total Tagihan</span>
                                            <span className="font-bold text-gray-900">Rp {(Math.round(totalWithTax)).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between text-xs pt-2 border-t border-gray-200">
                                            <span className="text-gray-500">Saldo Kamu</span>
                                            <span className={`font-bold ${userBalance >= totalToPay ? 'text-green-600' : 'text-red-500'}`}>
                                                Rp {userBalance.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Option 1: Saldo */}
                                        <button
                                            onClick={handlePayWithBalance}
                                            disabled={isProcessing || userBalance < totalToPay}
                                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-between px-6 transition-all border-2 ${userBalance >= totalToPay
                                                ? 'bg-primary text-white border-primary shadow-lg shadow-pink-200 hover:scale-[1.02]'
                                                : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <CreditCard size={20} />
                                                <span>Bayar pakai Saldo</span>
                                            </div>
                                            {userBalance < totalToPay && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded">Saldo Kurang</span>}
                                        </button>

                                        {/* Option 2: Manual Transfer */}
                                        <button
                                            onClick={handlePaymentProcess}
                                            disabled={isProcessing}
                                            className="w-full bg-white text-orange-600 border-2 border-orange-500 py-4 rounded-xl font-bold hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Upload size={18} />
                                            Transfer Bank (Manual)
                                        </button>

                                        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400">
                                            <ShieldCheck className="w-3 h-3 text-green-500" />
                                            <span>Pembayaran aman & terverifikasi sistem</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                showMockSnap && (
                    <SnapMock
                        onClose={() => setShowMockSnap(false)}
                        total={currentPrice * pax}
                        orderId={currentTransactionId}
                        onSuccess={async () => {
                            // Update transaction status
                            await supabase.from('transactions').update({ status: 'confirmed' }).eq('id', currentTransactionId);
                            setShowMockSnap(false);
                            navigate(`/payment-success/${currentTransactionId}?mobile=${mobileMode}`);
                        }}
                    />
                )
            }
        </div >
    );
};

export default TripDetail;
