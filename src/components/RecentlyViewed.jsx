import React from 'react';
import { MapPin, Star, Eye, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';
import { formatNumber, formatCurrency } from '../utils/formatters';
import { getRecentlyViewedIds } from '../utils/recentlyViewed';

const SmallTripCard = ({ id, image, title, location, price, rating, category, views, duration, original_price, discount_percentage, type }) => {
    // Determine the detail path based on product type/category
    let path = `/trip/${id}`;
    if (type === 'Accommodation') path = `/stay/${id}`;
    if (type === 'Transportation') path = `/transport/${id}`;

    return (
        <Link to={path} className="block h-full group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex h-24 md:h-28">
                <div className="w-1/3 relative overflow-hidden">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {discount_percentage > 0 && (
                        <div className="absolute top-0 left-0 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg uppercase">
                            -{discount_percentage}%
                        </div>
                    )}
                </div>

                <div className="w-2/3 p-3 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                            <MapPin size={10} className="text-gray-400" />
                            <span className="truncate">{location}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                        <div>
                            {original_price && (
                                <p className="text-[9px] text-gray-400 line-through">
                                    {original_price}
                                </p>
                            )}
                            <p className="text-sm font-bold text-primary">
                                {formatCurrency(price)}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-[10px] text-gray-500">
                            <Star size={10} className="text-secondary fill-secondary" />
                            <span className="font-bold">{rating}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const RecentlyViewed = () => {
    const { trips, loading } = useTrips();
    const [recentTrips, setRecentTrips] = React.useState([]);

    React.useEffect(() => {
        if (!loading && trips.length > 0) {
            const viewedIds = getRecentlyViewedIds();
            if (viewedIds.length > 0) {
                // Map IDs to trip objects, preserving the order of viewedIds
                const filtered = viewedIds
                    .map(id => trips.find(t => t.id === id))
                    .filter(t => t !== undefined);
                setRecentTrips(filtered);
            }
        }
    }, [trips, loading]);

    if (!loading && recentTrips.length === 0) return null;

    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-2 mb-8 border-l-4 border-primary pl-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Terakhir Dilihat</h2>
                        <p className="text-xs text-gray-500">Lanjutkan eksplorasi petualangan Anda sebelumnya</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="min-w-[280px] h-24 bg-gray-50 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentTrips.map((trip) => (
                            <SmallTripCard key={trip.id} {...trip} type={trip.product_type} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default RecentlyViewed;
