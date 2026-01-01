import React, { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const TripReviews = ({ tripId, initialReviews = [], onReviewSubmitted }) => {
    const [reviews, setReviews] = useState(initialReviews);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            // Check if tripId is UUID (real DB). Static IDs are strings like 'labuan-bajo'
            const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(tripId);

            if (!isUuid) {
                // For static trips, just ensure we use what's passed
                setReviews(initialReviews || []);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('product_id', tripId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.warn("Reviews fetch error:", error.message);
                    // On error, keep existing or fallback
                    setReviews(prev => prev.length > 0 ? prev : (initialReviews || []));
                } else {
                    // If we got a response (even empty), it's the source of truth for DB items
                    setReviews(data);
                }
            } catch (err) {
                console.error("Error fetching reviews:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripId]);

    const [user, setUser] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) return;
        if (!newComment.trim()) {
            alert('Mohon tulis ulasan Anda');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from('reviews').insert({
                product_id: tripId,
                user_id: user.id,
                user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna',
                avatar_url: user.user_metadata?.avatar_url,
                rating: newRating,
                comment: newComment,
                created_at: new Date().toISOString() // Explicit timestamp often helps with optimistic updates
            });

            if (error) throw error;

            setNewComment('');
            setNewRating(5);
            // Re-fetch reviews
            const { data } = await supabase
                .from('reviews')
                .select('*')
                .eq('product_id', tripId)
                .order('created_at', { ascending: false });

            if (data) setReviews(data);

            // Notify parent to refresh product rating
            if (onReviewSubmitted) onReviewSubmitted();

        } catch (error) {
            console.error("Error submitting review:", error);
            alert("Gagal mengirim ulasan: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Ulasan Pengguna</h3>

                {/* Review Form */}
                {user ? (
                    <form onSubmit={handleSubmitReview} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {user.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-6 h-6 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-sm mb-1">
                                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna'}
                                </h4>
                                <p className="text-xs text-gray-500">Bagikan pengalamanmu tentang trip ini</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Rating</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setNewRating(star)}
                                        className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            className={`w-6 h-6 ${star <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Ulasan</label>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Ceritakan pengalaman seru kamu..."
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px]"
                                required
                            ></textarea>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center mb-8">
                        <p className="text-blue-800 text-sm mb-2">Ingin menulis ulasan?</p>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))}
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-pink-700 transition-colors"
                        >
                            Login untuk Mengulas
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-4 text-gray-400">Memuat ulasan...</div>
            ) : reviews.length === 0 ? (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
                    <p className="text-gray-500 mb-2">Belum ada ulasan untuk trip ini.</p>
                    <p className="text-sm text-gray-400">Jadilah yang pertama menulis ulasan!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review, idx) => (
                        <div key={review.id || idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                        {review.avatar_url ? (
                                            <img src={review.avatar_url} alt={review.user_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-6 h-6 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">{review.user_name || 'Pengguna'}</h4>
                                        <p className="text-xs text-gray-400">
                                            {review.date || (review.created_at ? new Date(review.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Baru saja')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex bg-yellow-50 px-2 py-1 rounded-md text-xs items-center gap-1 border border-yellow-100">
                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                    <span className="font-bold text-yellow-700">{review.rating}</span>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                "{review.comment}"
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TripReviews;
