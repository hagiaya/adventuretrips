import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Save, Loader, AlertCircle, CheckCircle, Upload, X, Plus } from 'lucide-react';

// Define supported content keys and their types
const CONTENT_TYPES = {
    'terms_conditions': { type: 'html', label: 'Halaman: Syarat & Ketentuan' },
    'mobile_app_promo': { type: 'app_promo', label: 'Section: Promo Aplikasi Mobile' },
    'testimonials': { type: 'testimonials', label: 'Section: Testimoni Pelanggan' },
    'site_logo': { type: 'image', label: 'Aset: Logo Website' },
    'site_favicon': { type: 'image', label: 'Aset: Favicon Website' }
};

const ContentManagement = () => {
    const [contents, setContents] = useState([]);
    const [selectedKey, setSelectedKey] = useState('terms_conditions');
    const [formData, setFormData] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchContents();
    }, []);

    useEffect(() => {
        // Find content in loaded array
        const selected = contents.find(c => c.key === selectedKey);

        if (selected) {
            setFormData({
                title: selected.title || '',
                content: selected.content || ''
            });
        } else {
            // Initialize empty form if not found
            // Special handling: if we switched to a known key, use its label as default title
            if (CONTENT_TYPES[selectedKey]) {
                setFormData({
                    title: CONTENT_TYPES[selectedKey].label,
                    content: ''
                });
            }
        }

        setStatus({ type: '', message: '' });
    }, [selectedKey, contents]);

    const fetchContents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('site_content')
                .select('*')
                .order('key');

            if (error) throw error;
            setContents(data || []);
        } catch (err) {
            console.error("Error fetching content:", err);
            setStatus({ type: 'error', message: 'Gagal memuat konten.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (specificContent = null) => {
        setSaving(true);
        setStatus({ type: '', message: '' });

        const contentToSave = specificContent !== null ? specificContent : formData.content;
        const titleToSave = formData.title || CONTENT_TYPES[selectedKey]?.label;

        try {
            const { error } = await supabase
                .from('site_content')
                .upsert({
                    key: selectedKey,
                    title: titleToSave,
                    content: contentToSave,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setStatus({ type: 'success', message: 'Konten berhasil disimpan!' });

            // Update local state without refetching
            setContents(prev => {
                const idx = prev.findIndex(c => c.key === selectedKey);
                const newItem = {
                    key: selectedKey,
                    title: titleToSave,
                    content: contentToSave,
                    updated_at: new Date().toISOString()
                };

                if (idx > -1) {
                    const newArr = [...prev];
                    newArr[idx] = newItem;
                    return newArr;
                }
                return [...prev, newItem];
            });

            // If we saved via a child component passing content, update our form state too
            if (specificContent !== null) {
                setFormData(prev => ({ ...prev, content: specificContent }));
            }

        } catch (err) {
            console.error("Error saving content:", err);
            setStatus({ type: 'error', message: 'Gagal menyimpan konten: ' + err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (file, folder = 'site-assets') => {
        try {
            const fileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '-')}`;
            // Use 'site-assets' bucket for website content
            const { data, error } = await supabase.storage
                .from('site-assets')
                .upload(fileName, file);

            if (error) throw error;

            const { data: publicData } = supabase.storage
                .from('site-assets')
                .getPublicUrl(fileName);

            return publicData.publicUrl;
        } catch (error) {
            console.error("Upload failed:", error);
            throw new Error('Gagal upload gambar: ' + error.message);
        }
    };

    const renderEditor = () => {
        const config = CONTENT_TYPES[selectedKey] || { type: 'html' };

        switch (config.type) {
            case 'image':
                return (
                    <ImageEditor
                        value={formData.content}
                        onChange={(val) => setFormData({ ...formData, content: val })}
                        onSave={() => handleSave(formData.content)}
                        onUpload={handleImageUpload}
                        loading={saving}
                    />
                );
            case 'app_promo':
                return (
                    <AppPromoEditor
                        value={formData.content}
                        onChange={(val) => setFormData({ ...formData, content: val })}
                        onSave={(val) => handleSave(val)}
                        onUpload={handleImageUpload}
                        loading={saving}
                    />
                );
            case 'testimonials':
                return (
                    <TestimonialEditor
                        value={formData.content}
                        onChange={(val) => setFormData({ ...formData, content: val })}
                        onSave={(val) => handleSave(val)}
                        onUpload={handleImageUpload}
                        loading={saving}
                    />
                );
            case 'html':
            default:
                return (
                    <HtmlEditor
                        value={formData.content}
                        onChange={(val) => setFormData({ ...formData, content: val })}
                        onSave={() => handleSave()}
                        loading={saving}
                    />
                );
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Konten Website</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
                <div className="flex flex-col md:flex-row h-full">

                    {/* Sidebar Selection */}
                    <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4 shrink-0 overflow-y-auto max-h-[calc(100vh-200px)]">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Menu Konten</h3>
                        <div className="space-y-1">
                            {Object.entries(CONTENT_TYPES).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedKey(key)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedKey === key
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {config.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 p-6 flex flex-col h-full bg-white overflow-y-auto max-h-[calc(100vh-200px)]">
                        {loading ? (
                            <div className="flex items-center justify-center p-12 text-gray-400">
                                <Loader className="animate-spin w-6 h-6 mr-2" /> Memuat...
                            </div>
                        ) : (
                            <>
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-800">{CONTENT_TYPES[selectedKey]?.label || selectedKey}</h2>
                                    <div className="mt-2 text-sm text-gray-500">
                                        Edit konten untuk halaman/section ini.
                                    </div>
                                </div>

                                {renderEditor()}

                                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center">
                                        {status.message && (
                                            <div className={`flex items-center text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                                {status.type === 'success' ? <CheckCircle size={16} className="mr-1" /> : <AlertCircle size={16} className="mr-1" />}
                                                {status.message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const HtmlEditor = ({ value, onChange, onSave, loading }) => (
    <div className="flex flex-col gap-4">
        <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">Konten (HTML)</label>
            <textarea
                className="w-full h-[400px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm resize-y bg-gray-50"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="<p>Tulis konten di sini...</p>"
            />
        </div>
        <button
            onClick={onSave}
            disabled={loading}
            className="self-end bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 flex items-center gap-2 disabled:opacity-70"
        >
            {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
            Simpan HTML
        </button>
    </div>
);

const ImageEditor = ({ value, onChange, onSave, onUpload, loading }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await onUpload(file, 'site-assets');
            onChange(url); // Update preview immediately
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                {value ? (
                    <div className="relative group flex flex-col items-center">
                        <img src={value} alt="Preview" className="max-h-64 object-contain shadow-sm rounded-lg bg-white p-2 mb-4" />
                        <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 shadow-sm flex items-center gap-2">
                            <Upload size={16} />
                            Ganti Gambar
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                    </div>
                ) : (
                    <label className="flex flex-col items-center cursor-pointer">
                        <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
                            {uploading ? <Loader className="animate-spin" /> : <Upload />}
                        </div>
                        <span className="font-bold text-gray-700">Upload Gambar</span>
                        <span className="text-sm text-gray-500 mt-1">PNG, JPG, SVG allowed</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                )}
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">URL Gambar (Opsional)</label>
                    <input
                        type="text"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary"
                        placeholder="https://..."
                    />
                </div>
            </div>

            <button
                onClick={onSave}
                disabled={loading || uploading}
                className="self-end bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 flex items-center gap-2 disabled:opacity-70"
            >
                {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                Simpan Gambar
            </button>
        </div>
    );
};

const AppPromoEditor = ({ value, onChange, onSave, onUpload, loading }) => {
    const [data, setData] = useState({
        mainTitle: '',
        description: '',
        features: [],
        phoneImage: '',
        googlePlayUrl: '#',
        appStoreUrl: '#'
    });

    // Initialize local state from prop value (JSON string)
    useEffect(() => {
        if (value) {
            try {
                // If value is a string and looks like JSON, parse it
                if (typeof value === 'string' && value.trim().startsWith('{')) {
                    const parsed = JSON.parse(value);
                    setData(prev => ({ ...prev, ...parsed }));
                } else if (typeof value === 'object') {
                    // Already object? unlikely for our usage but safe to check
                    setData(prev => ({ ...prev, ...value }));
                }
            } catch (e) {
                console.error("Failed to parse app promo JSON", e);
            }
        }
    }, [value]);

    const updateField = (field, newVal) => {
        const newData = { ...data, [field]: newVal };
        setData(newData);
        // We notify parent on Save, but also onChange so parent state is in sync
        onChange(JSON.stringify(newData));
    };

    const handleFeatureChange = (index, field, val) => {
        const newFeatures = [...(data.features || [])];
        if (!newFeatures[index]) newFeatures[index] = {};
        newFeatures[index][field] = val;
        updateField('features', newFeatures);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            // Using 'site-assets' as the unified bucket
            const url = await onUpload(file, 'site-assets');
            updateField('phoneImage', url);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSaveClick = () => {
        onSave(JSON.stringify(data));
    };

    return (
        <div className="space-y-6 pb-8">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Judul Utama (HTML Supported)</label>
                <div className="text-xs text-gray-400 mb-2">Contoh: ... &lt;span class="text-primary"&gt;Adventure Trip&lt;/span&gt;</div>
                <input
                    type="text"
                    value={data.mainTitle}
                    onChange={e => updateField('mainTitle', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary"
                    placeholder="Judul Section"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi</label>
                <textarea
                    value={data.description}
                    onChange={e => updateField('description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary h-24 resize-none"
                    placeholder="Deskripsi singkat aplikasi..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Link Google Play</label>
                    <input
                        type="text"
                        value={data.googlePlayUrl}
                        onChange={e => updateField('googlePlayUrl', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Link App Store</label>
                    <input
                        type="text"
                        value={data.appStoreUrl}
                        onChange={e => updateField('appStoreUrl', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary"
                    />
                </div>
            </div>

            <div className="border border-indigo-50 bg-indigo-50/50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-4">Gambar Layar HP</label>
                <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-[140px] h-[280px] bg-white rounded-lg overflow-hidden border shadow-sm shrink-0 relative">
                        {data.phoneImage ? (
                            <img src={data.phoneImage} className="w-full h-full object-cover" alt="Phone Screen" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2 bg-gray-100">No Image</div>
                        )}
                    </div>
                    <div className="flex-1 space-y-3">
                        <label className="block">
                            <span className="sr-only">Choose profile photo</span>
                            <input type="file" onChange={handleImageUpload} className="block w-full text-sm text-slate-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-primary file:text-white
                              hover:file:bg-pink-700
                            "/>
                        </label>
                        <p className="text-xs text-gray-500">Upload screenshot aplikasi untuk ditampilkan di dalam mockup HP. Ukuran rekomendasi: <strong>9:19 Aspect Ratio (e.g. 1080x2280)</strong>.</p>

                        <div className="pt-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Atau via URL:</label>
                            <input
                                type="text"
                                value={data.phoneImage}
                                onChange={e => updateField('phoneImage', e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded bg-white"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Editor */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Fitur Unggulan (List)</label>
                <div className="space-y-3">
                    {data.features?.map((feat, idx) => (
                        <div key={idx} className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-2">
                                <div className="md:col-span-8">
                                    <input
                                        placeholder="Judul Fitur"
                                        value={feat.title || ''}
                                        onChange={e => handleFeatureChange(idx, 'title', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm font-bold"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <select
                                        value={feat.icon || 'Tag'}
                                        onChange={e => handleFeatureChange(idx, 'icon', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50"
                                    >
                                        <option value="Tag">Icon: Tag (Promo)</option>
                                        <option value="Shield">Icon: Shield (Aman)</option>
                                        <option value="Globe">Icon: Globe (Global)</option>
                                    </select>
                                </div>
                            </div>
                            <textarea
                                placeholder="Deskripsi Fitur"
                                value={feat.desc || ''}
                                onChange={e => handleFeatureChange(idx, 'desc', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded text-sm resize-none"
                                rows={2}
                            />
                        </div>
                    ))}
                    {(!data.features || data.features.length === 0) && (
                        <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded border border-dashed text-center">
                            Belum ada fitur custom. Data default akan digunakan.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSaveClick}
                    disabled={loading}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 flex items-center gap-2 disabled:opacity-70"
                >
                    {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                    Simpan Semua Perubahan
                </button>
            </div>
        </div>
    );
};

const TestimonialEditor = ({ value, onChange, onSave, onUpload, loading }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        if (value) {
            try {
                if (typeof value === 'string' && value.trim().startsWith('[')) {
                    setData(JSON.parse(value));
                } else if (Array.isArray(value)) {
                    setData(value);
                }
            } catch (e) {
                console.error("Failed to parse testimonials JSON", e);
            }
        }
    }, [value]);

    const handleAdd = () => {
        setData([...data, { name: '', role: '', image: '', text: '', rating: 5 }]);
    };

    const handleRemove = (index) => {
        const newData = data.filter((_, i) => i !== index);
        setData(newData);
        onChange(JSON.stringify(newData));
    };

    const handleChange = (index, field, val) => {
        const newData = [...data];
        newData[index][field] = val;
        setData(newData);
        onChange(JSON.stringify(newData));
    };

    const handleImageUpload = async (index, e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const url = await onUpload(file, 'testimonials');
            handleChange(index, 'image', url);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="text-sm font-medium text-gray-600">Total {data.length} Testimoni</div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                >
                    <Plus size={16} /> Tambah Testimoni
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {data.map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative group">
                        <button
                            onClick={() => handleRemove(idx)}
                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-1 space-y-4">
                                <div className="w-24 h-24 mx-auto md:mx-0 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200 relative">
                                    {item.image ? (
                                        <img src={item.image} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400"><Upload size={24} /></div>
                                    )}
                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                                        <input type="file" className="hidden" onChange={(e) => handleImageUpload(idx, e)} />
                                        <span className="text-[10px] text-white font-bold">GANTI</span>
                                    </label>
                                </div>
                                <div className="text-[10px] text-gray-400 text-center md:text-left">Rekomendasi: 1:1 Aspect Ratio</div>
                            </div>

                            <div className="md:col-span-3 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nama</label>
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={e => handleChange(idx, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded font-medium text-sm"
                                            placeholder="Nama Pelanggan"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Pekerjaan / Lokasi</label>
                                        <input
                                            type="text"
                                            value={item.role}
                                            onChange={e => handleChange(idx, 'role', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-gray-500"
                                            placeholder="Travel Vlogger / Jakarta"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Rating</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => handleChange(idx, 'rating', star)}
                                                className={`transition-colors ${star <= item.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                            >
                                                ⭐
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Testimoni</label>
                                    <textarea
                                        value={item.text}
                                        onChange={e => handleChange(idx, 'text', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm h-24 resize-none leading-relaxed"
                                        placeholder="Tuliskan pengalaman pelanggan..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {data.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 italic">
                        Belum ada testimoni. Klik + Tambah Testimoni untuk memulai.
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                    onClick={() => onSave(JSON.stringify(data))}
                    disabled={loading}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 flex items-center gap-2 disabled:opacity-70"
                >
                    {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                    Simpan Testimoni
                </button>
            </div>
        </div>
    );
};

export default ContentManagement;
