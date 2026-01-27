import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Shield, Zap, CheckCircle, Package, Star, Clock, MessageCircle } from 'lucide-react';
import ChatSellerButton from '@/components/products/ChatSellerButton';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Components
// Components
import ProductTabs from '@/components/products/ProductTabs';
import ReviewForm from '@/components/reviews/ReviewForm';
import ProductImageSection from '@/components/products/ProductImageSection';
import ProductInfoSection from '@/components/products/ProductInfoSection';

// Force dynamic rendering
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

    const [product, soldCountRes, reviews, canReviewOrder, wishlistEntry] = await Promise.all([
        prisma.product.findUnique({
            where: { id: productId },
            include: {
                category: true,
                variants: {
                    include: {
                        _count: {
                            select: { items: { where: { isSold: false } } }
                        }
                    }
                },
                seller: {
                    select: {
                        id: true,
                        username: true,
                        sellerLevel: true,
                        createdAt: true,
                    }
                },
                _count: {
                    select: {
                        items: { where: { isSold: false } }
                    }
                }
            }
        }),
        // Fetch sold count separately efficiently
        prisma.productItem.count({
            where: {
                productId: productId,
                isSold: true
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
        }) : Promise.resolve(null),
        userId ? prisma.wishlist.findFirst({
            where: { userId, productId }
        }) : Promise.resolve(null)
    ]);

    const soldCount = soldCountRes;
    const canReview = !!canReviewOrder;
    const isWishlisted = !!wishlistEntry;

    if (!product || product.status !== 'ACTIVE') {
        notFound();
    }

    const stock = product._count.items;

    // Calculate Review Stats
    const ratingSum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = reviews.length > 0 ? (ratingSum / reviews.length).toFixed(1) : '5.0';

    // Format Price
    const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
                {/* Navigation */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-xs font-medium uppercase tracking-wide"
                >
                    <ArrowLeft size={16} />
                    Quay lại Cửa hàng
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Image & Seller Info (4 cols) */}
                    <ProductImageSection product={product} initialIsWishlisted={isWishlisted} />

                    {/* RIGHT COLUMN: Info & Actions (8 cols) */}
                    {/* Refactored into Client Component for interactivity */}
                    <div className="md:col-span-8 lg:col-span-8">
                        <ProductInfoSection
                            product={product}
                            initialStock={stock}
                            soldCount={soldCount}
                            rating={avgRating}
                            reviewCount={reviews.length}
                        />
                    </div>
                </div>


                {/* Bottom Tabs (Review / Description) */}
                <ProductTabs
                    description={product.description || ''}
                    reviewsContent={
                        <div className="space-y-6">
                            {canReview && <ReviewForm productId={product.id} />}
                            {reviews.length > 0 ? (
                                reviews.map((review) => (
                                    <div key={review.id} className="border-b border-slate-800 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                                                {review.user.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{review.user.username}</p>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={10} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'} />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500 ml-auto">
                                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm indent-1">{review.comment}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-500 italic">Chưa có đánh giá nào cho sản phẩm này.</div>
                            )}
                        </div>
                    }
                />
            </div>
        </div>
    );
}
