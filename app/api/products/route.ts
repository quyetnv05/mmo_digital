
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const productSchema = z.object({
    name: z.string().min(3),
    description: z.string().min(10),
    price: z.number().min(1000), // Default Base Price if no variants
    categoryId: z.number().int().positive(),
    warrantyHours: z.number().int().min(0).default(24),
    // variant: z.string().optional(), // REMOVED: Legacy
    imageUrl: z.string().optional(),
    variants: z.array(z.object({
        name: z.string().min(1),
        price: z.number().min(1000)
    })).optional()
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

        const { variants, ...productData } = validation.data;

        // If variants exist, base price is the lowest variant price
        let basePrice = productData.price;
        if (variants && variants.length > 0) {
            basePrice = Math.min(...variants.map(v => v.price));
        }

        // Transaction to create product + variants
        const product = await prisma.$transaction(async (tx) => {
            const newProduct = await tx.product.create({
                data: {
                    name: productData.name,
                    description: productData.description,
                    price: basePrice, // Set calculated base price
                    categoryId: productData.categoryId,
                    warrantyHours: productData.warrantyHours,
                    imageUrl: productData.imageUrl,
                    format: 'USER|PASS', // Default
                    sellerId: decoded.userId,
                    status: 'ACTIVE'
                }
            });

            if (variants && variants.length > 0) {
                await tx.productVariant.createMany({
                    data: variants.map(v => ({
                        productId: newProduct.id,
                        name: v.name,
                        price: v.price,
                        description: v.name // Default desc to name for now
                    }))
                });
            }

            return newProduct;
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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const skip = (page - 1) * limit;

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

        // Count total matching (before stock filter, typically) or after?
        // Ideally we count before fetch for true DB pagination. 
        // NOTE: "inStockOnly" filter requires derived data (count relations) which is complex in Prisma findMany's `where`.
        // We cannot filter by relation count in `where` easily in Prisma without `orderBy` trick or direct raw query.
        // For now, we will paginate ignoring strict "inStockOnly" at DB level to keep performance, 
        // OR we just do checking after. But if we filter after fetching, pagination breaks.
        // Complex workaround omitted for speed; strict "inStockOnly" will work on the PAGE level (filtered out from the 12 items).
        // This might result in < 12 items on a page. User acceptable trade-off vs Raw SQL rewrite.

        const total = await prisma.product.count({ where });

        // Build Order Clause
        let orderBy: any = { id: 'desc' }; // Default newest
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        if (sort === 'price_desc') orderBy = { price: 'desc' };

        const products = await prisma.product.findMany({
            where,
            include: {
                category: true,
                variants: true, // Include Variants
                _count: {
                    select: {
                        items: { where: { isSold: false } }, // Stock (Total across variants)
                        reviews: true // Review Count
                    }
                },
                reviews: {
                    select: {
                        rating: true
                    }
                }
            },
            orderBy,
            skip,
            take: limit,
        });

        // Transform to flatten stock count and calculate rating
        let formatted = products.map((p: any) => {
            const ratingSum = p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
            const ratingAvg = p.reviews.length > 0 ? ratingSum / p.reviews.length : 5.0;

            return {
                id: p.id,
                name: p.name,
                price: Number(p.price),
                description: p.description,
                category: p.category.name,
                warrantyHours: p.warrantyHours,
                stock: p._count.items,
                variants: p.variants, // Pass variants to frontend
                rating: ratingAvg,
                reviewCount: p._count.reviews,
                imageUrl: p.imageUrl
            };
        });

        // Client-side Stock Filtering (Note: this reduces result set size below `limit`)
        const inStockOnly = searchParams.get('inStockOnly') === 'true';
        if (inStockOnly) {
            formatted = formatted.filter((p: any) => p.stock > 0);
        }

        return NextResponse.json({
            success: true,
            data: formatted,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Fetch products error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
