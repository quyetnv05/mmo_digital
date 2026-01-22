'use client';

import Link from 'next/link';
import { ShoppingCart, Package, Shield, Zap, Star, ChevronRight, Loader2, CheckCircle, AlertCircle, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

function AuthButtons() {
    const fetcher = (url: string) => fetch(url).then(res => res.json());
    const { data, isLoading } = useSWR('/api/auth/me', fetcher);
    // data structure based on auth/me api: { success: true, user: {...} }

    if (isLoading) return <div className="w-24 h-8 bg-slate-800 animate-pulse rounded-lg"></div>;

    if (data?.success && data?.user) {
        return (
            <Link href="/dashboard" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all flex items-center gap-2 border border-slate-700">
                <User size={18} className="text-blue-400" />
                <span>Dashboard ({new Intl.NumberFormat('vi-VN').format(data.user.balance)}đ)</span>
            </Link>
        );
    }

    return (
        <>
            <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors">
                Đăng nhập
            </Link>
            <Link href="/auth/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all">
                Đăng ký
            </Link>
        </>
    );
}

// ProductCard is now imported from @/components/ProductCard
import ProductCard, { Product } from '@/components/ProductCard';

// Hero Section & Categories (Unchanged)
function HeroSection() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-slate-700/50 p-8 lg:p-12 mb-8">
            <div className="relative z-10 max-w-2xl">
                <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4">
                    MMO Digital
                    <span className="text-gradient"> Marketplace</span>
                </h1>
                <p className="text-slate-300 text-lg mb-6">
                    Nền tảng mua bán tài khoản số hàng đầu Việt Nam.
                    Giao dịch tự động, bảo hành 24/7, thanh toán an toàn với hệ thống Escrow.
                </p>
                <div className="flex flex-wrap gap-4">
                    <Link
                        href="/dashboard"
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg flex items-center gap-2 transition-all"
                    >
                        Bắt đầu mua hàng
                        <ChevronRight size={18} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Categories Filter with State
function FilterSection({
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sort,
    setSort,
    inStockOnly,
    setInStockOnly
}: any) {
    const [categories, setCategories] = useState<{ id: number, name: string }[]>([
        { id: 0, name: 'Tất cả' }
    ]);

    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCategories([
                        { id: 0, name: 'Tất cả' },
                        ...data.data
                    ]);
                }
            })
            .catch(err => console.error('Failed to load categories', err));
    }, []);

    return (
        <div className="mb-8 space-y-4">
            {/* Search & Sort Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />

                <div className="flex flex-wrap gap-2">
                    <input
                        type="number"
                        placeholder="Min Price"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-24 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                        type="number"
                        placeholder="Max Price"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-24 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                    </select>
                    <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:border-green-500/50 transition-colors">
                        <input
                            type="checkbox"
                            checked={inStockOnly}
                            onChange={(e) => setInStockOnly(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-slate-700"
                        />
                        <span className="text-sm text-slate-300 whitespace-nowrap">Còn hàng</span>
                    </label>
                </div>
            </div>

            {/* Category Tags */}
            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all
                            ${activeCategory === cat.id
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700/50'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function HomePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter States
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState(0);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sort, setSort] = useState('newest');
    const [inStockOnly, setInStockOnly] = useState(false);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, activeCategory, maxPrice, minPrice, sort, inStockOnly]);

    const fetchProducts = () => {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (activeCategory !== 0) params.append('categoryId', activeCategory.toString());
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (sort) params.append('sort', sort);
        if (inStockOnly) params.append('inStockOnly', 'true');

        fetch(`/api/products?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProducts(data.data);
                }
            })
            .finally(() => setIsLoading(false));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">M</span>
                            </div>
                            <span className="text-white font-semibold text-lg">MMO Shop</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <AuthButtons />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                <HeroSection />

                <FilterSection
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    search={search}
                    setSearch={setSearch}
                    minPrice={minPrice}
                    setMinPrice={setMinPrice}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    sort={sort}
                    setSort={setSort}
                    inStockOnly={inStockOnly}
                    setInStockOnly={setInStockOnly}
                />

                {isLoading ? (
                    <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        Loading products...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {products.length > 0 ? (
                            products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                Không tìm thấy sản phẩm nào phù hợp.
                            </div>
                        )}
                    </div>
                )}
            </main>

            <footer className="mt-16 border-t border-slate-800 py-8">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center text-slate-500">
                    <p>© 2026 MMO Digital Marketplace. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
