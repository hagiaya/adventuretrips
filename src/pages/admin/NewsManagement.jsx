import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Search, Edit, Trash2, X, Image as ImageIcon, Calendar, Loader } from 'lucide-react';

const NewsManagement = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        excerpt: '',
        image_url: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Published'
    });

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .order('date', { ascending: false });

            if (error) {
                // If table doesn't exist, we might get an error, just ignore for now or log
                console.error('Error fetching news:', error.message);
            } else {
                setNews(data || []);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setFormData({
                id: item.id,
                title: item.title,
                excerpt: item.excerpt || '',
                image_url: item.image_url,
                date: item.date,
                status: item.status || 'Published'
            });
        } else {
            setFormData({
                id: null,
                title: '',
                excerpt: '',
                image_url: '',
                date: new Date().toISOString().split('T')[0],
                status: 'Published'
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus berita ini?')) return;

        try {
            const { error } = await supabase.from('news').delete().eq('id', id);
            if (error) throw error;
            fetchNews();
        } catch (err) {
            alert('Gagal menghapus berita: ' + err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);

        try {
            const payload = {
                title: formData.title,
                excerpt: formData.excerpt,
                image_url: formData.image_url,
                date: formData.date,
                status: formData.status
            };

            let error;
            if (formData.id) {
                // Update
                const { error: updateError } = await supabase
                    .from('news')
                    .update(payload)
                    .eq('id', formData.id);
                error = updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('news')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            setIsModalOpen(false);
            fetchNews();
        } catch (err) {
            alert('Gagal menyimpan berita: ' + err.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Berita</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span>Tulis Berita</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader className="animate-spin text-primary" />
                </div>
            ) : news.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">Belum ada berita. Silakan tambahkan berita baru.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
                            <div className="h-48 overflow-hidden relative">
                                <img
                                    src={item.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                    <Calendar size={12} />
                                    <span>{item.date}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-4 line-clamp-2">{item.title}</h3>
                                <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="flex-1 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Trash2 size={16} /> Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">{formData.id ? 'Edit Berita' : 'Tulis Berita Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Berita</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link Gambar (URL)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        required
                                        value={formData.image_url}
                                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                                >
                                    <option value="Published">Published</option>
                                    <option value="Draft">Draft</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ringkasan / Isi Singkat</label>
                                <textarea
                                    rows={4}
                                    value={formData.excerpt}
                                    onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                                    placeholder="Tulis ringkasan berita..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-pink-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {submitLoading ? 'Menyimpan...' : 'Simpan Berita'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsManagement;
