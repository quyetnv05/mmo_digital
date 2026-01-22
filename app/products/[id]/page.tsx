'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Shield, Zap, Star, ShoppingCart, Minus, Plus,
    Clock, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';

// Mock product data (will come from API)
const mockProducts: Record<string, any> = {
    '1': {
        id: 1,
        name: 'Clone Facebook 2FA - Đã xác minh danh tính',
        description: 'Tài khoản Facebook Clone đã xác minh 2FA, an toàn cho mọi hoạt động marketing. Tài khoản được tạo bằng IP sạch, không spam, không vi phạm tiêu chuẩn cộng đồng.',
        price: 15000,
        warrantyHours: 24,
        stock: 150,
        sold: 1234,
        category: 'Facebook',
        seller: { id: 1, username: 'seller_pro' },
        features: [
            'Đã xác minh 2FA',
            'IP sạch - không spam',
            'Hình đại diện + bìa đầy đủ',
            'Có bạn bè 50-500',
            'Tuổi tài khoản > 30 ngày',
        ],
    },
};

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // Get product (mock for now)
    const product = mockProducts[productId] || mockProducts['1'];

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const handleQuantityChange = (delta: number) => {
        const newQty = quantity + delta;
        if (newQty >= 1 && newQty <= product.stock) {
            setQuantity(newQty);
        }
    };

    const handlePurchase = async () => {
        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/orders/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    quantity,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    success: true,
                    message: `Mua thành công ${quantity} tài khoản! Đang chuyển đến trang đơn hàng...`,
                });
                setTimeout(() => {
                    router.push('/dashboard/orders');
                }, 2000);
            } else {
                setResult({
                    success: false,
                    message: data.message || 'Có lỗi xảy ra, vui lòng thử lại.',
                });
            }
        } catch (error) {
            setResult({
                success: false,
                message: 'Lỗi kết nối, vui lòng thử lại.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const totalPrice = product.price * quantity;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
                <div className="max-w-6xl mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Quay lại</span>
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Product Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Category & Rating */}
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-full">
                                {product.category}
                            </span>
                            <div className="flex items-center gap-1 text-amber-400">
                                <Star size={16} className="fill-amber-400" />
                                <span className="font-medium">4.9</span>
                                <span className="text-slate-500 text-sm">({product.sold} đã bán)</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl lg:text-3xl font-bold text-white">
                            {product.name}
                        </h1>

                        {/* Description */}
                        <p className="text-slate-400 leading-relaxed">
                            {product.description}
                        </p>

                        {/* Features */}
                        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Đặc điểm sản phẩm</h3>
                            <ul className="space-y-2">
                                {product.features.map((feature: string, index: number) => (
                                    <li key={index} className="flex items-center gap-2 text-slate-300">
                                        <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Warranty & Delivery Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                                <Shield size={24} className="text-green-400" />
                                <div>
                                    <p className="text-green-400 font-semibold">Bảo hành {product.warrantyHours}h</p>
                                    <p className="text-green-400/70 text-sm">Đổi/hoàn 100% nếu lỗi</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                                <Zap size={24} className="text-blue-400" />
                                <div>
                                    <p className="text-blue-400 font-semibold">Giao hàng tự động</p>
                                    <p className="text-blue-400/70 text-sm">Nhận ngay sau khi thanh toán</p>
                                </div>
                            </div>
                        </div>

                        {/* Seller Info */}
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">S</span>
                            </div>
                            <div>
                                <p className="text-white font-medium">{product.seller.username}</p>
                                <p className="text-slate-500 text-sm">Đã xác minh • 500+ đã bán</p>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Card */}
                    <div className="lg:sticky lg:top-20 h-fit">
                        <div className="rounded-xl bg-slate-800/70 border border-slate-700/50 p-6 space-y-6">
                            {/* Price */}
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Giá mỗi tài khoản</p>
                                <p className="text-3xl font-bold text-white">
                                    {formatVND(product.price)}
                                    <span className="text-lg text-slate-400 font-normal">đ</span>
                                </p>
                            </div>

                            {/* Stock */}
                            <div className="flex items-center justify-between py-2 border-y border-slate-700/50">
                                <span className="text-slate-400">Tồn kho</span>
                                <span className={`font-semibold ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {product.stock > 0 ? `${product.stock} sản phẩm` : 'Hết hàng'}
                                </span>
                            </div>

                            {/* Quantity Selector */}
                            <div>
                                <p className="text-slate-400 text-sm mb-2">Số lượng</p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        disabled={quantity <= 1}
                                        className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                    >
                                        <Minus size={18} className="text-white" />
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setQuantity(Math.min(Math.max(1, val), product.stock));
                                        }}
                                        className="w-20 text-center py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-semibold"
                                    />
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        disabled={quantity >= product.stock}
                                        className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                    >
                                        <Plus size={18} className="text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-300">Tổng thanh toán</span>
                                    <span className="text-2xl font-bold text-white">
                                        {formatVND(totalPrice)}đ
                                    </span>
                                </div>
                            </div>

                            {/* Purchase Button */}
                            <button
                                onClick={handlePurchase}
                                disabled={isLoading || product.stock === 0}
                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 
                  hover:from-blue-500 hover:to-purple-500
                  disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed
                  text-white font-semibold rounded-lg shadow-lg
                  flex items-center justify-center gap-2 transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart size={20} />
                                        Mua ngay
                                    </>
                                )}
                            </button>

                            {/* Result Message */}
                            {result && (
                                <div
                                    className={`p-3 rounded-lg flex items-start gap-2 ${result.success
                                            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                            : 'bg-red-500/10 border border-red-500/30 text-red-400'
                                        }`}
                                >
                                    {result.success ? (
                                        <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                    )}
                                    <span className="text-sm">{result.message}</span>
                                </div>
                            )}

                            {/* Security Note */}
                            <p className="text-xs text-slate-500 text-center">
                                🔒 Giao dịch được bảo vệ bởi hệ thống Escrow
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
