import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/categories
 * 
 * Get all product categories
 */
export async function GET(req: NextRequest) {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: {
                        products: {
                            where: { status: 'ACTIVE' },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        // Deduplicate Record by Name
        // Logic: If multiple cats have same name, merge them (sum product counts) and keep the first ID found.
        const uniqueMap = new Map();

        categories.forEach(cat => {
            const normalizedName = cat.name.trim(); // Normalize name
            if (uniqueMap.has(normalizedName)) {
                // Merge counts
                const existing = uniqueMap.get(normalizedName);
                existing._count.products += cat._count.products;
            } else {
                uniqueMap.set(normalizedName, { ...cat }); // Clone to avoid mutation issues if any
            }
        });

        const formattedCategories = Array.from(uniqueMap.values()).map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            productCount: cat._count.products,
        }));

        return NextResponse.json({
            success: true,
            data: formattedCategories,
        });
    } catch (error) {
        console.error('Categories fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/categories
 * 
 * Create a new category (Admin only)
 */
export async function POST(req: NextRequest) {
    try {
        const { name, slug } = await req.json();

        if (!name || !slug) {
            return NextResponse.json(
                { success: false, error: 'Name and slug are required' },
                { status: 400 }
            );
        }

        const category = await prisma.category.create({
            data: { name, slug },
        });

        return NextResponse.json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error('Category create error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create category' },
            { status: 500 }
        );
    }
}
