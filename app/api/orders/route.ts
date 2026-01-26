import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

import jwt from 'jsonwebtoken';
import { decryptData } from '@/lib/crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

/**
 * GET /api/orders
 * 
 * Get all orders for the current user
 */
export async function GET(req: NextRequest) {
    try {
        // Get userId from JWT token
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded?.userId) return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });

        const userId = decoded.userId;

        const orders = await prisma.order.findMany({
            where: { buyerId: userId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        warrantyHours: true,
                    },
                },
                items: {
                    select: {
                        id: true,
                        content: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const formattedOrders = orders.map((order: any) => ({
            id: order.id.toString(),
            productId: order.productId,
            productName: order.product.name,
            quantity: order.quantity,
            totalPrice: Number(order.totalPrice),
            status: order.status.toLowerCase(),
            escrowDeadline: order.escrowDeadline.toISOString(),
            isReleased: order.isReleased,
            createdAt: order.createdAt.toISOString(),
            items: order.items.map((item: any) => {
                try {
                    return {
                        id: item.id,
                        content: decryptData(item.content),
                    };
                } catch (e) {
                    return {
                        id: item.id,
                        content: '[Encrypted Data Error]', // Fallback if decryption fails (e.g. old unencrypted data)
                    };
                }
            }),
        }));

        return NextResponse.json({
            success: true,
            data: formattedOrders,
        });
    } catch (error) {
        console.error('Orders fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
