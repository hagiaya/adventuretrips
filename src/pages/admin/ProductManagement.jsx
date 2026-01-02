import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Search, Edit, Trash2, X, Image as ImageIcon, Loader, Upload, Calendar } from 'lucide-react';

const ProductManagement = ({ initialProductType = null }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form Data State
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        location: '',
        price: '', // Display price (e.g. "Start from X")
        originalPrice: '', // New field for discount (coret)
        productType: 'Trip', // Trip, Accommodation, Transportation
        category: 'Umum',
        description: '',
        image_url: '',
        gallery: [], // Array of image URLs
        rating: 5.0,
        slug: '',
        views_count: 0,
        // Extended Fields
        includesText: '',
        excludesText: '',
        meetingPoint: '', // Will be removed/deprecated in UI, moved to schedules
        itineraryText: '', // New simple paragraph itinerary
        itineraryItems: [], // Deprecated in UI but keeping structure for safety vs new text
        termsText: '',
        // Schedules: Array of { date, price, quota, booked, meetingPoints: [] }
        schedules: [],
        duration: '', // New field: e.g. "3 Hari 2 Malam"
        // Packages: Array of { name: '', items: [{ name: '', price: 0 }] }
        packages: [],
        // Transport/Accom Specific
        facilitiesText: '', // for Accommodation
        specsText: '', // for Transport
        vehicleType: 'Car', // for Transport
        organizer: 'Pandooin'
    });

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

    // Schedule Generation State
    const [scheduleMode, setScheduleMode] = useState('single'); // 'single' | 'range'
    const [bulkStartDate, setBulkStartDate] = useState('');
    const [bulkEndDate, setBulkEndDate] = useState('');
    const [selectedDays, setSelectedDays] = useState([true, true, true, true, true, true, true]); // Sun-Sat
    // Update newSchedule to include meetingPoints array
    const [newSchedule, setNewSchedule] = useState({ date: '', price: '', quota: 20, booked: 0, meetingPoints: [] });
    const [tempMeetingPoint, setTempMeetingPoint] = useState(''); // Helper for inputting MPs

    useEffect(() => {
        fetchProducts();
    }, [initialProductType]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            let filteredData = data || [];
            if (initialProductType) {
                filteredData = filteredData.filter(p => {
                    const features = p.features || {};
                    // Infer type if not explicitly set
                    let type = features.product_type;
                    if (!type) {
                        if (['Hotel', 'Villa', 'Resort', 'Homestay', 'Glamping'].includes(p.category)) type = 'Accommodation';
                        else if (['MPV', 'SUV', 'Bus', 'Minibus', 'Luxury', 'Sewa Motor'].includes(p.category)) type = 'Transportation';
                        else type = 'Trip';
                    }
                    return type === initialProductType;
                });
            }
            setProducts(filteredData);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        setSelectedFiles([]);
        setPreviewUrls([]);

        if (product) {
            const features = product.features || {};
            const includes = features.includes || product.includes || [];
            const excludes = features.excludes || product.excludes || [];

            // Handle Itinerary: Check if it's new string format or old array format
            let itineraryRaw = features.itinerary || product.itinerary;
            let itineraryTextVal = '';
            let itineraryItemsVal = [];

            if (typeof itineraryRaw === 'string') {
                itineraryTextVal = itineraryRaw;
            } else if (Array.isArray(itineraryRaw)) {
                itineraryItemsVal = itineraryRaw;
            }

            const terms = features.terms || [];
            const meetingPoint = features.meeting_point || product.meeting_point || '';
            const originalPrice = features.original_price || ''; // Load original price

            // Ensure schedules has meetingPoints array
            const schedules = (product.schedules || []).map(s => ({
                ...s,
                meetingPoints: s.meetingPoints || (meetingPoint ? [meetingPoint] : []) // Fallback to global MP if missing
            }));

            // Pre-fill Set Schedule Form with data from first schedule (for convenience)
            if (schedules.length > 0) {
                const first = schedules[0];
                setNewSchedule({
                    date: '',
                    price: first.price || '',
                    quota: 20,
                    booked: 0,
                    meetingPoints: first.meetingPoints || [],
                    weekendPrice: ''
                });
            } else {
                setNewSchedule({ date: '', price: '2500000', quota: 20, booked: 0, meetingPoints: [], weekendPrice: '' });
            }

            const gallery = product.gallery || (product.image_url ? [product.image_url] : []);

            // Infer Product Type
            let type = 'Trip';
            if (['Hotel', 'Villa', 'Resort', 'Homestay', 'Glamping'].includes(product.category)) type = 'Accommodation';
            if (['MPV', 'SUV', 'Bus', 'Minibus', 'Luxury', 'Sewa Motor'].includes(product.category)) type = 'Transportation';
            if (features.product_type) type = features.product_type;

            setFormData({
                id: product.id,
                title: product.title,
                location: product.location,
                price: product.price,
                originalPrice: originalPrice,
                discount_percentage: product.discount_percentage || 0,
                category: product.category,
                productType: type,
                description: product.description || '',
                image_url: product.image_url,
                gallery: gallery,
                rating: product.rating || 5.0,
                slug: product.slug || '',
                views_count: product.views_count || 0,

                includesText: Array.isArray(includes) ? includes.join('\n') : '',
                excludesText: Array.isArray(excludes) ? excludes.join('\n') : '',

                itineraryText: itineraryTextVal,
                itineraryItems: itineraryItemsVal,

                meetingPoint: meetingPoint,
                termsText: Array.isArray(terms) ? terms.join('\n') : '',
                schedules: schedules,
                duration: features.duration || '',
                packages: features.packages || [],

                facilitiesText: Array.isArray(features.facilities) ? features.facilities.join('\n') : '',
                specsText: Array.isArray(features.specs) ? features.specs.join('\n') : '',
                vehicleType: features.vehicle_type || 'Car',
                organizer: product.organizer || features.organizer || 'Pandooin'
            });
        } else {
            setFormData({
                id: null,
                title: '',
                location: '',
                price: '',
                originalPrice: '',
                discount_percentage: '',
                category: initialProductType === 'Accommodation' ? 'Hotel' : initialProductType === 'Transportation' ? 'MPV' : 'Umum',
                productType: initialProductType || 'Trip',
                description: '',
                image_url: '',
                gallery: [],
                rating: 5.0,
                slug: '',
                views_count: 0,
                includesText: '',
                excludesText: '',
                meetingPoint: '',
                itineraryText: '',
                itineraryItems: [],
                termsText: '',
                schedules: [],
                duration: '',
                packages: [],
                facilitiesText: '',
                specsText: '',
                vehicleType: 'Car',
                organizer: 'Pandooin'
            });
        }
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const maxImages = formData.productType === 'Accommodation' ? 10 : 4;
        const totalImages = formData.gallery.length + selectedFiles.length + files.length;

        if (totalImages > maxImages) {
            alert(`Maksimal upload ${maxImages} gambar.`);
            return;
        }

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setSelectedFiles([...selectedFiles, ...files]);
        setPreviewUrls([...previewUrls, ...newPreviews]);
    };

    const removeSelectedFile = (index) => {
        const newFiles = [...selectedFiles];
        const newPreviews = [...previewUrls];

        URL.revokeObjectURL(newPreviews[index]);

        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);

        setSelectedFiles(newFiles);
        setPreviewUrls(newPreviews);
    };

    const removeGalleryImage = (index) => {
        const newGallery = [...formData.gallery];
        newGallery.splice(index, 1);
        setFormData({ ...formData, gallery: newGallery });
    };

    const handleScheduleChange = (index, field, value) => {
        const newSchedules = [...formData.schedules];
        newSchedules[index][field] = value;
        setFormData({ ...formData, schedules: newSchedules });
    };

    const addSchedule = () => {
        setFormData({
            ...formData,
            schedules: [
                ...formData.schedules,
                { date: '', price: '2500000', quota: 20, booked: 0 }
            ]
        });
    };

    const addScheduleToForm = () => {
        if (!newSchedule.date || !newSchedule.price) {
            alert("Mohon lengkapi tanggal dan harga");
            return;
        }

        const formattedDate = newSchedule.date;

        setFormData({
            ...formData,
            schedules: [
                ...formData.schedules,
                { ...newSchedule, date: formattedDate }
            ]
        });
        setNewSchedule({ date: '', price: '', quota: 20, booked: 0, meetingPoints: [], weekendPrice: '' });
    };

    const removeSchedule = (index) => {
        const newSchedules = [...formData.schedules];
        newSchedules.splice(index, 1);
        setFormData({ ...formData, schedules: newSchedules });
    };

    // Package Handlers
    const addPackage = () => {
        setFormData({
            ...formData,
            packages: [...formData.packages, { name: '', items: [] }]
        });
    };

    const removePackage = (index) => {
        const newPackages = [...formData.packages];
        newPackages.splice(index, 1);
        setFormData({ ...formData, packages: newPackages });
    };

    const updatePackageName = (index, name) => {
        const newPackages = [...formData.packages];
        newPackages[index].name = name;
        setFormData({ ...formData, packages: newPackages });
    };

    const addPackageItem = (packageIndex) => {
        const newPackages = [...formData.packages];
        newPackages[packageIndex].items.push({ name: '', price: '' });
        setFormData({ ...formData, packages: newPackages });
    };

    const removePackageItem = (packageIndex, itemIndex) => {
        const newPackages = [...formData.packages];
        newPackages[packageIndex].items.splice(itemIndex, 1);
        setFormData({ ...formData, packages: newPackages });
    };

    const updatePackageItem = (packageIndex, itemIndex, field, value) => {
        const newPackages = [...formData.packages];
        newPackages[packageIndex].items[itemIndex][field] = value;
        setFormData({ ...formData, packages: newPackages });
    };

    // Itinerary Helpers
    const addItineraryItem = () => {
        setFormData({
            ...formData,
            itineraryItems: [...formData.itineraryItems, { day: formData.itineraryItems.length + 1, time: '', activity: '' }]
        });
    };

    const removeItineraryItem = (index) => {
        const newItems = [...formData.itineraryItems];
        newItems.splice(index, 1);
        setFormData({ ...formData, itineraryItems: newItems });
    };

    const updateItineraryItem = (index, field, value) => {
        const newItems = [...formData.itineraryItems];
        newItems[index][field] = value;
        setFormData({ ...formData, itineraryItems: newItems });
    };

    const uploadImages = async () => {
        const uploadedUrls = [];

        for (const file of selectedFiles) {
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '-')}`;
            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(fileName, file);

            if (error) {
                console.error('Error uploading image:', error);
                throw new Error('Gagal mengupload gambar: ' + error.message);
            }

            const { data: publicData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            uploadedUrls.push(publicData.publicUrl);
        }

        return uploadedUrls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);

        try {
            // 0. Validation for Accommodation
            if (formData.productType === 'Accommodation') {
                const totalImages = formData.gallery.length + selectedFiles.length;
                if (totalImages < 5) {
                    alert('Minimal upload 5 gambar untuk akomodasi.');
                    setSubmitLoading(false);
                    return;
                }
            }

            // 1. Upload Images
            let newImageUrls = [];
            if (selectedFiles.length > 0) {
                newImageUrls = await uploadImages();
            }

            // 2. Combine with existing gallery
            const finalGallery = [...formData.gallery, ...newImageUrls];
            const mainImageUrl = finalGallery.length > 0 ? finalGallery[0] : '';

            // 3. Prepare Payload
            const includesArray = formData.includesText.split('\n').filter(line => line.trim() !== '');
            const excludesArray = formData.excludesText.split('\n').filter(line => line.trim() !== '');
            const termsArray = formData.termsText.split('\n').filter(line => line.trim() !== '');

            // Use itineraryText if present (priority), else fallback to structured items
            const itineraryPayload = formData.itineraryText ? formData.itineraryText : formData.itineraryItems.map((item, index) => ({
                day: item.day || (index + 1),
                time: item.time || '',
                activity: item.activity
            }));

            const facilitiesArray = formData.facilitiesText.split('\n').filter(line => line.trim() !== '');
            const specsArray = formData.specsText.split('\n').filter(line => line.trim() !== '');

            const features = {
                includes: includesArray,
                excludes: excludesArray,
                itinerary: itineraryPayload,
                meeting_point: formData.meetingPoint,
                terms: termsArray,
                packages: formData.packages,
                // New Fields
                duration: formData.duration,
                original_price: formData.originalPrice, // Save to features
                facilities: facilitiesArray,
                specs: specsArray,
                vehicle_type: formData.vehicleType,
                product_type: formData.productType
            };

            const slug = formData.slug || formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            const payload = {
                title: formData.title,
                location: formData.location,
                price: formData.price,
                category: formData.category,
                description: formData.description,
                image_url: mainImageUrl, // First image is main
                gallery: finalGallery, // All images
                rating: formData.rating,
                views_count: parseInt(formData.views_count) || 0,
                slug: slug,
                features: features,
                schedules: formData.schedules,
                discount_percentage: formData.discount_percentage || 0,
                organizer: formData.organizer || 'Pandooin'
            };

            let error;
            if (formData.id) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(payload)
                    .eq('id', formData.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('products')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            setIsModalOpen(false);
            fetchProducts();
        } catch (error) {
            alert('Gagal menyimpan produk: ' + error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            fetchProducts();
        } catch (error) {
            alert('Gagal menghapus: ' + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                    {initialProductType === 'Trip' ? 'Manajemen Open Trip' :
                        initialProductType === 'Accommodation' ? 'Manajemen Akomodasi' :
                            initialProductType === 'Transportation' ? 'Manajemen Transportasi' :
                                'Manajemen Produk'}
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span>Tambah Produk</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari produk..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">
                                    {initialProductType === 'Accommodation' ? 'Nama Penginapan' :
                                        initialProductType === 'Transportation' ? 'Kendaraan' : 'Produk'}
                                </th>
                                <th className="px-6 py-4 font-semibold text-gray-700">
                                    {initialProductType === 'Trip' ? 'Durasi' :
                                        initialProductType === 'Transportation' ? 'Tipe' : 'Kategori'}
                                </th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Harga (Display)</th>
                                {initialProductType !== 'Transportation' && (
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-center">Views</th>
                                )}
                                {initialProductType === 'Transportation' && (
                                    <th className="px-6 py-4 font-semibold text-gray-700">Lokasi</th>
                                )}
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader className="animate-spin" size={20} />
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Belum ada data produk.
                                    </td>
                                </tr>
                            ) : (
                                products.filter(p => (p.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <ImageIcon size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 line-clamp-1">{item.title}</p>
                                                    <p className="text-sm text-gray-500">{item.location}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {initialProductType === 'Trip' ? (
                                                <span className="text-gray-600 text-sm">
                                                    {item.features?.duration || '-'}
                                                </span>
                                            ) : initialProductType === 'Transportation' ? (
                                                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">
                                                    {item.features?.vehicle_type || item.category}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                                                    {item.category}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.price}</td>
                                        {initialProductType !== 'Transportation' && (
                                            <td className="px-6 py-4 font-medium text-gray-900 text-center">{item.views_count || 0}</td>
                                        )}
                                        {initialProductType === 'Transportation' && (
                                            <td className="px-6 py-4 text-sm text-gray-600">{item.location}</td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-[fadeIn_0.3s_ease-out] max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <h3 className="font-bold text-lg text-gray-900">
                                {formData.id ? 'Edit Detail Produk' : 'Tambah Produk Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Section 1: Informasi Dasar & Kategori */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 border-b pb-2">Informasi Produk</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Product Type Selection */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Produk</label>
                                            <select
                                                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-blue-50 font-bold text-primary"
                                                value={formData.productType}
                                                onChange={e => {
                                                    const newType = e.target.value;
                                                    let defaultCat = 'Umum';
                                                    if (newType === 'Accommodation') defaultCat = 'Hotel';
                                                    if (newType === 'Transportation') defaultCat = 'MPV';

                                                    setFormData({
                                                        ...formData,
                                                        productType: newType,
                                                        category: defaultCat
                                                    });
                                                }}
                                            >
                                                <option value="Trip">Open Trip / Paket Wisata</option>
                                                <option value="Accommodation">Penginapan (Akomodasi)</option>
                                                <option value="Transportation">Transportasi (Rental)</option>
                                            </select>
                                        </div>

                                        {/* Common Fields */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {formData.productType === 'Accommodation' ? 'Nama Akomodasi' :
                                                    formData.productType === 'Transportation' ? 'Nama Kendaraan / Unit' : 'Judul Trip'}
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                required
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                placeholder={formData.productType === 'Accommodation' ? 'Contoh: Villa Bunga Melati' : 'Contoh: Sailing Komodo 3D2N'}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {formData.productType === 'Transportation' ? 'Lokasi Garasi / Kota' : 'Lokasi'}
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                required
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="Contoh: Labuan Bajo"
                                            />
                                        </div>

                                        {formData.productType === 'Trip' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi Trip (Hari/Malam)</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={formData.duration}
                                                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                                    placeholder="Contoh: 3 Hari 2 Malam"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {formData.productType === 'Accommodation' ? 'Tipe Akomodasi' :
                                                    formData.productType === 'Transportation' ? 'Kategori Kendaraan' : 'Kategori Wisata'}
                                            </label>
                                            <select
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                {formData.productType === 'Trip' && (
                                                    <>
                                                        <option>Beach/Island</option>
                                                        <option>Trekking/Camping</option>
                                                        <option>Nature</option>
                                                        <option>Culture/Culinary</option>
                                                        <option>Adventure</option>
                                                        <option>Umum</option>
                                                    </>
                                                )}
                                                {formData.productType === 'Accommodation' && (
                                                    <>
                                                        <option>Hotel</option>
                                                        <option>Villa</option>
                                                        <option>Resort</option>
                                                        <option>Glamping</option>
                                                        <option>Homestay</option>
                                                        <option>Losmen</option>
                                                        <option>Umum</option>
                                                    </>
                                                )}
                                                {formData.productType === 'Transportation' && (
                                                    <>
                                                        <option>MPV</option>
                                                        <option>SUV</option>
                                                        <option>Bus</option>
                                                        <option>Minibus</option>
                                                        <option>Luxury</option>
                                                        <option>Sewa Motor</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Normal / Coret (Bila ada diskon)</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                placeholder="Contoh: Rp 1.500.000"
                                                value={formData.originalPrice}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                    const numPrice = parseInt(val || '0');
                                                    const formatted = val ? 'Rp ' + numPrice.toLocaleString('id-ID') : '';

                                                    // Auto-calculate Display Price based on Normal Price and Discount
                                                    const discount = parseFloat(formData.discount_percentage || '0');

                                                    let newDisplayPrice = formData.price;
                                                    if (!isNaN(numPrice) && !isNaN(discount) && discount > 0 && discount < 100) {
                                                        const calculated = numPrice * ((100 - discount) / 100);
                                                        newDisplayPrice = 'Rp ' + Math.round(calculated).toLocaleString('id-ID');
                                                    } else {
                                                        newDisplayPrice = formatted; // If no discount, display price is the same as normal price
                                                    }

                                                    setFormData({ ...formData, originalPrice: formatted, price: newDisplayPrice });
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Tampilan (Harga Jual)</label>
                                            <input
                                                type="text"
                                                className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none ${formData.discount_percentage > 0 ? 'bg-gray-50' : ''}`}
                                                placeholder="Contoh: Rp 1.000.000"
                                                value={formData.price}
                                                readOnly={formData.discount_percentage > 0}
                                                onChange={e => {
                                                    if (formData.discount_percentage > 0) return; // Prevent manual edit if discount is active
                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                    const numPrice = parseInt(val || '0');
                                                    const formatted = val ? 'Rp ' + numPrice.toLocaleString('id-ID') : '';
                                                    setFormData({ ...formData, price: formatted, originalPrice: formatted }); // Sync original price if no discount
                                                }}
                                            />
                                            {formData.discount_percentage > 0 && <p className="text-[10px] text-primary italic mt-1 font-bold">Terkunci karena diskon aktif</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Diskon (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="w-full px-4 py-2 border border-green-100 bg-green-50/50 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                placeholder="Contoh: 10"
                                                value={formData.discount_percentage || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const discount = parseFloat(val);

                                                    const cleanNormal = (formData.originalPrice || '').replace(/[^0-9]/g, '');
                                                    const numNormal = parseInt(cleanNormal || '0');

                                                    let newDisplayPrice = formData.price;
                                                    if (!isNaN(numNormal) && !isNaN(discount) && discount > 0 && discount < 100) {
                                                        const calculated = numNormal * ((100 - discount) / 100);
                                                        newDisplayPrice = 'Rp ' + Math.round(calculated).toLocaleString('id-ID');
                                                    } else if (numNormal > 0) {
                                                        newDisplayPrice = 'Rp ' + numNormal.toLocaleString('id-ID'); // If no discount, display price is normal price
                                                    } else {
                                                        newDisplayPrice = ''; // Clear if normal price is 0
                                                    }

                                                    setFormData({
                                                        ...formData,
                                                        discount_percentage: val,
                                                        price: newDisplayPrice
                                                    });
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Penyelenggara (Trip Oleh)</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border border-blue-100 bg-blue-50/50 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary"
                                                value={formData.organizer}
                                                onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                                                placeholder="Contoh: Pandooin"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Views (Manual)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={formData.views_count}
                                                onChange={e => setFormData({ ...formData, views_count: parseInt(e.target.value) || 0 })}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Image Upload */}
                                        <div className="md:col-span-2 border-t pt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Upload Gambar {formData.productType === 'Accommodation' ? '(Min 5, Max 10)' : '(Max 4)'}
                                            </label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                                    <Upload size={24} />
                                                    <p className="text-sm">Upload Foto {formData.productType}</p>
                                                    <p className="text-xs text-gray-400">JPG, PNG, WEBP (Max 2MB)</p>
                                                </div>
                                            </div>

                                            {/* Previews */}
                                            {((formData.gallery || []).length > 0 || (previewUrls || []).length > 0) && (
                                                <div className="grid grid-cols-4 gap-4 mt-4">
                                                    {(formData.gallery || []).map((url, idx) => (
                                                        <div key={`existing-${idx}`} className="aspect-video rounded-lg overflow-hidden relative group border border-gray-200">
                                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeGalleryImage(idx)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-sm z-10"
                                                                title="Hapus Gambar"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {previewUrls.map((url, idx) => (
                                                        <div key={`new-${idx}`} className="aspect-video rounded-lg overflow-hidden relative group border border-green-200">
                                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-green-500/10 pointer-events-none"></div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSelectedFile(idx)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-sm z-10"
                                                                title="Batal Upload"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <div className="text-xs text-gray-500 col-span-full pt-2">
                                                        Total Gambar: {formData.gallery.length + selectedFiles.length} / {formData.productType === 'Accommodation' ? '10' : '4'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Lengkap</label>
                                            <textarea
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-24"
                                                placeholder={`Jelaskan detail ${formData.productType.toLowerCase()} ini...`}
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Type Specific Fields */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 border-b pb-2">
                                        {formData.productType === 'Trip' ? 'Detail Perjalanan & Fasilitas' :
                                            formData.productType === 'Accommodation' ? 'Fasilitas & Layanan' : 'Spesifikasi Kendaraan'}
                                    </h4>

                                    {/* --- TRIP SPECIFIC --- */}
                                    {formData.productType === 'Trip' && (
                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">Itinerary (Deskripsi Perjalanan)</label>
                                                </div>
                                                <textarea
                                                    className="w-full px-4 py-2 border border-blue-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-48 text-sm"
                                                    placeholder="Hari 1: Penjemputan di Bandara, check-in hotel...&#10;Hari 2: Sailing Komodo, Padar Island...&#10;Hari 3: Check-out, drop bandara."
                                                    value={formData.itineraryText}
                                                    onChange={e => setFormData({ ...formData, itineraryText: e.target.value })}
                                                ></textarea>
                                                <p className="text-xs text-gray-500 mt-1">Tulis rencana perjalanan secara lengkap per paragraf atau list.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Termasuk</label>
                                                    <textarea
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-32 text-sm"
                                                        placeholder="Transport AC&#10;Makan 3x"
                                                        value={formData.includesText}
                                                        onChange={e => setFormData({ ...formData, includesText: e.target.value })}
                                                    ></textarea>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga TIDAK Termasuk</label>
                                                    <textarea
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-32 text-sm"
                                                        placeholder="Tiket Pesawat&#10;Pengeluaran Pribadi"
                                                        value={formData.excludesText}
                                                        onChange={e => setFormData({ ...formData, excludesText: e.target.value })}
                                                    ></textarea>
                                                </div>
                                            </div>

                                            {/* S&K for Trip */}
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Syarat & Ketentuan</label>
                                                <textarea
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-32 text-sm"
                                                    placeholder="Contoh: Minimal DP 50%&#10;Pelunasah H-7&#10;Non-refundable"
                                                    value={formData.termsText}
                                                    onChange={e => setFormData({ ...formData, termsText: e.target.value })}
                                                ></textarea>
                                                <p className="text-xs text-gray-500 mt-1">Satu baris per poin S&K.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- ACCOMMODATION SPECIFIC --- */}
                                    {formData.productType === 'Accommodation' && (
                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Fasilitas Akomodasi</label>
                                                <textarea
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-32 text-sm"
                                                    placeholder="Contoh: Kolam Renang, Wifi, Sarapan, 2 Kamar Tidur..."
                                                    value={formData.facilitiesText}
                                                    onChange={e => setFormData({ ...formData, facilitiesText: e.target.value })}
                                                ></textarea>
                                                <p className="text-xs text-gray-500 mt-1">Satu baris per fasilitas.</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Syarat & Ketentuan / Kebijakan Check-in</label>
                                                <textarea
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-32 text-sm"
                                                    placeholder="Check-in 14:00&#10;Check-out 12:00&#10;Dilarang Merokok"
                                                    value={formData.termsText}
                                                    onChange={e => setFormData({ ...formData, termsText: e.target.value })}
                                                ></textarea>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- TRANSPORTATION SPECIFIC --- */}
                                    {formData.productType === 'Transportation' && (
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Kendaraan</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                        placeholder="Car, Bus, Minibus..."
                                                        value={formData.vehicleType}
                                                        onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Spesifikasi Kendaraan</label>
                                                <textarea
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-32 text-sm"
                                                    placeholder="7 Seater&#10;Bensin&#10;Manual&#10;Tahun 2023"
                                                    value={formData.specsText}
                                                    onChange={e => setFormData({ ...formData, specsText: e.target.value })}
                                                ></textarea>
                                                <p className="text-xs text-gray-500 mt-1">Satu baris per spek. Tulis kapasitas kursi di sini (misal: "7 Seat").</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Termasuk</label>
                                                    <textarea
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-32 text-sm"
                                                        placeholder="Driver&#10;BBM"
                                                        value={formData.includesText}
                                                        onChange={e => setFormData({ ...formData, includesText: e.target.value })}
                                                    ></textarea>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga TIDAK Termasuk</label>
                                                    <textarea
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-32 text-sm"
                                                        placeholder="Parkir&#10;Tol&#10;Makan Driver"
                                                        value={formData.excludesText}
                                                        onChange={e => setFormData({ ...formData, excludesText: e.target.value })}
                                                    ></textarea>
                                                </div>
                                            </div>

                                            {/* S&K for Transportation */}
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Syarat & Ketentuan / Kebijakan Rental</label>
                                                <textarea
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none h-32 text-sm"
                                                    placeholder="Contoh: Lepas Kunci wajib E-KTP&#10;Overtime 10% per jam&#10;Dilarang merokok"
                                                    value={formData.termsText}
                                                    onChange={e => setFormData({ ...formData, termsText: e.target.value })}
                                                ></textarea>
                                                <p className="text-xs text-gray-500 mt-1">Satu baris per poin S&K.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 3: Jadwal & Stok */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 border-b pb-2">
                                        {formData.productType === 'Accommodation' ? 'Ketersediaan Kamar & Harga' :
                                            formData.productType === 'Transportation' ? 'Ketersediaan Unit & Harga Sewa' : 'Jadwal & Meeting Point'}
                                    </h4>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h5 className="text-sm font-semibold text-gray-700">Manajemen Jadwal & Stok</h5>
                                            <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => setScheduleMode('single')}
                                                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${scheduleMode === 'single' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    Satu Tanggal
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setScheduleMode('range')}
                                                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${scheduleMode === 'range' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    Rentang Tanggal
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                                            {/* Meeting Point Input (Col 1-4) - Only for Trips */}
                                            {formData.productType === 'Trip' && (
                                                <div className="sm:col-span-4 space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <label className="text-xs text-gray-500 block">Meeting Point (Bisa &gt; 1)</label>
                                                        {formData.schedules.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (newSchedule.meetingPoints.length === 0) {
                                                                        if (!confirm("Meeting point kosong. Ini akan menghapus meeting point di semua jadwal. Lanjutkan?")) return;
                                                                    }

                                                                    const updatedSchedules = formData.schedules.map(s => ({
                                                                        ...s,
                                                                        meetingPoints: [...newSchedule.meetingPoints]
                                                                    }));
                                                                    setFormData({ ...formData, schedules: updatedSchedules });
                                                                    alert("Meeting point berhasil diterapkan ke semua jadwal!");
                                                                }}
                                                                className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-bold border border-blue-200"
                                                            >
                                                                Terapkan ke Semua Jadwal
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Contoh: Bandara"
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                            value={tempMeetingPoint}
                                                            onChange={e => setTempMeetingPoint(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    if (tempMeetingPoint.trim()) {
                                                                        setNewSchedule({
                                                                            ...newSchedule,
                                                                            meetingPoints: [...newSchedule.meetingPoints, tempMeetingPoint.trim()]
                                                                        });
                                                                        setTempMeetingPoint('');
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (tempMeetingPoint.trim()) {
                                                                    setNewSchedule({
                                                                        ...newSchedule,
                                                                        meetingPoints: [...newSchedule.meetingPoints, tempMeetingPoint.trim()]
                                                                    });
                                                                    setTempMeetingPoint('');
                                                                }
                                                            }}
                                                            className="bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-300"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {newSchedule.meetingPoints.map((mp, idx) => (
                                                            <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                                {mp}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newMPs = [...newSchedule.meetingPoints];
                                                                        newMPs.splice(idx, 1);
                                                                        setNewSchedule({ ...newSchedule, meetingPoints: newMPs });
                                                                    }}
                                                                    className="hover:text-red-500"
                                                                >
                                                                    <X size={10} />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Date Selection Area */}
                                            <div className="sm:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {scheduleMode === 'single' ? (
                                                    <div className="col-span-2">
                                                        <label className="text-xs text-gray-500 block mb-1">Tanggal</label>
                                                        <input
                                                            type="date"
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                            value={newSchedule.date}
                                                            onChange={e => setNewSchedule({ ...newSchedule, date: e.target.value })}
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <label className="text-xs text-gray-500 block mb-1">Dari Tanggal</label>
                                                            <input
                                                                type="date"
                                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                                                value={bulkStartDate}
                                                                onChange={e => setBulkStartDate(e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-500 block mb-1">Sampai Tanggal</label>
                                                            <input
                                                                type="date"
                                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                                                value={bulkEndDate}
                                                                onChange={e => setBulkEndDate(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-span-2 flex gap-2 overflow-x-auto pb-1">
                                                            {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day, idx) => (
                                                                <label key={day} className="flex items-center gap-1 text-xs cursor-pointer bg-white px-2 py-1 rounded border hover:bg-gray-50">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedDays[idx]}
                                                                        onChange={(e) => {
                                                                            const newDays = [...selectedDays];
                                                                            newDays[idx] = e.target.checked;
                                                                            setSelectedDays(newDays);
                                                                        }}
                                                                    />
                                                                    {day}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}

                                                {formData.productType === 'Accommodation' ? (
                                                    <div className="col-span-2 grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs text-gray-500 block mb-1">Harga Weekday (Sen-Kam)</label>
                                                            <input
                                                                type="number"
                                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                                                value={newSchedule.price}
                                                                onChange={e => setNewSchedule({ ...newSchedule, price: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-500 block mb-1">Harga Weekend (Jum-Min)</label>
                                                            <input
                                                                type="number"
                                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                                                value={newSchedule.weekendPrice || ''}
                                                                onChange={e => setNewSchedule({ ...newSchedule, weekendPrice: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Harga (Rp)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="2500000"
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                            value={newSchedule.price}
                                                            onChange={e => setNewSchedule({ ...newSchedule, price: e.target.value })}
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">
                                                        {formData.productType === 'Trip' ? 'Kuota Pax' : 'Stok Unit'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        placeholder="20"
                                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        value={newSchedule.quota}
                                                        onChange={e => setNewSchedule({ ...newSchedule, quota: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="sm:col-span-12 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (scheduleMode === 'single') {
                                                            if (!newSchedule.date || !newSchedule.price) {
                                                                alert("Mohon lengkapi tanggal dan harga");
                                                                return;
                                                            }
                                                            setFormData({
                                                                ...formData,
                                                                schedules: [
                                                                    ...formData.schedules,
                                                                    { ...newSchedule }
                                                                ]
                                                            });
                                                        } else {
                                                            // Bulk Generation
                                                            if (!bulkStartDate || !bulkEndDate || !newSchedule.price) {
                                                                alert("Mohon lengkapi rentang tanggal dan harga");
                                                                return;
                                                            }
                                                            const start = new Date(bulkStartDate);
                                                            const end = new Date(bulkEndDate);

                                                            if (start > end) {
                                                                alert("Tanggal akhir harus setelah tanggal awal");
                                                                return;
                                                            }

                                                            const newItems = [];
                                                            let current = start;
                                                            while (current <= end) {
                                                                if (selectedDays[current.getDay()]) {
                                                                    const isWeekend = [0, 5, 6].includes(current.getDay()); // Fri, Sat, Sun
                                                                    const priceToUse = (formData.productType === 'Accommodation' && isWeekend && newSchedule.weekendPrice)
                                                                        ? newSchedule.weekendPrice
                                                                        : newSchedule.price;

                                                                    newItems.push({
                                                                        ...newSchedule,
                                                                        price: priceToUse,
                                                                        date: current.toISOString().split('T')[0]
                                                                    });
                                                                }
                                                                current.setDate(current.getDate() + 1);
                                                            }

                                                            // Prevent duplicates or just append?
                                                            // Filter out existing dates to prevent pure duplicates if desired?
                                                            // For now, just append. User can delete.
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                schedules: [...prev.schedules, ...newItems]
                                                            }));

                                                            alert(`Berhasil menambahkan ${newItems.length} jadwal.`);
                                                        }

                                                        // Reset common fields
                                                        setNewSchedule({ ...newSchedule, date: '', booked: 0 });
                                                        // Keep price/quota/meeting points for easier consecutive adding
                                                    }}
                                                    className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-pink-700 text-sm font-medium"
                                                >
                                                    {scheduleMode === 'single' ? '+ Tambah Jadwal' : '+ Generate Jadwal'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-100 text-gray-600 font-semibold border-b sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3">Tanggal</th>
                                                    <th className="px-4 py-3">Harga</th>
                                                    {formData.productType === 'Trip' && <th className="px-4 py-3">Meeting Point</th>}
                                                    <th className="px-4 py-3 text-center">Stok</th>
                                                    <th className="px-4 py-3 text-center">Booked</th>
                                                    <th className="px-4 py-3 text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {formData.schedules.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-400 italic">
                                                            Belum ada data.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    formData.schedules.map((schedule, index) => {
                                                        const available = parseInt(schedule.quota) - (parseInt(schedule.booked) || 0);
                                                        const isLow = available < 5;
                                                        return (
                                                            <tr key={index} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 font-medium text-gray-800">{schedule.date}</td>
                                                                <td className="px-4 py-3 text-green-600 font-medium">Rp {parseInt(schedule.price).toLocaleString('id-ID')}</td>
                                                                {formData.productType === 'Trip' && (
                                                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {(schedule.meetingPoints || []).map((mp, i) => (
                                                                                <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-[10px]">{mp}</span>
                                                                            ))}
                                                                            {(!schedule.meetingPoints || schedule.meetingPoints.length === 0) && '-'}
                                                                        </div>
                                                                    </td>
                                                                )}
                                                                <td className={`px-4 py-3 text-center font-bold ${isLow ? 'text-red-500' : 'text-green-600'}`}>
                                                                    {schedule.quota}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">{schedule.booked || 0}</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <button type="button" onClick={() => removeSchedule(index)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>


                            </form>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-white shrink-0">
                            <button
                                onClick={handleSubmit}
                                disabled={submitLoading}
                                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-pink-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
                            >
                                {submitLoading ? 'Menyimpan...' : (formData.id ? 'Simpan Perubahan' : 'Tambah Produk')}
                            </button>
                        </div>
                    </div>
                </div >
            )}
        </div >
    );
};

export default ProductManagement;
// Adding organizer field to product management
