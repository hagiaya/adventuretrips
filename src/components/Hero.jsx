import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const banners = [
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-4.0.3&auto=format&fit=crop&w=2668&q=80", // Philippines/Island
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2668&q=80", // Switzerland/Mountain
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2668&q=80"  // Roadtrip/Desert
    ];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/trips?q=${encodeURIComponent(searchQuery)}`);
        } else {
            navigate('/trips');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="relative min-h-[500px] md:h-[600px] w-full overflow-hidden font-sans">
            {/* Background Image Slider */}
            {banners.map((banner, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                    <img
                        src={banner}
                        alt={`Banner ${index + 1}`}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60"></div>
                </div>
            ))}

            <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center text-white z-10">
                <span className="inline-block bg-secondary text-black text-xs font-bold px-3 py-1 rounded-full mb-4 animate-bounce shadow-lg">
                    #1 Travel Agent di Indonesia 🇮🇩
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-lg animate-fade-in-up px-2">
                    Mau Liburan Murah & Anti Ribet? Adventure Trip Aja!
                </h1>
                <p className="text-base sm:text-lg md:text-2xl mb-10 max-w-2xl font-light text-gray-100 drop-shadow animate-fade-in-up delay-100 px-4">
                    Jelajahi destinasi impianmu dengan mudah dan aman bersama Adventure Trip
                </p>

                <div className="bg-white p-2 rounded-xl shadow-2xl max-w-3xl w-full flex flex-col md:flex-row gap-2 transform hover:scale-[1.01] transition-transform duration-300 animate-fade-in-up delay-200">
                    <div className="flex-1 flex items-center px-4 py-3 md:py-2 border-b md:border-b-0 md:border-r border-gray-100">
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Mau kemana hari ini? (Misal: Bromo)"
                            className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 outline-none h-full py-2"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="bg-primary text-white px-8 py-3 md:py-3 rounded-lg font-bold hover:bg-pink-700 transition-colors shadow-md w-full md:w-auto"
                    >
                        Cari Trip
                    </button>
                </div>
            </div>

            {/* Slider Indicators */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Hero;
