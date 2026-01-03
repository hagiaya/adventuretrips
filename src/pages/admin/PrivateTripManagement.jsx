import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Crown, Calendar, MapPin, DollarSign, Mail, Phone, User, CheckCircle } from 'lucide-react';

const PrivateTripManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('trip_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching private trip requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkContacted = async (id, currentStatus) => {
        // Toggle status or logic to mark as contacted
        // Assuming there is a 'status' column in trip_requests. If not, we might need to add it.
        // For now, let's assume we want to just alert.
        alert("Fitur update status akan segera hadir (memerlukan kolom status di database).");
    };

    const filteredRequests = requests.filter(req => {
        const term = searchTerm.toLowerCase();
        return (
            req.full_name?.toLowerCase().includes(term) ||
            req.destination?.toLowerCase().includes(term) ||
            req.email?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Crown className="text-primary" /> Permintaan Private Trip
                </h1>
                <button onClick={fetchRequests} className="text-primary hover:underline text-sm font-medium">Refresh Data</button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama pemesan, destinasi, atau email..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Memuat permintaan...</div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
                        Belum ada permintaan Private Trip.
                    </div>
                ) : (
                    filteredRequests.map((req) => (
                        <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                {/* Left: Main Info */}
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{req.destination}</h3>
                                            {req.pickup_point && (
                                                <p className="text-xs font-bold text-primary flex items-center gap-1 mt-0.5">
                                                    <MapPin size={12} /> Point: {req.pickup_point}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                <Calendar size={14} />
                                                <span>{new Date(req.start_date).toLocaleDateString()} ({req.duration} Hari)</span>
                                                <span className="text-gray-300">|</span>
                                                <User size={14} />
                                                <span>{req.pax} Pax</span>
                                            </div>
                                        </div>
                                        <div className="md:hidden">
                                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold">New</span>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gray-400" />
                                            <span className="font-medium text-gray-700">{req.full_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} className="text-gray-400" />
                                            <a href={`https://wa.me/${req.phone}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                                                {req.phone}
                                            </a>
                                        </div>
                                        {req.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-gray-400" />
                                                <span className="text-gray-600 truncate">{req.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Details & Budget */}
                                <div className="flex-1 space-y-4 border-l border-gray-100 md:pl-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Budget Range (Per Pax)</p>
                                        <div className="flex items-center gap-1 font-mono font-bold text-gray-800">
                                            <DollarSign size={16} className="text-green-600" />
                                            <span>
                                                Rp {req.budget_min?.toLocaleString()} - Rp {req.budget_max?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {req.special_requests && (
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Catatan Khusus</p>
                                            <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-100 italic">
                                                "{req.special_requests}"
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-2 flex gap-2">
                                        <a
                                            href={`https://wa.me/${req.phone}?text=Halo ${req.full_name}, kami dari Adventure Trip merespon request Private Trip Anda ${req.pickup_point ? `dari ${req.pickup_point} ` : ''}ke ${req.destination}.`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 bg-green-500 text-white text-center py-2 rounded-lg font-bold hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            <Phone size={16} /> Hubungi via WA
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PrivateTripManagement;
