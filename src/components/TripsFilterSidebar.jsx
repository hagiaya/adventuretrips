import React, { useState } from 'react';

const TripsFilterSidebar = ({ filters, onFilterChange, onReset, categoryOptions, durationLabel, durationOptions }) => {
    // Local state for price inputs to avoid excessive re-renders/filtering while typing
    const [minPrice, setMinPrice] = useState(filters.minPrice);
    const [maxPrice, setMaxPrice] = useState(filters.maxPrice);

    const handlePriceChange = (e, type) => {
        const val = e.target.value;
        if (type === 'min') setMinPrice(val);
        else setMaxPrice(val);

        // Debounce or just pass on blur/enter could be better, but for now simple onChange wrapper
        onFilterChange(type === 'min' ? 'minPrice' : 'maxPrice', val);
    };

    const handleCheckboxChange = (category, value) => {
        const currentValues = filters[category] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        onFilterChange(category, newValues);
    };

    const handleRadioChange = (category, value) => {
        onFilterChange(category, value);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6">

            {/* Berdasarkan Durasi / Seat */}
            <div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm">{durationLabel || 'Berdasarkan Durasi'}</h3>
                <div className="space-y-2">
                    {(durationOptions || ['1 Hari', '2 Hari', '3 Hari', '4 Hari', '5 Hari', '> 5 Hari']).map((label) => (
                        <label key={label} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                                checked={filters.duration?.includes(label)}
                                onChange={() => handleCheckboxChange('duration', label)}
                            />
                            <span className="text-gray-600 text-sm group-hover:text-primary transition-colors">{label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Berdasarkan Ketertarikan */}
            <div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Berdasarkan Ketertarikan</h3>
                <div className="space-y-2">
                    {['Perjalanan Popular', 'Rekomendasi Terbaru'].map((label) => (
                        <label key={label} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                                checked={filters.interests?.includes(label)}
                                onChange={() => handleCheckboxChange('interests', label)}
                            />
                            <span className="text-gray-600 text-sm group-hover:text-primary transition-colors">{label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Berdasarkan Kategori */}
            <div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Berdasarkan Kategori</h3>
                <div className="space-y-2">
                    {(categoryOptions || ['Beach/Island', 'Trekking/Camping', 'Nature', 'Culture/Culinary', 'Adventure', 'Umum']).map((label) => (
                        <label key={label} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 shrink-0"
                                checked={filters.categories?.includes(label)}
                                onChange={() => handleCheckboxChange('categories', label)}
                            />
                            <span className="text-gray-600 text-sm group-hover:text-primary transition-colors leading-tight">{label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Berdasarkan Harga */}
            <div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Berdasarkan Harga</h3>
                <div className="space-y-3 mb-4">
                    <div>
                        <span className="text-xs text-gray-400 block mb-1">Minimal</span>
                        <input
                            type="number"
                            placeholder="Rp 0"
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-primary"
                            value={minPrice}
                            onChange={(e) => handlePriceChange(e, 'min')}
                        />
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 block mb-1">Maximal</span>
                        <input
                            type="number"
                            placeholder="Rp 0"
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-primary"
                            value={maxPrice}
                            onChange={(e) => handlePriceChange(e, 'max')}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    {[
                        { label: 'Rp. 100.000 - Rp. 500.000', min: 100000, max: 500000 },
                        { label: 'Rp. 500.000 - Rp. 1.000.000', min: 500000, max: 1000000 },
                        { label: '> Rp. 1.000.000', min: 1000000, max: null }
                    ].map((range, idx) => (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="priceRange"
                                className="w-4 h-4 border-gray-300 text-primary focus:ring-primary/20"
                                checked={filters.priceRangeLabel === range.label}
                                onChange={() => {
                                    onFilterChange('priceRange', { min: range.min, max: range.max, label: range.label });
                                    // Update inputs too if needed, or keep them separate
                                    setMinPrice(range.min);
                                    setMaxPrice(range.max || '');
                                }}
                            />
                            <span className="text-gray-600 text-sm group-hover:text-primary transition-colors">{range.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <button
                onClick={() => {
                    setMinPrice('');
                    setMaxPrice('');
                    onReset();
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-sm mt-4"
            >
                Reset Filter
            </button>
        </div>
    );
};

export default TripsFilterSidebar;
