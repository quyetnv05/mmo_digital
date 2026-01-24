'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ShoppingCart,
    Loader2,
    Star,
    Shield,
    Zap,
    Heart,
    Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    category: string;
    warrantyHours: number;
    rating?: number; // Added rating
    reviewCount?: number; // Added count
    imageUrl?: string | null; // Added imageUrl
}

export default function ProductCard({ product, initialWishlistState = false }: { product: Product; initialWishlistState?: boolean }) {
    const router = useRouter();
    const [isBuying, setIsBuying] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(initialWishlistState);
    const [isWishlistLoading, setIsWishlistLoading] = useState(false);

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const handleBuyClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (product.stock <= 0) return;
        setShowConfirm(true);
    };

    const handleConfirmBuy = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsBuying(true);
        setShowConfirm(false);

        try {
            const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, quantity: 1 }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Mua hàng thành công!');
                router.push('/dashboard/orders');
            } else {
                if (data.error === 'Unauthorized') {
                    toast.error('Vui lòng đăng nhập');
                    router.push('/auth/login');
                } else {
                    toast.error(data.error || 'Mua thất bại');
                }
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        } finally {
            setIsBuying(false);
        }
    };

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isWishlistLoading) return;
        setIsWishlistLoading(true);

        // Optimistic UI
        const previousState = isWishlisted;
        setIsWishlisted(!isWishlisted);

        try {
            const res = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id }),
            });
            const data = await res.json();

            if (!data.success) {
                // Revert if unauthorized or failed
                if (data.error === 'Unauthorized') {
                    toast.error('Vui lòng đăng nhập để lưu yêu thích');
                } else {
                    toast.error('Lỗi lưu yêu thích');
                }
                setIsWishlisted(previousState);
            }
        } catch (error) {
            setIsWishlisted(previousState);
            toast.error('Lỗi kết nối');
        } finally {
            setIsWishlistLoading(false);
        }
    };

    return (
        <>
            {showConfirm && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={(e) => { e.preventDefault(); setShowConfirm(false); }}
                >
                    <div
                        className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Xác nhận mua hàng?</h3>
                        <div className="space-y-3 mb-6 bg-slate-800/50 p-4 rounded-lg">
                            <div className="flex justify-between text-slate-300">
                                <span>Sản phẩm:</span>
                                <span className="font-medium text-white text-right truncate pl-4 max-w-[200px]">{product.name}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Giá:</span>
                                <span className="font-bold text-blue-400">{formatVND(product.price)}đ</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={(e) => { e.preventDefault(); setShowConfirm(false); }}
                                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleConfirmBuy}
                                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20"
                            >
                                Xác nhận mua
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Link
                href={`/products/${product.id}`}
                className="group relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 flex flex-col h-full"
            >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Wishlist Button - Top Right */}
                <button
                    onClick={toggleWishlist}
                    className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-200 
                        ${isWishlisted
                            ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                            : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/60 hover:text-white'
                        }`}
                >
                    <Heart size={18} className={isWishlisted ? 'fill-rose-500' : ''} />
                </button>

                {/* Product Image */}
                <div className="relative aspect-[16/9] bg-slate-900 border-b border-slate-700/50 overflow-hidden">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                            <Package size={48} strokeWidth={1} />
                        </div>
                    )}

                    {/* Category Badge - Now overlays image */}
                    <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 text-xs font-medium text-white bg-black/50 backdrop-blur-md border border-white/10 rounded-full">
                            {product.category}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="relative p-5 flex flex-col flex-1">
                    {/* Rating - Moved here */}
                    <div className="flex items-center justify-end mb-2">
                        <div className="flex items-center gap-1 text-amber-400">
                            <Star size={14} className="fill-amber-400" />
                            <span className="text-xs font-medium">
                                {product.rating ? product.rating.toFixed(1) : '5.0'}
                            </span>
                            {product.reviewCount ? (
                                <span className="text-xs text-slate-500">({product.reviewCount})</span>
                            ) : null}
                        </div>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {product.name}
                    </h3>

                    {/* Features */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-4 mt-auto">
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
                    <div className="flex items-end justify-between mt-2">
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
                        onClick={handleBuyClick}
                        disabled={product.stock <= 0 || isBuying}
                        className={`mt-4 w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 z-20
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
        </>
    );
}
