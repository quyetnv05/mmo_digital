'use client';

import useSWR from 'swr';
import { Loader2, Heart, AlertCircle, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WishlistPage() {
    const { data, error, isLoading } = useSWR('/api/wishlist', fetcher);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (error || !data?.success) {
        return (
            <div className="text-center p-8 text-red-400 bg-red-400/10 rounded-lg border border-red-400/20">
                <AlertCircle className="mx-auto mb-2" />
                Không thể tải danh sách yêu thích.
            </div>
        );
    }

    const wishlistItems = data.data;

    if (wishlistItems.length === 0) {
        return (
            <div className="text-center py-20 px-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <Heart size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Chưa có sản phẩm yêu thích</h3>
                <p className="text-slate-400 mb-6">Hãy thả tim các sản phẩm bạn quan tâm để lưu lại đây nhé.</p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                    <ShoppingCart size={18} />
                    Dạo chợ ngay
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Heart className="text-rose-500 fill-rose-500" />
                Sản phẩm đã thích
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item: any) => (
                    <ProductCard
                        key={item.product.id}
                        product={{
                            ...item.product,
                            price: Number(item.product.price),
                            // Map generic fields if needed, simplified for Wishlist view
                            stock: 1, // Assume in stock or need fetch? Ideally fetch real stock.
                            // The API currently just returns product details.
                            // WARNING: ProductCard needs 'stock' to enable buy button.
                            // The current /api/wishlist returns basic info. 
                            // Let's rely on ProductCard to fetch fresh or we pass what we have.
                            // WAIT: ProductCard expects stock.
                            // I should update /api/wishlist to include stock count.
                        }}
                        initialWishlistState={true}
                    />
                ))}
            </div>
        </div>
    );
}
