import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Save, AlertCircle, CheckCircle, CreditCard, Lock } from 'lucide-react';

const PaymentSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const [formData, setFormData] = useState({
        mode: 'sandbox',
        sandbox_merchant_id: '',
        sandbox_client_key: '',
        sandbox_server_key: '',
        prod_merchant_id: '',
        prod_client_key: '',
        prod_client_key: '',
        prod_server_key: '',
        tax_percentage: 0
    });

    const [manualAccounts, setManualAccounts] = useState([]);

    const handleAccountChange = (index, field, value) => {
        const updated = [...manualAccounts];
        updated[index] = { ...updated[index], [field]: value };
        setManualAccounts(updated);
    };

    const addAccount = () => {
        setManualAccounts([...manualAccounts, { bank_name: '', account_number: '', account_holder: '' }]);
    };

    const removeAccount = (index) => {
        const updated = manualAccounts.filter((_, i) => i !== index);
        setManualAccounts(updated);
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('payment_settings')
                .select('*')
                .single();

            if (error) {
                if (error.code !== 'PGRST116') { // Ignore 'row not found' if table empty
                    console.error('Error fetching settings:', error);
                }
            } else if (data) {
                setFormData({
                    mode: data.mode || 'sandbox',
                    sandbox_merchant_id: data.sandbox_merchant_id || '',
                    sandbox_client_key: data.sandbox_client_key || '',
                    sandbox_server_key: data.sandbox_server_key || '',
                    prod_merchant_id: data.prod_merchant_id || '',
                    prod_client_key: data.prod_client_key || '',
                    prod_server_key: data.prod_server_key || '',
                    tax_percentage: data.tax_percentage || 0
                });
                if (data.manual_accounts && Array.isArray(data.manual_accounts)) {
                    setManualAccounts(data.manual_accounts);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            // Check if row exists, usually ID 1
            const { data: existing } = await supabase.from('payment_settings').select('id').single();

            const payload = {
                ...formData,
                manual_accounts: manualAccounts,
                updated_at: new Date()
            };

            let error;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('payment_settings')
                    .update(payload)
                    .eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('payment_settings')
                    .insert([{ ...payload, id: 1 }]);
                error = insertError;
            }

            if (error) throw error;

            setMessage({ type: 'success', text: 'Pengaturan pembayaran berhasil disimpan!' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan: ' + err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Memuat pengaturan...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-8 h-8 text-primary" />
                    Pengaturan Pembayaran (Midtrans)
                </h1>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">

                {/* Tax Configuration */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        Pengaturan Biaya Layanan & Pajak
                    </h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Persentase Biaya Tambahan (%)</label>
                        <p className="text-xs text-gray-500 mb-2">Biaya ini akan ditambahkan otomatis ke total transaksi (untuk Layanan, Asuransi, dll).</p>
                        <div className="flex items-center gap-2 max-w-xs">
                            <input
                                type="number"
                                name="tax_percentage"
                                value={formData.tax_percentage}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                max="100"
                                step="0.1"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <span className="font-bold text-gray-600">%</span>
                        </div>
                    </div>
                </div>

                {/* Mode Selection */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mode Lingkungan (Environment)</label>
                    <div className="flex items-center gap-4">
                        <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${formData.mode === 'sandbox' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'}`}>
                            <input
                                type="radio"
                                name="mode"
                                value="sandbox"
                                checked={formData.mode === 'sandbox'}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="font-bold">Sandbox (Simulasi)</span>
                        </label>
                        <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${formData.mode === 'production' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-200'}`}>
                            <input
                                type="radio"
                                name="mode"
                                value="production"
                                checked={formData.mode === 'production'}
                                onChange={handleChange}
                                className="w-4 h-4 text-green-600"
                            />
                            <span className="font-bold">Production (Live)</span>
                        </label>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Pilih "Sandbox" untuk testing dan "Production" untuk menerima pembayaran asli.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sandbox Settings */}
                    <div className={`space-y-4 p-5 rounded-xl border-2 ${formData.mode === 'sandbox' ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 opacity-60'}`}>
                        <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Sandbox Keys</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID Pedagang (Merchant ID)</label>
                            <input
                                type="text"
                                name="sandbox_merchant_id"
                                value={formData.sandbox_merchant_id}
                                onChange={handleChange}
                                placeholder="G..."
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kunci Klien (Client Key)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="sandbox_client_key"
                                    value={formData.sandbox_client_key}
                                    onChange={handleChange}
                                    placeholder="SB-Mid-client-..."
                                    className="w-full p-2 pl-8 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                />
                                <Lock className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kunci Server (Server Key)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="sandbox_server_key"
                                    value={formData.sandbox_server_key}
                                    onChange={handleChange}
                                    placeholder="SB-Mid-server-..."
                                    className="w-full p-2 pl-8 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                />
                                <Lock className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                            </div>
                        </div>
                    </div>

                    {/* Production Settings */}
                    <div className={`space-y-4 p-5 rounded-xl border-2 ${formData.mode === 'production' ? 'border-green-100 bg-green-50/30' : 'border-gray-100 opacity-60'}`}>
                        <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Production Keys</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID Pedagang (Merchant ID)</label>
                            <input
                                type="text"
                                name="prod_merchant_id"
                                value={formData.prod_merchant_id}
                                onChange={handleChange}
                                placeholder="M..."
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kunci Klien (Client Key)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="prod_client_key"
                                    value={formData.prod_client_key}
                                    onChange={handleChange}
                                    placeholder="Mid-client-..."
                                    className="w-full p-2 pl-8 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                                />
                                <Lock className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kunci Server (Server Key)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="prod_server_key"
                                    value={formData.prod_server_key}
                                    onChange={handleChange}
                                    placeholder="Mid-server-..."
                                    className="w-full p-2 pl-8 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                                />
                                <Lock className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manual Transfer Settings */}
                <div className="pt-6 border-t border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-orange-600" />
                        Rekening Transfer Manual
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">Tambahkan rekening bank yang akan ditampilkan ke pelanggan untuk pembayaran manual.</p>

                    <div className="space-y-4">
                        {manualAccounts.map((account, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nama Bank</label>
                                    <input
                                        type="text"
                                        value={account.bank_name}
                                        onChange={(e) => handleAccountChange(index, 'bank_name', e.target.value)}
                                        placeholder="Contoh: BCA"
                                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nomor Rekening</label>
                                    <input
                                        type="text"
                                        value={account.account_number}
                                        onChange={(e) => handleAccountChange(index, 'account_number', e.target.value)}
                                        placeholder="1234567890"
                                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Atas Nama</label>
                                    <input
                                        type="text"
                                        value={account.account_holder}
                                        onChange={(e) => handleAccountChange(index, 'account_holder', e.target.value)}
                                        placeholder="PT TRAVEL JAYA"
                                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeAccount(index)}
                                    className="p-2 mt-5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hapus Rekening"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addAccount}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200 border-dashed"
                        >
                            + Tambah Rekening
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-pink-600 transition-colors flex items-center gap-2 shadow-lg shadow-pink-500/30"
                    >
                        {saving ? 'Menyimpan...' : (
                            <>
                                <Save className="w-5 h-5" /> Simpan Pengaturan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PaymentSettings;
