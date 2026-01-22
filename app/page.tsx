'use client';

import Link from 'next/link';
import { ShoppingCart, Package, Shield, Zap, Star, ChevronRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    category: string;
    warrantyHours: number;
}

// Product Card Component with Buy Logic
function ProductCard({ product }: { product: Product }) {
    const router = useRouter();
    const [isBuying, setIsBuying] = useState(false);

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const handleBuy = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        if (product.stock <= 0) return;

        if (!window.confirm(`Xác nhận mua 1 ${product.name} với giá ${formatVND(product.price)}đ?`)) return;

        setIsBuying(true);
        try {
            const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, quantity: 1 }),
            });
            const data = await res.json();

            if (data.success) {
                alert('Mua hàng thành công!');
                router.push('/dashboard/orders');
            } else {
                alert('Mua thất bại: ' + (data.error || 'Lỗi không xác định'));
                if (data.error === 'Unauthorized') router.push('/auth/login');
            }
        } catch (error) {
            alert('Lỗi kết nối');
        } finally {
            setIsBuying(false);
        }
    };

    return (
        <Link
            href={`/products/${product.id}`}
            className="group relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300"
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Content */}
            <div className="relative p-5">
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-full">
                        {product.category}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400">
                        <Star size={14} className="fill-amber-400" />
                        <span className="text-xs font-medium">4.9</span>
                    </div>
                </div>

                {/* Product Name */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {product.name}
                </h3>

                {/* Features */}
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                        <Shield size={12} className="text-green-400" />
                        <span>Bảo hành {product.warrantyHours}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Zap size={12} className="text-amber-400" />
                        <span>Giao ngay</span>
                    </div>
                </div>

                {/* Price & Stock */}
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Giá mỗi tài khoản</p>
                        <p className="text-xl font-bold text-white">
                            {formatVND(product.price)}
                            <span className="text-sm text-slate-400 font-normal">đ</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Tồn kho</p>
                        <p className={`text-lg font-semibold ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {product.stock > 0 ? product.stock : 'Hết hàng'}
                        </p>
                    </div>
                </div>

                {/* Buy Button */}
                <button
                    onClick={handleBuy}
                    disabled={product.stock <= 0 || isBuying}
                    className={`mt-4 w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200
            ${product.stock > 0
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    {isBuying ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                    {product.stock > 0 ? (isBuying ? 'Đang xử lý...' : 'Mua ngay') : 'Hết hàng'}
                </button>
            </div>
        </Link>
    );
}

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
    const categories = [
        { id: 0, name: 'Tất cả', icon: Package },
        { id: 1, name: 'Facebook', icon: Package },
        { id: 2, name: 'Gmail', icon: Package },
        { id: 3, name: 'Tiktok', icon: Package },
        { id: 4, name: 'Instagram', icon: Package },
    ];

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

                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Min Price"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-28 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                        type="number"
                        placeholder="Max Price"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-28 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
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
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all
                            ${activeCategory === cat.id
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
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
                            <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors">
                                Đăng nhập
                            </Link>
                            <Link href="/auth/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all">
                                Đăng ký
                            </Link>
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
