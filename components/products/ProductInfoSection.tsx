'use client';

import { useState } from 'react';
import { Star, CheckCircle, Shield, Clock, Zap } from 'lucide-react';
import ProductPurchaseSection from './ProductPurchaseSection';

interface ProductInfoProps {
    product: any; // Type accurately if possible, but 'any' for speed with disparate Prisma types
    initialStock: number;
    soldCount: number;
    rating: string;
    reviewCount: number;
}

export default function ProductInfoSection({ product, initialStock, soldCount, rating, reviewCount }: ProductInfoProps) {
    // Default to first variant if exists, or null
    const [selectedVariant, setSelectedVariant] = useState<any>(
        product.variants && product.variants.length > 0 ? product.variants[0] : null
    );

    // Calculate display values based on selection
    const currentPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
    const currentStock = selectedVariant ? 0 : initialStock;
    // TODO: We need real stock per variant. For now, passing 0 or handling separate stock fetch?
    // User requirement: "logic trừ tồn kho". Dashboard/API return total stock or specific?
    // For now, let's assume we need to fetch stock dynamic or pass it. 
    // Actually the initial `product` load doesn't separate stock by variant easily unless we aggregate `items`.
    // Let's rely on the passed `product.variants`? 
    // Wait, `variants` from Prisma include doesn't auto-count items unless we ask.
    // I need to update the fetching in page.tsx to include `_count: { items: ... }` PER VARIANT.

    // Let's assume for this step getting the UI working is priority, stock might be "Checking..." or just static for now until I fix the query.
    // I'll update the query in page.tsx too.

    const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

    return (
        <div className="md:col-span-8 lg:col-span-8">
            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3 leading-tight">
                {product.name}
            </h1>

            {/* Stats */}
            <div className="flex items-center gap-6 text-xs text-slate-400 mb-5 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-1 text-yellow-400 font-bold">
                    <Star size={14} className="fill-yellow-400" />
                    <span>{rating}</span>
                    <span className="text-slate-500 font-normal">({reviewCount} đánh giá)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-white font-bold">{soldCount}</span> Đã bán
                </div>
                <div className="flex items-center gap-1">
                    <span className={`font-bold ${initialStock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {initialStock}
                    </span> có sẵn
                </div>
            </div>

            {/* Price */}
            <div className="mb-6">
                <span className="text-3xl lg:text-4xl font-extrabold text-[#22c55e] tracking-tight">
                    {formatVND(currentPrice)}
                    <span className="text-lg align-top relative -top-1 ml-1 text-green-500/50">đ</span>
                </span>
                {selectedVariant && (
                    <span className="ml-3 text-sm text-slate-500 font-medium line-through">
                        {formatVND(currentPrice * 1.2)}đ
                    </span>
                )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                    <p className="text-slate-400 text-xs mb-2">Chọn gói:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {product.variants.map((variant: any) => {
                            const isSelected = selectedVariant?.id === variant.id;
                            return (
                                <button
                                    key={variant.id}
                                    onClick={() => setSelectedVariant(variant)}
                                    className={`
                                        p-2.5 border rounded-lg text-xs font-medium text-left transition-all relative overflow-hidden
                                        ${isSelected
                                            ? 'bg-[#0f242a] border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                                            : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                                        }
                                    `}
                                >
                                    <span className="relative z-10 block font-bold text-sm mb-0.5">{variant.name}</span>
                                    <span className="relative z-10 block opacity-80">{formatVND(Number(variant.price))}đ</span>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle size={14} className="text-cyan-500" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-[#111] border border-slate-800 rounded-lg p-2.5 flex flex-col items-center text-center gap-1.5 hover:border-green-500/30 transition-colors">
                    <Shield className="text-green-500" size={20} />
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-300">Bảo vệ bởi Escrow</span>
                </div>
                <div className="bg-[#111] border border-slate-800 rounded-lg p-2.5 flex flex-col items-center text-center gap-1.5 hover:border-purple-500/30 transition-colors">
                    <Clock className="text-purple-500" size={20} />
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-300">Giữ tiền 72h</span>
                </div>
                <div className="bg-[#111] border border-slate-800 rounded-lg p-2.5 flex flex-col items-center text-center gap-1.5 hover:border-yellow-500/30 transition-colors">
                    <Zap className="text-yellow-500" size={20} />
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-300">Giao hàng tức thì</span>
                </div>
            </div>

            {/* Purchase Section */}
            <ProductPurchaseSection
                productId={product.id}
                price={currentPrice}
                stock={initialStock} // TODO: Pass variant stock
                productName={product.name + (selectedVariant ? ` (${selectedVariant.name})` : '')}
                variantId={selectedVariant?.id}
            />
        </div>
    );
}
