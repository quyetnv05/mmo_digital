
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const productSchema = z.object({
    name: z.string().min(3),
    description: z.string().min(10),
    price: z.number().min(1000),
    categoryId: z.number().int().positive(),
    warrantyHours: z.number().int().min(0).default(24),
    variant: z.string().optional(),
    imageUrl: z.string().optional()
});

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'SELLER' && decoded.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const validation = productSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.errors[0].message }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                ...validation.data,
                sellerId: decoded.userId,
                status: 'ACTIVE'
            }
        });

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error('Create product error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const categoryId = searchParams.get('categoryId');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const sort = searchParams.get('sort');

        // Build Where Clause
        const where: any = { status: 'ACTIVE' };

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        if (categoryId && categoryId !== 'all') {
            where.categoryId = parseInt(categoryId);
        }
        if (minPrice) {
            where.price = { ...where.price, gte: Number(minPrice) };
        }
        if (maxPrice) {
            where.price = { ...where.price, lte: Number(maxPrice) };
        }

        // Stock filter - using HAVING clause simulation via post-filter
        const inStockOnly = searchParams.get('inStockOnly') === 'true';

        // Build Order Clause
        let orderBy: any = { id: 'desc' }; // Default newest
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        if (sort === 'price_desc') orderBy = { price: 'desc' };

        const products = await prisma.product.findMany({
            where,
            include: {
                category: true,
                _count: {
                    select: {
                        items: { where: { isSold: false } }, // Stock
                        reviews: true // Review Count
                    }
                },
                reviews: {
                    select: {
                        rating: true
                    }
                }
            },
            orderBy
        });

        // Transform to flatten stock count and calculate rating
        let formatted = products.map(p => {
            // Calculate Average Rating manually if not using aggregation group by
            // Or use the aggregate function. Since findMany doesn't support _avg directly with include easily without validation change.
            // Actually, best way in simple relation is valid:
            // But Prisma `include` doesn't do `_avg` directly on relation unless we use `aggregate` which returns separate object.
            // WORKAROUND: Fetch reviews and calculate JS side (OK for small scale) OR raw query.
            // Given "User Request: calculate _avg", let's do JS calc for now as it is safest with standard Prisma Client usage in `findMany`.
            const ratingSum = p.reviews.reduce((acc, r) => acc + r.rating, 0);
            const ratingAvg = p.reviews.length > 0 ? ratingSum / p.reviews.length : 5.0; // Default 5 stars if new

            return {
                id: p.id,
                name: p.name,
                price: Number(p.price),
                description: p.description,
                category: p.category.name,
                warrantyHours: p.warrantyHours,
                stock: p._count.items,
                variant: p.variant,
                rating: ratingAvg,
                reviewCount: p._count.reviews
            };
        });

        // Apply stock filter
        if (inStockOnly) {
            formatted = formatted.filter(p => p.stock > 0);
        }

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Fetch products error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
