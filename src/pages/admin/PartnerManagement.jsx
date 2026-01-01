import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit2, Globe, Image as ImageIcon, Loader, Save, X } from 'lucide-react';

const PartnerManagement = () => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        logo_url: '',
        website_url: '',
        category: 'Akomodasi', // Default category
        is_active: true
    });

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('partners')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPartners(data || []);
        } catch (error) {
            console.error('Error fetching partners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (partner = null) => {
        if (partner) {
            setEditingPartner(partner);
            setFormData({
                name: partner.name,
                logo_url: partner.logo_url,
                website_url: partner.website_url || '',
                category: partner.category || 'Akomodasi',
                is_active: partner.is_active
            });
        } else {
            setEditingPartner(null);
            setFormData({
                name: '',
                logo_url: '',
                website_url: '',
                category: 'Akomodasi',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (editingPartner) {
                const { error } = await supabase
                    .from('partners')
                    .update(formData)
                    .eq('id', editingPartner.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('partners')
                    .insert([formData]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchPartners();
        } catch (error) {
            alert('Error saving partner: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus partner ini?')) return;

        try {
            const { error } = await supabase
                .from('partners')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchPartners();
        } catch (error) {
            alert('Error deleting partner: ' + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Logo Partner</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola logo partner yang ditampilkan di website.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={async () => {
                            if (!window.confirm('Ingin mengisi data awal partner sesuai footer saat ini?')) return;
                            const staticData = [
                                { name: "Marriott", logo_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHdpBvLcvYjLfS78XAgn6Lb0eN4uItKXn5Hg&s", category: "Akomodasi" },
                                { name: "Garuda Indonesia", logo_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTd8Y4c8_1_TN7PP8qWlhOprR0iACK2yls2A&s", category: "Transportasi" },
                                { name: "Pertamina", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Pertamina_Logo.svg/2560px-Pertamina_Logo.svg.png", category: "Customer" },
                                // ... more if needed
                            ];
                            const { error } = await supabase.from('partners').insert(staticData);
                            if (error) alert(error.message);
                            else fetchPartners();
                        }}
                        className="bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                        Isi Data Awal
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={20} /> Tambah Partner
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader className="animate-spin mb-2" size={32} />
                    <p>Memuat data partner...</p>
                </div>
            ) : partners.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-500">
                    <ImageIcon size={48} className="mx-auto mb-4 opacity-10" />
                    <p>Belum ada logo partner. Klik tombol di atas untuk menambah.</p>
                </div>
            ) : (
                ['Akomodasi', 'Transportasi', 'Customer'].map(cat => {
                    const filtered = partners.filter(p => p.category === cat);
                    if (filtered.length === 0) return null;
                    return (
                        <div key={cat} className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                {cat === 'Customer' ? 'Our Customers' : `Partner ${cat}`}
                                <span className="text-xs font-normal text-gray-400 ml-2">({filtered.length} entries)</span>
                            </h2>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Logo</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Partner</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Website</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filtered.map((partner) => (
                                            <tr key={partner.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="w-16 h-10 bg-gray-50 rounded border border-gray-100 p-1 flex items-center justify-center overflow-hidden">
                                                        <img src={partner.logo_url} alt="" className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-900">{partner.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {partner.website_url ? (
                                                        <a href={partner.website_url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                                                            <Globe size={12} /> {new URL(partner.website_url).hostname}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No website</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {partner.is_active ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-50 text-gray-400 border border-gray-100">
                                                            Hidden
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenModal(partner)}
                                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(partner.id)}
                                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">{editingPartner ? 'Edit Partner' : 'Tambah Partner Baru'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Partner</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Garuda Indonesia"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">URL Logo (Image URL)</label>
                                <input
                                    type="url"
                                    required
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                    value={formData.logo_url}
                                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                />
                                {formData.logo_url && (
                                    <div className="mt-2 p-2 border rounded-lg bg-gray-50 flex items-center justify-center h-20">
                                        <img src={formData.logo_url} alt="Preview" className="max-h-full object-contain" onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Invalid+Image+URL'} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Kategori Partner</label>
                                <select
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="Akomodasi">Akomodasi (Hotel & Villa)</option>
                                    <option value="Transportasi">Transportasi (Pesawat & Mobil)</option>
                                    <option value="Customer">Our Customer (Perusahaan)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Website URL (Opsional)</label>
                                <input
                                    type="url"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium"
                                    value={formData.website_url}
                                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                    placeholder="https://www.partner-website.com"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Tampilkan di website</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    {isSaving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                                    {isSaving ? 'Menyimpan...' : 'Simpan Partner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerManagement;
