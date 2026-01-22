import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        return decoded.userId;
    } catch (e) {
        return null;
    }
}

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get('productId');

    if (!productId) {
        return NextResponse.json({ success: false, error: 'ProductId required' }, { status: 400 });
    }

    try {
        const reviews = await prisma.review.findMany({
            where: { productId: parseInt(productId) },
            include: {
                user: {
                    select: { username: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10 // Limit for now
        });

        return NextResponse.json({ success: true, data: reviews });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { productId, rating, comment } = await req.json();

        // 1. Verify User purchased this product
        // Find an order for this product by this user that is NOT reviewed yet
        const order = await prisma.order.findFirst({
            where: {
                buyerId: userId,
                productId: productId,
                status: 'COMPLETED',
                // Ensure no review exists for this order
                review: {
                    is: null
                }
            }
        });

        // If generic review per product is allowed instead of per order, logic differs.
        // User requested: "Cho phép người dùng đã mua hàng... có thể gửi đánh giá".
        // Schema: Review has `orderId @unique`. So it's One Review Per Order.

        if (!order) {
            return NextResponse.json({
                success: false,
                error: 'Bạn chưa mua sản phẩm này hoặc đã đánh giá đơn hàng này rồi.'
            }, { status: 403 });
        }

        // 2. Create Review
        const review = await prisma.review.create({
            data: {
                userId,
                productId,
                orderId: order.id,
                rating,
                comment
            }
        });

        return NextResponse.json({ success: true, data: review });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed to post review' }, { status: 500 });
    }
}
