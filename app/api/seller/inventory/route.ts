import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/seller/inventory
 * 
 * Get inventory summary for seller
 */
export async function GET(req: NextRequest) {
    try {
        // TODO: Get userId from JWT token
        const userId = 1;

        const products = await prisma.product.findMany({
            where: {
                sellerId: userId,
                status: 'ACTIVE',
            },
            select: {
                id: true,
                name: true,
            },
        });

        // Get stock for each product
        const inventory = await Promise.all(
            products.map(async (product) => {
                const available = await prisma.productItem.count({
                    where: { productId: product.id, isSold: false },
                });

                const sold = await prisma.productItem.count({
                    where: { productId: product.id, isSold: true },
                });

                return {
                    productId: product.id,
                    productName: product.name,
                    available,
                    sold,
                    total: available + sold,
                };
            })
        );

        const totals = {
            totalProducts: products.length,
            totalAvailable: inventory.reduce((sum, i) => sum + i.available, 0),
            totalSold: inventory.reduce((sum, i) => sum + i.sold, 0),
        };

        return NextResponse.json({
            success: true,
            data: {
                inventory,
                totals,
            },
        });
    } catch (error) {
        console.error('Inventory fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch inventory' },
            { status: 500 }
        );
    }
}
