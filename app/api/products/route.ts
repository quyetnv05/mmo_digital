
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
                    select: { items: { where: { isSold: false } } }
                }
            },
            orderBy
        });

        // Transform to flatten stock count
        let formatted = products.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            description: p.description,
            category: p.category.name,
            warrantyHours: p.warrantyHours,
            stock: p._count.items,
            variant: p.variant
        }));

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
