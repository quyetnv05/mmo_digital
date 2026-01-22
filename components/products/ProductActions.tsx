'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductActionsProps {
    productId: number;
    price: number;
    stock: number;
    productName: string;
}

export default function ProductActions({ productId, price, stock, productName }: ProductActionsProps) {
    const router = useRouter();
    const [isBuying, setIsBuying] = useState(false);

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const handleBuy = async () => {
        if (stock <= 0) return;

        if (!confirm(`Xác nhận mua 1 ${productName} với giá ${formatVND(price)}đ?`)) return;

        setIsBuying(true);
        try {
            const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity: 1 }),
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
        <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400">Giá bán</span>
                    <span className="text-2xl font-bold text-white">{formatVND(price)}đ</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                    <span className="text-slate-400">Tình trạng</span>
                    <span className={`font-medium ${stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stock > 0 ? `Còn hàng (${stock})` : 'Hết hàng'}
                    </span>
                </div>

                <button
                    onClick={handleBuy}
                    disabled={stock <= 0 || isBuying}
                    className={`w-full py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                        ${stock > 0
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/20'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    {isBuying ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
                    {stock > 0 ? (isBuying ? 'Đang xử lý...' : 'Mua ngay') : 'Hết hàng'}
                </button>

                <p className="text-xs text-center text-slate-500 mt-3 flex items-center justify-center gap-1">
                    <AlertCircle size={12} />
                    Giao dịch được bảo vệ và giao hàng tự động.
                </p>
            </div>
        </div>
    );
}
