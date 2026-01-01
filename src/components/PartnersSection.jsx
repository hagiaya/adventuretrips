import React from 'react';
import { supabase } from '../lib/supabaseClient';

const PartnerLogo = ({ name, logoUrl }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 hover:shadow-md h-20 md:h-24 group">
        <img
            src={logoUrl}
            alt={`${name} Logo`}
            className="max-h-12 w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentElement.innerText = name; // Fallback to text
            }}
        />
    </div>
);

const PartnersSection = () => {
    const [dynamicPartners, setDynamicPartners] = React.useState([]);

    React.useEffect(() => {
        const fetchPartners = async () => {
            const { data, error } = await supabase
                .from('partners')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setDynamicPartners(data);
            }
        };
        fetchPartners();
    }, []);

    const accommodationPartners = [
        { name: "Marriott", logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHdpBvLcvYjLfS78XAgn6Lb0eN4uItKXn5Hg&s" },
        { name: "Hilton", logoUrl: "https://img.ctykit.com/cdn/wa-bellevue/images/tr:w-900/hilton.png" },
        { name: "Accor", logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4lBM65RjpI6HB13jgQCIiJ0K4nFNboiF7uQ&s" },
        { name: "Archipelago", logoUrl: "https://i.ibb.co.com/8N6962n/archipelago.png" },
        { name: "OYO", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/19/OYO_Rooms_%28logo%29.png" },
        { name: "RedDoorz", logoUrl: "https://i0.wp.com/join.reddoorz.com/wp-content/uploads/2022/12/rdlogo.png?fit=960%2C434&ssl=1" },
        { name: "Aston", logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-8CYXlkEL19OG-mat61aK6AJ8ThFx_mqvxw&s" },
        { name: "Swiss-Belhotel", logoUrl: "https://www.hotelmanagement.com.au/wp-content/uploads/2018/11/SBI-Logo.png" }
    ];

    const transportPartners = [
        { name: "Garuda Indonesia", logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTd8Y4c8_1_TN7PP8qWlhOprR0iACK2yls2A&s" },
        { name: "Bluebird", logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5ejS62irx3fFkBqkmFsFlUQP9xQ4hf5z4XQ&s" },
        { name: "Grab", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Grab_Logo.svg/1200px-Grab_Logo.svg.png" },
        { name: "Gojek", logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXM76CoIdg8oou0g2V7u1sjwCz9WDbcT7mLQ&s" },
        { name: "KAI", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/56/Logo_PT_Kereta_Api_Indonesia_%28Persero%29_2020.svg" },
        { name: "Citilink", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/2012_Citilink_Logo.svg/2560px-2012_Citilink_Logo.svg.png" },
        { name: "Lion Air", logoUrl: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgpfaTopeSlrAk5dtwEcuJGS-PZgUFJtsL4ZWkxHYJSShjkSqxnqax4UhRYb-5tQnuw9z4NUYkp1PZaXAqLjUCIZEgoMXmygX_xgO2Sgh4N9Mu9NWSgaGAGmQDDeXRF3Rq5-fiL56O_kEBBTcPp-hzZfURr9go80q4Drwy3bbFm7jSbAVCo602GIcuCIw/s1844/Logo%20Lion%20Air.png" },
        { name: "TRAC", logoUrl: "https://cdn.freebiesupply.com/logos/large/2x/trac-logo-svg-vector.svg" }
    ];

    const customers = [
        { name: "Pertamina", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Pertamina_Logo.svg/2560px-Pertamina_Logo.svg.png" },
        { name: "Telkom Indonesia", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/22/Telkom_Indonesia_logo.png" },
        { name: "Bank Mandiri", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" },
        { name: "BCA", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
        { name: "Tokopedia", logoUrl: "https://www.freepnglogos.com/uploads/logo-tokopedia-png/tokopedia-apa-itu-startup-pengertian-cara-memulai-dan-1.png" },
        { name: "Shopee", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg" },
        { name: "Google", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
        { name: "Unilever", logoUrl: "https://www.vhv.rs/dpng/d/494-4944646_logo-unilever-png-hd-transparent-png.png" }
    ];

    return (
        <section className="py-20 bg-gray-50 border-t border-gray-100">
            <div className="container mx-auto px-4 space-y-16">

                {/* Partner Akomodasi */}
                <div className="text-center">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Partner Akomodasi (Hotel & Villa)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
                        {/* Dynamic from DB */}
                        {dynamicPartners.filter(p => p.category === 'Akomodasi').map((partner) => (
                            <PartnerLogo key={partner.id} name={partner.name} logoUrl={partner.logo_url} />
                        ))}
                        {/* Static Fallback (only if no dynamic for this cat) */}
                        {dynamicPartners.filter(p => p.category === 'Akomodasi').length === 0 && accommodationPartners.map((partner, idx) => (
                            <PartnerLogo key={idx} {...partner} />
                        ))}
                    </div>
                </div>

                {/* Partner Transportasi */}
                <div className="text-center">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Partner Transportasi</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
                        {/* Dynamic from DB */}
                        {dynamicPartners.filter(p => p.category === 'Transportasi').map((partner) => (
                            <PartnerLogo key={partner.id} name={partner.name} logoUrl={partner.logo_url} />
                        ))}
                        {/* Static Fallback */}
                        {dynamicPartners.filter(p => p.category === 'Transportasi').length === 0 && transportPartners.map((partner, idx) => (
                            <PartnerLogo key={idx} {...partner} />
                        ))}
                    </div>
                </div>

                {/* Our Customer */}
                <div className="text-center">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Our Customer</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
                        {/* Dynamic from DB */}
                        {dynamicPartners.filter(p => p.category === 'Customer').map((partner) => (
                            <PartnerLogo key={partner.id} name={partner.name} logoUrl={partner.logo_url} />
                        ))}
                        {/* Static Fallback */}
                        {dynamicPartners.filter(p => p.category === 'Customer').length === 0 && customers.map((partner, idx) => (
                            <PartnerLogo key={idx} {...partner} />
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default PartnersSection;
