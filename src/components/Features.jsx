import React from 'react';
import { Star, Wallet, CheckCircle, Headphones } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: <Star className="w-8 h-8 text-primary group-hover:text-white" />,
            title: "Pengalaman Terbaik",
            desc: "Nikmati perjalanan yang telah kami kemas khusus untuk kamu"
        },
        {
            icon: <Wallet className="w-8 h-8 text-primary group-hover:text-white" />,
            title: "Harga Terjangkau",
            desc: "Dapatkan penawaran terbaik dan diskon eksklusif untuk berbagai trip."
        },
        {
            icon: <CheckCircle className="w-8 h-8 text-primary group-hover:text-white" />,
            title: "Kemudahan Pemesanan",
            desc: "Proses pemesanan yang cepat dan mudah untuk kenyamanan Anda."
        },
        {
            icon: <Headphones className="w-8 h-8 text-primary group-hover:text-white" />,
            title: "Dukungan 24/7",
            desc: "Layanan pelanggan siap membantu kamu kapan saja, di mana saja."
        }
    ];

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Kenapa Pilih Adventure Trip?</h2>
                    <p className="text-gray-500 text-lg">Partner perjalanan terbaik untuk pengalaman tak terlupakan</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mx-auto">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center p-4 md:p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-100 group bg-gray-50/30 hover:bg-white h-full">
                            <div className="bg-white border border-pink-50 p-3 md:p-5 rounded-full mb-4 md:mb-6 group-hover:bg-primary group-hover:border-primary transition-colors shadow-sm">
                                {feature.icon}
                            </div>
                            <h3 className="text-sm md:text-xl font-bold mb-2 md:mb-3 text-gray-800">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed text-xs md:text-sm line-clamp-3">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
