'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Share2, Heart, Check, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ChatSellerButton from '@/components/products/ChatSellerButton';

interface ProductImageSectionProps {
    product: {
        id: number;
        name: string;
        imageUrl?: string | null;
        category: { name: string };
        seller: {
            id: number;
            username: string;
            sellerLevel: string;
        };
    };
    initialIsWishlisted?: boolean;
}

export default function ProductImageSection({ product, initialIsWishlisted = false }: ProductImageSectionProps) {
    const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setIsSharing(true);
            toast.success('Đã sao chép liên kết!');
            setTimeout(() => setIsSharing(false), 2000);
        } catch (err) {
            toast.error('Lỗi khi sao chép');
        }
    };

    const handleFavorite = async () => {
        // Optimistic UI
        const newState = !isWishlisted;
        setIsWishlisted(newState);

        try {
            const res = await fetch('/api/wishlist/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id }),
            });
            const data = await res.json();

            if (!data.success) {
                // Revert on error
                setIsWishlisted(!newState);
                if (data.error === 'Unauthorized') {
                    toast.error('Vui lòng đăng nhập');
                } else {
                    toast.error('Lỗi cập nhật yêu thích');
                }
            } else {
                toast.success(newState ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích');
            }
        } catch (error) {
            setIsWishlisted(!newState);
            toast.error('Lỗi kết nối');
        }
    };

    return (
        <div className="lg:col-span-4 space-y-4">
            {/* Product Image Placeholder - Condensed Size */}
            <div className="relative aspect-square bg-[#111] border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden group">
                {/* Badges Removed as per user request */}

                {/* Main Icon */}
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 bg-cyan-400 rounded-full mix-blend-screen animate-pulse" style={{ left: '-3px', opacity: 0.7 }}></div>
                        <div className="absolute inset-0 bg-red-500 rounded-full mix-blend-screen animate-pulse" style={{ right: '-3px', opacity: 0.7 }}></div>
                        <div className="absolute inset-0 bg-white rounded-full flex items-center justify-center text-black font-bold text-3xl">
                            M
                        </div>
                    </div>
                )}
            </div>

            {/* Share & Wishlist Btns - Active */}
            <div className="flex gap-3">
                <button
                    onClick={handleShare}
                    className="flex-1 py-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm font-medium"
                >
                    {isSharing ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
                    {isSharing ? 'Đã sao chép' : 'Chia sẻ'}
                </button>
                <button
                    onClick={handleFavorite}
                    className={`flex-1 py-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center gap-2 transition-all text-sm font-medium
                            ${isWishlisted ? 'text-red-500 border-red-500/30 bg-red-500/5' : 'text-slate-400 hover:text-red-500 hover:border-red-500/30'}
                        `}
                >
                    <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
                    {isWishlisted ? 'Đã thích' : 'Yêu thích'}
                </button>
            </div>

            {/* Seller Info Box - Condensed */}
            <div className="bg-[#111] border border-slate-800 rounded-lg p-4">
                <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Thông tin người bán</h3>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-base border border-slate-700">
                        {product.seller.username[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="text-white font-bold flex items-center gap-1.5 text-sm">
                            {product.seller.username}
                        </p>
                        <p className="text-[10px] text-green-500 flex items-center gap-1">
                            <span className="w-1 h-1 bg-green-500 rounded-full"></span> Trực tuyến
                        </p>
                    </div>
                    <div className="ml-auto">
                        <ChatSellerButton sellerId={product.seller.id} productId={product.id} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded">
                    <div className="text-center p-1 border-r border-slate-800">
                        <span className="block text-white font-bold text-xs">98%</span>
                        Phản hồi tốt
                    </div>
                    <div className="text-center p-1">
                        <span className="block text-white font-bold text-xs">{product.seller.sellerLevel}</span>
                        Cấp bậc
                    </div>
                </div>
            </div>
        </div>
    );
}
