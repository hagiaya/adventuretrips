import React, { useEffect } from 'react';

const TermsConditionsPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-gray-100">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-center">SYARAT & KETENTUAN</h1>
                    <h2 className="text-xl md:text-2xl font-bold text-primary mb-8 text-center">ADVENTURE TRIP INDONESIA</h2>

                    <p className="text-gray-500 text-center mb-10 italic">Terakhir diperbaharui 25 Desember 2025</p>

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

                        <section className="mb-10">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm mr-3">2</span>
                                PEMBAYARAN & PEMBATALAN
                            </h3>
                            <ul className="space-y-3 list-decimal list-outside pl-5 marker:text-gray-400 marker:font-medium">
                                <li>Pembayaran via Payment Gateway di dalam Website dan Aplikasi Adventure Trip Indonesia</li>
                                <li>Setelah melakukan pembayaran dimohon untuk melakukan konfirmasi melalui sistem atau melalui Whatsapp MinTure 0818 1843 3490 dengan menyertakan bukti transfer</li>
                                <li>Pelunasan dilakukan maksimal 15 Hari sebelum tanggal keberangkatan</li>
                                <li>Pembayaran DP maupun pelunasan tidak dapat dikembalikan jika trip dibatalkan oleh pihak peserta dengan alasan apapun.</li>
                                <li>Pembayaran DP maupun pelunasan tidak dapat dikembalikan jika peserta merubah jadwal keberangkatan (reschedule) dengan alasan apapun.</li>
                                <li>Pembayaran DP maupun pelunasan tidak dapat dikembalikan jika trip dibatalkan karena kondisi tidak memungkinkan (Force Majeure) tetapi dapat merubah jadwal keberangkatan (reschedule).</li>
                                <li>Pembayaran DP maupun pelunasan akan dikembalikan 100% (Bagi Peserta yang Daftar diatas H-30 Kegiatan) Jika peserta daftar di Bawah H-30 Kegiatan, maka peserta dapat merubah jadwal keberangkatan (reschedule) jika trip dibatalkan oleh pihak Adventure Trip (kuota tidak mencukupi)</li>
                                <li>Pembatalan di H-15 akan di kenakan biaya 100%</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm mr-3">3</span>
                                PELAKSANAAN
                            </h3>
                            <ul className="space-y-3 list-decimal list-outside pl-5 marker:text-gray-400 marker:font-medium">
                                <li>Kami tidak bertanggung jawab atas kerusakan & kehilangan barang pribadi dalam kejadiaan apapun yang menimpa peserta selama trip.</li>
                                <li>Kami tidak bertanggung jawab atas keterlambatan / pembatalan jadwal transportasi yang membuat keterlambatan & ketidak hadiran peserta.</li>
                                <li>Kami tidak bertanggung jawab atas perubahan atau berkurangnya program trip dikarenakan kondisi tidak memungkinkan (Force Majeure) dan jika terjadi hal tersebut maka tidak ada pengembalian (refund) dalam bentuk apapun.</li>
                                <li>Kami tidak bertanggung jawab atas peserta yang mengalami penyakit yang diderita atau kecelakaan yang mengakibatkan apapun selama kegiatan trip berlangsung</li>
                                <li>Seluruh program trip di anjurkan untuk para wisatawan mandiri dengan rentang usia 17 – 45 tahun. Di anjurkan ada pendamping orang tua / wali jika berusia dibawah 17 tahun dan di atas 45 tahun.</li>
                                <li>Peserta dilarang membawa benda tajam, minuman berakohol, obat-obatan terlarang dan juga hewan peliharaan. Jika melanggar kami berhak mengeluarkan peserta dari group atau dipulangkan tanpa penggantian denda berupa apapun.</li>
                                <li>Perubahan suatu kondisi atau fasilitas saja terjadi selama kegiatan trip seperti ; akomodasi, transportasi dan lainnya. Maka peserta wajib untuk mematuhi segala penyesuaian yang ada.</li>
                                <li>Peserta yang terlambat hadir dari waktu yang telah di tetapkan dan telah diberi toleransi waktu serta kebijakan dari peserta lainnya, maka akan di tinggal dan tidak ada penggantian berupa apapun.</li>
                                <li>Peserta selalu menjaga kebersihan lingkungan selama trip berlangsung</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm mr-3">4</span>
                                FORCE MAJEUR
                            </h3>
                            <p className="leading-relaxed text-gray-600 bg-gray-50 p-6 rounded-lg">
                                Force Majeur yang dimaksud dalam perjanjian ini adalah Suatu keadaan memaksa diluar batas kemampuan kedua belah pihak yang dapat mengganggu bahkan menggagalkan terlaksannya kegiatan, seperti bencana alam, peperangan, pemogokan, sabotase, pemberontakan masyarakat, blokade, kebijaksanaan pemerintah khususnya yang disebabkan karena keadaan diluar kemampuan manusia termasuk kemacetan yang tidak terprediksi karena Tim Adventure Trip sudah mengatur waktu sebaik mungkin demi menghindari kemacetan.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm mr-3">5</span>
                                PERSETUJUAN PESERTA
                            </h3>
                            <p className="leading-relaxed text-gray-600">
                                Dengan melakukan pembayaran uang muka (DP) maupun pelunasan, Peserta dianggap telah membaca, memahami, dan menyetujui seluruh Syarat & Ketentuan Adventure Trip Indonesia yang tercantum di halaman ini. Jika Anda memiliki pertanyaan terkait syarat & ketentuan ini, silakan hubungi tim Adventure Trip Indonesia melalui email: <a href="mailto:support@adventuretrip.id" className="text-primary hover:underline font-medium">support@adventuretrip.id</a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsConditionsPage;
