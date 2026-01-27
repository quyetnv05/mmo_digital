'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductPurchaseSectionProps {
    productId: number;
    price: number;
    stock: number;
    productName: string;
    variantId?: number; // Optional variant ID
}

export default function ProductPurchaseSection({ productId, price, stock, productName, variantId }: ProductPurchaseSectionProps) {
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [isBuying, setIsBuying] = useState(false);

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const handleQuantityChange = (delta: number) => {
        const newQty = quantity + delta;
        if (newQty >= 1 && newQty <= stock) {
            setQuantity(newQty);
        }
    };

    const handleBuy = async () => {
        if (stock <= 0) return;

        if (!confirm(`Xác nhận mua ${quantity} ${productName} với tổng giá ${formatVND(price * quantity)}đ?`)) return;

        setIsBuying(true);
        try {
            const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity, variantId }), // Pass variantId
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Mua hàng thành công!');
                router.push('/dashboard/orders');
            } else {
                if (data.error === 'Unauthorized') {
                    toast.error('Vui lòng đăng nhập để mua hàng');
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

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-5">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 font-medium text-sm">Số lượng</span>
                <div className="flex items-center bg-slate-800 rounded-lg border border-slate-600 relative z-10">
                    <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700/50 rounded-l-lg"
                        disabled={quantity <= 1}
                        aria-label="Giảm số lượng"
                    >
                        <Minus size={16} className="pointer-events-none" />
                    </button>
                    <span className="w-12 text-center font-bold text-white text-sm mb-0.5 select-none lining-nums">{quantity}</span>
                    <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700/50 rounded-r-lg"
                        disabled={quantity >= stock}
                        aria-label="Tăng số lượng"
                    >
                        <Plus size={16} className="pointer-events-none" />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                <span className="text-slate-400 font-medium text-sm">Tổng tiền:</span>
                <span className="text-xl font-bold text-white">{formatVND(price * quantity)}đ</span>
            </div>

            <button
                onClick={handleBuy}
                disabled={stock <= 0 || isBuying}
                className={`w-full py-3 rounded-lg font-bold text-base uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg
                    ${stock > 0
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
            >
                {isBuying ? <Loader2 className="animate-spin" size={18} /> : null}
                {stock > 0 ? (isBuying ? 'Đang xử lý...' : 'Mua ngay') : 'Hết hàng'}
            </button>
        </div>
    );
}
