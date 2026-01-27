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
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const wishlist = await prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        category: {
                            select: { name: true }
                        },
                        warrantyHours: true,
                        description: true,
                        variants: true,
                        _count: {
                            select: {
                                items: { where: { isSold: false } }, // Stock
                                reviews: true
                            }
                        },
                        reviews: {
                            select: { rating: true }
                        }
                    }
                }
            }
        });

        const formatted = wishlist.map(item => {
            const p = item.product;
            const ratingSum = p.reviews.reduce((acc, r) => acc + r.rating, 0);
            const ratingAvg = p.reviews.length > 0 ? ratingSum / p.reviews.length : 5.0;

            return {
                id: item.id, // Wishlist ID
                product: {
                    id: p.id,
                    name: p.name,
                    price: Number(p.price),
                    description: p.description,
                    category: p.category.name,
                    warrantyHours: p.warrantyHours,
                    stock: p._count.items,
                    variants: (p as any).variants, // Type assertion as fallback if types aren't fully regenerated
                    rating: ratingAvg,
                    reviewCount: p._count.reviews
                }
            };
        });

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch wishlist' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { productId } = await req.json();

        // Check if exists
        const existing = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId
                }
            }
        });

        if (existing) {
            // Remove
            await prisma.wishlist.delete({
                where: { id: existing.id }
            });
            return NextResponse.json({ success: true, action: 'removed' });
        } else {
            // Add
            await prisma.wishlist.create({
                data: {
                    userId,
                    productId
                }
            });
            return NextResponse.json({ success: true, action: 'added' });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update wishlist' }, { status: 500 });
    }
}
