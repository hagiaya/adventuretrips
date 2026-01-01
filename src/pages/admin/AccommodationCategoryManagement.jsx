import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Upload, X, Plus, Trash2, Camera, Loader, Save, ChevronRight } from 'lucide-react';

const CATEGORY_OPTIONS = ["Hotel", "Villa", "Resort", "Glamping", "Homestay", "Losmen", "Umum"];

const AccommodationCategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: CATEGORY_OPTIONS[0],
        description: '',
        gallery: []
    });

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('accommodation_categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching categories:', error);
        } else {
            setCategories(data || []);
        }
        setLoading(false);
    };

    const handleOpenModal = (cat = null) => {
        if (cat) {
            setEditingCategory(cat);
            setFormData({
                name: cat.name,
                description: cat.description || '',
                gallery: cat.gallery || []
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: CATEGORY_OPTIONS[0],
                description: '',
                gallery: []
            });
        }
        setSelectedFiles([]);
        setPreviewUrls([]);
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);

        const urls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...urls]);
    };

    const removeSelectedFile = (index) => {
        URL.revokeObjectURL(previewUrls[index]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const removeGalleryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);

        try {
            const totalImages = formData.gallery.length + selectedFiles.length;
            if (totalImages < 5) {
                alert('Minimal upload 5 gambar untuk setiap kategori.');
                setSubmitLoading(false);
                return;
            }

            let newImageUrls = [];
            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                    const filePath = `categories/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('product-images')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('product-images')
                        .getPublicUrl(filePath);

                    newImageUrls.push(publicUrl);
                }
            }

            const finalGallery = [...formData.gallery, ...newImageUrls];

            const payload = {
                name: formData.name,
                description: formData.description,
                gallery: finalGallery
            };

            if (editingCategory) {
                const { error } = await supabase
                    .from('accommodation_categories')
                    .update(payload)
                    .eq('id', editingCategory.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('accommodation_categories')
                    .insert(payload);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Gagal menyimpan kategori: ' + error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus kategori ini?')) return;

        const { error } = await supabase
            .from('accommodation_categories')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Gagal menghapus: ' + error.message);
        } else {
            fetchCategories();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kategori Akomodasi</h1>
                    <p className="text-gray-500 text-sm">Kelola tipe akomodasi dan galeri fotonya</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-100"
                >
                    <Plus size={20} />
                    <span>Tambah Kategori</span>
                </button>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                    <Loader className="animate-spin text-primary mx-auto mb-4" size={32} />
                    <p className="text-gray-500">Memuat kategori...</p>
                </div>
            ) : categories.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <Camera size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Kategori</h3>
                    <p className="text-gray-500 mb-6 max-w-xs mx-auto text-sm">Klik tombol Tambah Kategori untuk mulai mengelola galeri tipe akomodasi.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat) => (
                        <div key={cat.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="aspect-video relative overflow-hidden">
                                <img
                                    src={cat.gallery[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    alt={cat.name}
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(cat)}
                                        className="p-2 bg-white/90 backdrop-blur rounded-full text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 bg-white/90 backdrop-blur rounded-full text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="absolute top-2 left-2 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase">
                                    {cat.gallery.length} Foto
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-gray-900 text-lg">{cat.name}</h3>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </div>
                                <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px] mb-4">{cat.description || 'Tidak ada deskripsi.'}</p>
                                <div className="flex -space-x-2 overflow-hidden">
                                    {cat.gallery.slice(1, 5).map((img, idx) => (
                                        <img key={idx} className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" src={img} alt="" />
                                    ))}
                                    {cat.gallery.length > 5 && (
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 ring-2 ring-white text-[10px] font-bold text-gray-500">
                                            +{cat.gallery.length - 5}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Edit/Add */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">{editingCategory ? 'Edit Galeri Kategori' : 'Tambah Galeri Kategori'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Tipe Akomodasi</label>
                                    <select
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        disabled={editingCategory}
                                    >
                                        {CATEGORY_OPTIONS.map(opt => (
                                            <option key={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
                                <textarea
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none h-24 text-sm"
                                    placeholder="Jelaskan keunggulan tipe akomodasi ini..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Galeri (Min 5 Gambar)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <Upload size={32} />
                                        <p className="font-bold text-sm">Klik atau seret gambar ke sini</p>
                                        <p className="text-xs text-gray-400 uppercase font-medium">Min 5 Gambar • JPG, PNG, WEBP</p>
                                    </div>
                                </div>

                                {/* Previews */}
                                {(formData.gallery.length > 0 || previewUrls.length > 0) && (
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-6">
                                        {formData.gallery.map((url, idx) => (
                                            <div key={`existing-${idx}`} className="aspect-square rounded-xl overflow-hidden relative border border-gray-100 group">
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeGalleryImage(idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {previewUrls.map((url, idx) => (
                                            <div key={`new-${idx}`} className="aspect-square rounded-xl overflow-hidden relative border-2 border-primary/20 group animate-fadeIn">
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSelectedFile(idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Total terpilih: {formData.gallery.length + previewUrls.length} gambar</p>
                            </div>
                        </form>

                        <div className="p-6 border-t bg-gray-50 flex gap-4 shrink-0 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitLoading}
                                className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 disabled:opacity-50"
                            >
                                {submitLoading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                                <span>{editingCategory ? 'Update Kategori' : 'Simpan Kategori'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccommodationCategoryManagement;
