import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader } from 'lucide-react';

const TermsConditionsPage = () => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const { data, error } = await supabase
                .from('site_content')
                .select('*')
                .eq('key', 'terms_conditions')
                .single();

            if (data) {
                setContent(data);
            }
        } catch (error) {
            console.error("Error fetching terms:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fallback content if DB is empty or error
    const defaultContent = (
        <div className="prose prose-lg max-w-none text-gray-600">
            <p className="mb-8 font-medium bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                Dengan melakukan pemesanan atau pembayaran, Anda dianggap telah membaca, memahami, dan menyetujui syarat & ketentuan yang tercantum.
            </p>

            <section className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm mr-3">1</span>
                    PENDAFTARAN
                </h3>
                <ul className="space-y-3 list-decimal list-outside pl-5 marker:text-gray-400 marker:font-medium">
                    <li>Tanpa Minimal, 1 Orang bisa Daftar</li>
                    <li>Pendaftaran peserta maksimal H-30 sebelum tanggal keberangkatan atau selama kuota trip masih tersedia</li>
                    <li>Pendaftaran dilakukan di website dan aplikasi Adventure Trip dan konfirmasi ke MinTure 0818 1843 3490 (WhatsApp)</li>
                    <li>Setiap Peserta yang mendaftar akan kami undang dalam WhatsApp Group H-7 sampai H-3 sebelum keberangkatan. Hal ini untuk memudahkan pemberian informasi & koordinasi seputar perjalanan</li>
                    <li>Harga trip berlaku untuk wisatawan Warga Negara Indonesia (WNI). Penyesuaian harga berlaku untuk wisatawan Warga Negara Asing (WNA)</li>
                </ul>
            </section>
            {/* ... (truncated for brevity in code, but ensuring fallback exists if needed, mostly relying on DB now) */}
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                Sedang memuat atau konten belum tersedia. Silakan hubungi admin.
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-gray-100">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-center">
                        {content?.title || 'SYARAT & KETENTUAN'}
                    </h1>
                    <h2 className="text-xl md:text-2xl font-bold text-primary mb-8 text-center">ADVENTURE TRIP INDONESIA</h2>

                    <p className="text-gray-500 text-center mb-10 italic">
                        {content?.updated_at ? `Terakhir diperbaharui ${new Date(content.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                    </p>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader className="animate-spin text-primary" size={32} />
                        </div>
                    ) : (
                        <div
                            className="prose prose-lg max-w-none text-gray-600"
                            dangerouslySetInnerHTML={{ __html: content?.content || defaultContent }}
                        />
                    )}

                    {!loading && !content && (
                        /* Only show original fallback if truly nothing in DB */
                        <div className="prose prose-lg max-w-none text-gray-600">
                            <p className="mb-8 font-medium bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                Dengan melakukan pemesanan atau pembayaran, Anda dianggap telah membaca, memahami, dan menyetujui syarat & ketentuan yang tercantum.
                            </p>
                            {/* Shortened fallback to avoid duplication complexity */}
                            <p>Silakan hubungi admin untuk informasi lebih lanjut.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TermsConditionsPage;
