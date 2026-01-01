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
                    .order('created_at', { ascending: false });

                if (error) {
                    console.warn("Supabase fetch error, using static data:", error.message);
                    setTrips(staticTrips);
                } else if (!data || data.length === 0) {
                    console.log("No data in Supabase, utilizing static data as fallback.");
                    setTrips(staticTrips);
                } else {
                    // Normalize data structure if needed to match staticTrips
                    const normalizedTrips = data.map(item => ({
                        ...item,
                        id: item.id?.toString(), // Ensure ID is string for routing consistency
                        image: item.image_url || item.image, // Map image_url to image
                        gallery: item.gallery || [item.image_url],
                        // Ensure other fields are present
                        rating: item.rating || "4.8",
                        reviews: item.reviews_count || "0",
                        views: item.views_count || 0,
                        duration: item.features?.duration || (Array.isArray(item.itinerary) ? item.itinerary.length + " Hari" : "Lihat Detail"),
                        original_price: item.features?.original_price || null,
                        organizer: item.organizer || item.features?.organizer || 'Pandooin'
                    }));
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
            // Try fetching from Supabase first
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                const normalizedTrip = {
                    ...data,
                    id: data.id?.toString(),
                    image: data.image_url || data.image,
                    gallery: data.gallery || [data.image_url || data.image],
                    rating: data.rating || "4.8",
                    reviews: data.reviews_count || "0", // Map DB column to prop
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
