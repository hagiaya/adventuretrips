import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, X, Upload, Loader, CheckCircle, Circle, Edit2 } from 'lucide-react';

const PopupManagement = () => {
    const [popups, setPopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        description: '',
        cta_text: 'Lihat Detail',
        cta_link: '',
        is_active: true
    });

    useEffect(() => {
        fetchPopups();
    }, []);

    const fetchPopups = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('site_popups')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                // If table doesn't exist yet, handle gracefully
                if (error.code === '42P01') {
                    console.warn("Table site_popups not found yet.");
                    setPopups([]);
                    return;
                }
                throw error;
            }
            setPopups(data || []);
        } catch (error) {
            console.error('Error fetching popups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (popup = null) => {
        if (popup) {
            setFormData({
                id: popup.id,
                title: popup.title || '',
                description: popup.description || '',
                cta_text: popup.cta_text || 'Lihat Detail',
                cta_link: popup.cta_link || '',
                is_active: popup.is_active
            });
        } else {
            setFormData({
                id: null,
                title: '',
                description: '',
                cta_text: 'Chat Kami Sekarang!',
                cta_link: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                cta_text: formData.cta_text,
                cta_link: formData.cta_link,
                is_active: formData.is_active
            };

            let error;
            if (formData.id) {
                // Update
                const { error: updateError } = await supabase
                    .from('site_popups')
                    .update(payload)
                    .eq('id', formData.id);
                error = updateError;
            } else {
                // Insert
                // If this is the first one active, or if we want to deactivate others when adding new one?
                // For now, allow multiple active or let user manage.
                const { error: insertError } = await supabase
                    .from('site_popups')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            setIsModalOpen(false);
            fetchPopups();
        } catch (error) {
            alert('Gagal menyimpan popup: ' + error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const toggleStatus = async (popup) => {
        try {
            const { error } = await supabase
                .from('site_popups')
                .update({ is_active: !popup.is_active })
                .eq('id', popup.id);

            if (error) throw error;
            fetchPopups();
        } catch (err) {
            alert("Gagal mengubah status: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus popup ini?')) return;
        try {
            const { error } = await supabase.from('site_popups').delete().eq('id', id);
            if (error) throw error;
            fetchPopups();
        } catch (error) {
            alert('Gagal menghapus: ' + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Popup Info</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span>Buat Popup Baru</span>
                </button>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                            <tr>
                                <th className="px-6 py-4">Judul & Konten</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader className="animate-spin" size={16} /> Memuat data...
                                        </div>
                                    </td>
                                </tr>
                            ) : popups.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500 italic">
                                        Belum ada popup yang dibuat.
                                    </td>
                                </tr>
                            ) : (
                                popups.map((popup) => (
                                    <tr key={popup.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 max-w-md">
                                            <p className="font-bold text-gray-900 mb-1">{popup.title}</p>
                                            <p className="text-gray-500 line-clamp-2 text-xs">{popup.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(popup)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${popup.is_active
                                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {popup.is_active ? <CheckCircle size={12} /> : <Circle size={12} />}
                                                {popup.is_active ? 'Aktif' : 'Non-Aktif'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(popup)}
                                                    className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(popup.id)}
                                                    className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-[fadeIn_0.3s_ease-out] flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-900">
                                {formData.id ? 'Edit Popup' : 'Buat Popup Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Popup</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="Contoh: Promo Spesial Liburan!"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi / Konten</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none min-h-[120px]"
                                    placeholder="Tulis detail promo atau info disini..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Bisa memuat detail panjang.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teks Tombol (CTA)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Contoh: Chat Kami"
                                        value={formData.cta_text}
                                        onChange={e => setFormData({ ...formData, cta_text: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Tombol</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="https://wa.me/..."
                                        value={formData.cta_link}
                                        onChange={e => setFormData({ ...formData, cta_link: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="rounded border-gray-300 text-primary w-4 h-4"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-700 font-medium">Aktifkan Popup ini</label>
                            </div>

                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-pink-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg mt-4"
                            >
                                {submitLoading ? 'Menyimpan...' : 'Simpan Popup'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PopupManagement;
