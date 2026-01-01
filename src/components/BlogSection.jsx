import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const BlogSection = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Fetch only published news, limit to 4
                const { data, error } = await supabase
                    .from('news')
                    .select('*')
                    .eq('status', 'Published')
                    .order('date', { ascending: false })
                    .limit(4);

                if (error) {
                    console.error('Error loading news:', error);
                } else {
                    // Map DB fields to UI expectation if needed
                    const formattedBlogs = data.map(item => ({
                        id: item.id,
                        title: item.title,
                        image: item.image_url || 'https://via.placeholder.com/800x600?text=No+Image',
                        author: "Admin", // or fetch from profile if connected
                        date: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                        day: new Date(item.date).getDate(),
                        month: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
                        excerpt: item.excerpt || 'Klik untuk membaca selengkapnya...'
                    }));
                    setBlogs(formattedBlogs);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    // Fallback if no real data yet
    const hasData = blogs.length > 0;

    return (
        <section className="py-20 bg-gradient-to-br from-gray-50 to-pink-50/30">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    {/* Left Content (Sticky Title) */}
                    <div className="lg:w-1/3 lg:sticky lg:top-24">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                            Dari Pantai hingga Pegunungan: <span className="text-primary">Ikuti Blog Kami</span> untuk Inspirasi Perjalanan
                        </h2>
                        <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                            Jangan lewatkan kisah perjalanan yang luar biasa ini. Dapatkan tips, panduan, dan inspirasi liburan terbaik.
                        </p>
                        <button className="bg-primary text-white text-base font-bold py-4 px-8 rounded-full shadow-lg shadow-pink-500/30 hover:bg-pink-700 hover:scale-105 transition-all duration-300 flex items-center gap-2 group">
                            Baca Artikel Lainnya
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Right Content (Scrollable Cards) */}
                    <div className="lg:w-2/3 w-full">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader className="animate-spin text-primary w-10 h-10" />
                            </div>
                        ) : !hasData ? (
                            <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                                Belum ada berita terbaru saat ini.
                            </div>
                        ) : (
                            <div className="flex overflow-x-auto pb-8 gap-6 snap-x scrollbar-hide -mx-4 px-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0">
                                {blogs.map((blog, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 min-w-[300px] snap-center flex flex-col h-full group">
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={blog.image}
                                                alt={blog.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute top-0 right-0 p-4">
                                                <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm w-12 text-center">
                                                    <span className="text-xs font-bold text-gray-900 block">{blog.month}</span>
                                                    <span className="text-xl font-bold text-primary block">{blog.day}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-3 group-hover:text-primary transition-colors">
                                                {blog.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1">
                                                {blog.excerpt}
                                            </p>
                                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-medium">
                                                <span>Oleh <span className="text-primary">{blog.author}</span></span>
                                                <span>{blog.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Mobile Pagination Dots (Visual Only) */}
                        <div className="flex gap-2 justify-center mt-4 lg:hidden">
                            {(blogs.length > 0 ? blogs : [1, 2]).map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-gray-300'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BlogSection;
