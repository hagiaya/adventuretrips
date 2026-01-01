import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, X, Image as ImageIcon, Loader, Upload } from 'lucide-react';

const BannerManagement = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        image_url: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBanners(data || []);
        } catch (error) {
            console.error('Error fetching banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({ title: '', image_url: '' });
        setSelectedFile(null);
        setPreviewUrl('');
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const uploadImage = async () => {
        if (!selectedFile) return null;

        const fileName = `banner-${Date.now()}-${selectedFile.name.replace(/\s+/g, '-')}`;
        const { data, error } = await supabase.storage
            .from('banners')
            .upload(fileName, selectedFile);

        if (error) {
            throw new Error('Gagal mengupload gambar: ' + error.message);
        }

        const { data: publicData } = supabase.storage
            .from('banners')
            .getPublicUrl(fileName);

        return publicData.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || (!selectedFile && !formData.image_url)) {
            alert('Mohon lengkapi judul dan gambar.');
            return;
        }

        setSubmitLoading(true);
        try {
            let imageUrl = formData.image_url;
            if (selectedFile) {
                imageUrl = await uploadImage();
            }

            const { error } = await supabase
                .from('banners')
                .insert([{
                    title: formData.title,
                    image_url: imageUrl
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            fetchBanners();
        } catch (error) {
            alert('Gagal menyimpan banner: ' + error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus banner ini?')) return;

        try {
            const { error } = await supabase.from('banners').delete().eq('id', id);
            if (error) throw error;
            fetchBanners();
        } catch (error) {
            alert('Gagal menghapus: ' + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Banner Promo</h1>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
                    disabled={banners.length >= 3}
                >
                    <Plus size={20} />
                    <span>Tambah Banner {banners.length}/3</span>
                </button>
            </div>

            {/* Warning if 3 banners reached */}
            {banners.length >= 3 && (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center gap-2 text-sm border border-yellow-200">
                    <span className="font-bold">Info:</span> Maksimal 3 banner yang ditampilkan di halaman depan. Hapus salah satu untuk menambah baru.
                </div>
            )}

            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-gray-500 flex flex-col items-center">
                        <Loader className="animate-spin mb-2" />
                        <p>Memuat banner...</p>
                    </div>
                ) : banners.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        <p>Belum ada banner promo.</p>
                    </div>
                ) : (
                    banners.map((banner) => (
                        <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                            <div className="aspect-[16/9] relative bg-gray-100">
                                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                    <p className="text-white font-bold truncate">{banner.title}</p>
                                </div>
                            </div>
                            <div className="p-4 flex justify-end">
                                <button
                                    onClick={() => handleDelete(banner.id)}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-sm transition-colors"
                                >
                                    <Trash2 size={16} />
                                    <span>Hapus</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-900">Tambah Banner Promo</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Promo</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="Contoh: Diskon Akhir Tahun"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Banner</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        required={!formData.image_url}
                                    />
                                    {previewUrl ? (
                                        <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-500 py-4">
                                            <Upload size={24} />
                                            <span className="text-sm">Upload Gambar</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-pink-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg mt-4"
                            >
                                {submitLoading ? 'Menyimpan...' : 'Simpan Banner'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BannerManagement;
