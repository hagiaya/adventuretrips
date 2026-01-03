import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { trips as staticTrips } from '../data/trips';

export const useTrips = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('is_deleted', false)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.warn("Supabase fetch error, using static data:", error.message);
                    setTrips(staticTrips);
                } else if (!data || data.length === 0) {
                    console.log("No data in Supabase, utilizing static data as fallback.");
                    setTrips(staticTrips);
                } else {
                    // Normalize data structure if needed to match staticTrips
                    const normalizedTrips = data.map(item => {
                        // 1. Get Schedules (Check legacy 'features' location too)
                        const schedules = item.schedules || item.features?.schedules || [];

                        // 2. Find Lowest Base (MP) Price
                        let lowestBasePrice = Infinity;

                        if (Array.isArray(schedules) && schedules.length > 0) {
                            schedules.forEach(sched => {
                                // Parse Schedule Price first
                                const schedPrice = parseInt(sched.price?.toString().replace(/[^0-9]/g, '') || '0');

                                // Check Meeting Points
                                const mps = sched.meetingPoints || sched.meeting_points || [];
                                if (Array.isArray(mps) && mps.length > 0) {
                                    mps.forEach(mp => {
                                        let p = 0;
                                        // If mp is object with price, use it
                                        if (typeof mp === 'object' && mp.price) {
                                            p = parseInt(mp.price.toString().replace(/[^0-9]/g, '') || '0');
                                        }
                                        // If mp is string or no price, use schedule price
                                        else {
                                            p = schedPrice;
                                        }

                                        if (p > 0 && p < lowestBasePrice) lowestBasePrice = p;
                                    });
                                } else {
                                    // No MPs, use Schedule Price
                                    if (schedPrice > 0 && schedPrice < lowestBasePrice) lowestBasePrice = schedPrice;
                                }
                            });
                        }

                        // 3. Determine Final Display & Original Price
                        let finalDisplayPrice = item.price;
                        let finalOriginalPrice = item.features?.original_price || null;

                        if (lowestBasePrice !== Infinity) {
                            const discountPct = item.discount_percentage || 0;

                            // MP Price is the "Normal" Price
                            const normalPrice = lowestBasePrice;

                            if (discountPct > 0) {
                                const discountAmount = Math.round(normalPrice * (discountPct / 100));
                                const afterDiscount = normalPrice - discountAmount;

                                finalDisplayPrice = afterDiscount; // As Number
                                finalOriginalPrice = "Rp " + normalPrice.toLocaleString('id-ID'); // As String
                            } else {
                                finalDisplayPrice = normalPrice; // As Number
                                finalOriginalPrice = null;
                            }
                        } else {
                            // Fallback
                            const parsed = parseInt(item.price?.toString().replace(/[^0-9]/g, '')) || 0;
                            if (parsed > 0) finalDisplayPrice = parsed;
                        }

                        return {
                            ...item,
                            id: item.id?.toString(),
                            image: item.image_url || item.image,
                            gallery: item.gallery || [item.image_url],
                            reviews: item.reviews_count || "0",
                            rating: (parseInt(item.reviews_count) > 0 && item.rating !== null) ? item.rating : 0,
                            views: item.views_count || 0,
                            duration: item.features?.duration || (Array.isArray(item.itinerary) ? item.itinerary.length + " Hari" : "Lihat Detail"),
                            price: finalDisplayPrice,
                            original_price: finalOriginalPrice,
                            organizer: item.organizer || item.features?.organizer || 'Adventure Trip'
                        };
                    });
                    setTrips(normalizedTrips);
                }
            } catch (err) {
                console.error("Unexpected error, using static data:", err);
                setTrips(staticTrips);
            } finally {
                setLoading(false);
            }
        };

        fetchTrips();
    }, []);

    return { trips, loading, error };
};

export const useTrip = (id) => {
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTrip = async () => {
        if (!id) return;
        setLoading(true);
        try {
            // Determine search column based on input format (UUID vs Slug)
            const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
            const column = isUuid ? 'id' : 'slug';

            // Try fetching from Supabase first
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq(column, id)
                .eq('is_deleted', false)
                .single();

            if (data) {
                const normalizedTrip = {
                    ...data,
                    id: data.id?.toString(),
                    image: data.image_url || data.image,
                    gallery: data.gallery || [data.image_url || data.image],
                    reviews: data.reviews_count || "0", // Map DB column to prop
                    rating: (parseInt(data.reviews_count) > 0 && data.rating !== null) ? data.rating : 0,
                    // Ensure JSONB fields are parsed if Supabase returns them as strings (usually auto-parsed by JS client)
                    itinerary: data.itinerary || data.features?.itinerary || [],
                    includes: data.includes || data.features?.includes || [],
                    meeting_point: data.meeting_point || data.features?.meeting_point || null,
                    terms: data.terms || data.features?.terms || null
                };
                setTrip(normalizedTrip);
            } else {
                // Fallback to static data
                const found = staticTrips.find(t => t.id === id || t.id.toString() === id);
                if (found) {
                    setTrip(found);
                } else {
                    setError("Trip not found");
                }
            }
        } catch (err) {
            // Fallback catch
            const found = staticTrips.find(t => t.id === id || t.id.toString() === id);
            if (found) setTrip(found);
            else setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrip();
    }, [id]);

    return { trip, loading, error, refetch: fetchTrip };
};
