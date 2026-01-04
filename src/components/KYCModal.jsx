import React, { useState } from 'react';
import { X, Camera, Upload, CheckCircle, AlertCircle, Loader, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

import { requestWithdrawal } from '../utils/withdrawals';

const KYCModal = ({ isOpen, onClose, userId, onSuccess, withdrawalData }) => {
    const [step, setStep] = useState(1); // 1: Form, 2: Upload, 3: Success
    const [formData, setFormData] = useState({
        full_name: '',
        id_number: '',
        bank_account_number: '' // Added state for account number
    });
    const [images, setImages] = useState({
        id_image: null,
        selfie_image: null
    });
    const [previews, setPreviews] = useState({
        id_image: null,
        selfie_image: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setImages({ ...images, [type]: file });
            setPreviews({ ...previews, [type]: URL.createObjectURL(file) });
        }
    };

    const uploadImage = async (file, path) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${path}-${Math.random()}.${fileExt}`;
        const filePath = `kyc/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('product-images') // Changed from 'products' to 'product-images' to match existing bucket
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async () => {
        if (!formData.full_name || !formData.id_number || !formData.bank_account_number || !images.id_image || !images.selfie_image) {
            setError("Harap lengkapi semua data dan foto.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Upload Images
            const idUrl = await uploadImage(images.id_image, 'ktp');
            const selfieUrl = await uploadImage(images.selfie_image, 'selfie');

            // 2. Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    kyc_status: 'pending',
                    kyc_full_name: formData.full_name,
                    kyc_id_number: formData.id_number,
                    kyc_bank_account: formData.bank_account_number, // Save bank account
                    kyc_id_image: idUrl,
                    kyc_selfie_image: selfieUrl,
                    updated_at: new Date()
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            // 3. If withdrawal data exists, create the withdrawal record immediately
            if (withdrawalData && withdrawalData.amount) {
                const { error: withdrawError } = await requestWithdrawal(
                    userId,
                    parseFloat(withdrawalData.amount),
                    {
                        bank_name: withdrawalData.bank_name,
                        account_number: withdrawalData.account_number,
                        account_holder: withdrawalData.account_holder
                    }
                );
                // Note: requestWithdrawal creates the record with 'pending' status.
                // Even if KYC is pending, we allow the request to sit in withdrawals table.
                // However, requestWithdrawal checks balance. It should be fine.
                // But wait, requestWithdrawal DEDUCTS balance.
                // If KYC is rejected, admin needs to reject withdrawal too (which refunds balance).
                // Ideally we link them, but independent pending items are fine.
                if (withdrawError) console.error("Auto-withdrawal creation failed", withdrawError);
            }

            setStep(3);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError("Gagal mengunggah data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl relative animate-slideUp">
                {step === 1 && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <Shield className="text-primary" size={24} /> Verifikasi Akun
                            </h2>
                            <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* SHOW WITHDRAWAL AMOUNT IF EXISTS */}
                            {withdrawalData && withdrawalData.amount && (
                                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 mb-2">
                                    <p className="text-[10px] text-orange-700 font-bold uppercase tracking-widest mb-1">Permintaan Penarikan</p>
                                    <p className="text-lg font-black text-gray-900">
                                        Rp {parseFloat(withdrawalData.amount).toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Saldo akan ditarik otomatis setelah dokumen terkirim.
                                    </p>
                                </div>
                            )}

                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-4">
                                <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
                                    Sesuai regulasi keamanan, kamu perlu melakukan verifikasi identitas (KYC) satu kali sebelum melakukan penarikan saldo.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Sesuai KTP</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Masukkan nama lengkap"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">NIK (No. KTP)</label>
                                <input
                                    type="text"
                                    value={formData.id_number}
                                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                                    placeholder="16 Digit Angka"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nomor Rekening</label>
                                <input
                                    type="text"
                                    value={formData.bank_account_number}
                                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                                    placeholder="Nomor Rekening Bank / E-Wallet"
                                />
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!formData.full_name || !formData.id_number || !formData.bank_account_number}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-pink-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                            >
                                Lanjut Unggah Dokumen
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setStep(1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <Shield size={18} className="text-gray-500 rotate-180" />
                            </button>
                            <h2 className="text-xl font-black text-gray-900">Foto Dokumen</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Foto KTP</label>
                                    <label className="relative block aspect-[1.6/1] bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all overflow-hidden">
                                        {previews.id_image ? (
                                            <img src={previews.id_image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                                <Camera size={32} className="mb-2" />
                                                <span className="text-[10px] font-bold uppercase">Tekan untuk ambil foto</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'id_image')} />
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Foto Selfie + KTP</label>
                                    <label className="relative block aspect-[1.6/1] bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all overflow-hidden">
                                        {previews.selfie_image ? (
                                            <img src={previews.selfie_image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                                <Camera size={32} className="mb-2" />
                                                <span className="text-[10px] font-bold uppercase">Foto selfie pegang KTP</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'selfie_image')} />
                                    </label>
                                </div>
                            </div>

                            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </div>}

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !images.id_image || !images.selfie_image}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-pink-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                            >
                                {loading ? <Loader className="animate-spin" size={18} /> : 'Ajukan Verifikasi'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="p-8 text-center font-sans">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Dokumen Terkirim!</h2>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            Data verifikasi kamu sudah kami terima dan sedang dalam proses review admin (estimasi 1x24 jam). Kamu akan menerima notifikasi WA jika verifikasi selesai.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-gray-800 transition-all"
                        >
                            Oke, Mengerti
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KYCModal;
