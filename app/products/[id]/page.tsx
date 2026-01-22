import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Shield, Zap, CheckCircle, Package, Star } from 'lucide-react';
import ProductActions from '@/components/products/ProductActions';
import ReviewForm from '@/components/reviews/ReviewForm';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Force dynamic rendering to ensure stock count is fresh
export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

interface Props {
    params: Promise<{ id: string }>;
}

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        return decoded.userId;
    } catch { return null; }
}

export default async function ProductDetailPage({ params }: Props) {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        notFound();
    }

    const userId = await getUserId();

    const [product, reviews, canReviewOrder] = await Promise.all([
        prisma.product.findUnique({
            where: { id: productId },
            include: {
                category: true,
                seller: {
                    select: {
                        username: true,
                        sellerLevel: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: { items: { where: { isSold: false } } }
                }
            }
        }),
        prisma.review.findMany({
            where: { productId },
            include: { user: { select: { username: true } } },
            orderBy: { createdAt: 'desc' }
        }),
        userId ? prisma.order.findFirst({
            where: {
                buyerId: userId,
                productId: productId,
                status: 'COMPLETED',
                review: { is: null }
            }
        }) : Promise.resolve(null)
    ]);

    const canReview = !!canReviewOrder;

    if (!product || product.status !== 'ACTIVE') {
        notFound();
    }

    const stock = product._count.items;

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Navigation */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    Quay lại trang chủ
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 lg:p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {product.category.name}
                                </span>
                                <span className="text-slate-500 text-sm">
                                    Mã SP: #{product.id}
                                </span>
                            </div>

                            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                                {product.name}
                            </h1>

                            <div className="flex flex-wrap gap-6 border-y border-slate-800 py-6 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Bảo hành</p>
                                        <p className="text-white font-medium">{product.warrantyHours} giờ</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Giao hàng</p>
                                        <p className="text-white font-medium">Tự động</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Định dạng</p>
                                        <p className="text-white font-medium">{product.format}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">Mô tả sản phẩm</h3>
                                <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-line">
                                    {product.description}
                                </div>
                            </div>
                        </div>

                        {/* Seller Info */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Thông tin người bán</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                    {product.seller.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-white font-medium flex items-center gap-2">
                                        {product.seller.username}
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                                            {product.seller.sellerLevel}
                                        </span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Tham gia từ {product.seller.createdAt.toISOString().split('T')[0]}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                <Star className="text-amber-400 fill-amber-400" />
                                Đánh giá sản phẩm
                            </h3>

                            {canReview && (
                                <ReviewForm productId={product.id} />
                            )}

                            <div className="space-y-6">
                                {reviews.length > 0 ? (
                                    reviews.map((review) => (
                                        <div key={review.id} className="border-b border-slate-800 last:border-0 pb-6 last:pb-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                                        {review.user.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{review.user.username}</p>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={12}
                                                                    className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm mt-2">{review.comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-500 py-4">Chưa có đánh giá nào.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Actions */}
                    <div className="space-y-6">
                        <ProductActions
                            productId={product.id}
                            price={Number(product.price)}
                            stock={stock}
                            productName={product.name}
                        />

                        <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                            <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                                <Package size={16} /> Chính sách bán hàng
                            </h4>
                            <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                                <li>Kiểm tra tài khoản ngay sau khi mua.</li>
                                <li>Liên hệ support nếu có vấn đề đăng nhập.</li>
                                <li>Không change pass trong thời gian bảo hành.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
