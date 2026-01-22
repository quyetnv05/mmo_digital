import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const disputeSchema = z.object({
    orderId: z.number().int().positive(),
    reason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự'),
});

/**
 * GET /api/disputes
 * 
 * Get all disputes for the current user
 */
export async function GET(req: NextRequest) {
    try {
        // TODO: Get userId from JWT token
        const userId = 1;

        const disputes = await prisma.dispute.findMany({
            where: { openedBy: userId },
            include: {
                order: {
                    include: {
                        product: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const formattedDisputes = disputes.map((dispute) => ({
            id: dispute.id.toString(),
            orderId: dispute.orderId.toString(),
            productName: dispute.order.product.name,
            reason: dispute.reason,
            status: dispute.status.toLowerCase(),
            amount: Number(dispute.order.totalPrice),
            createdAt: dispute.createdAt.toISOString(),
        }));

        return NextResponse.json({
            success: true,
            data: formattedDisputes,
        });
    } catch (error) {
        console.error('Disputes fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch disputes' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/disputes
 * 
 * Create a new dispute for an order
 */
export async function POST(req: NextRequest) {
    try {
        // TODO: Get userId from JWT token
        const userId = 1;

        const body = await req.json();
        const validation = disputeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: validation.error.errors[0].message,
                },
                { status: 400 }
            );
        }

        const { orderId, reason } = validation.data;

        // Check if order exists and belongs to user
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                buyerId: userId,
                status: 'COMPLETED',
            },
        });

        if (!order) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'ORDER_NOT_FOUND',
                    message: 'Đơn hàng không tồn tại hoặc không thể khiếu nại',
                },
                { status: 404 }
            );
        }

        // Check if escrow deadline has passed
        if (new Date() > order.escrowDeadline) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'ESCROW_EXPIRED',
                    message: 'Thời gian bảo hành đã hết, không thể khiếu nại',
                },
                { status: 400 }
            );
        }

        // Check if already has a dispute
        const existingDispute = await prisma.dispute.findFirst({
            where: { orderId },
        });

        if (existingDispute) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'DISPUTE_EXISTS',
                    message: 'Đơn hàng này đã có khiếu nại trước đó',
                },
                { status: 400 }
            );
        }

        // Create dispute and update order status
        const dispute = await prisma.$transaction(async (tx) => {
            // Create dispute
            const newDispute = await tx.dispute.create({
                data: {
                    orderId,
                    openedBy: userId,
                    reason,
                    status: 'OPEN',
                },
            });

            // Update order status to disputed
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'DISPUTED' },
            });

            return newDispute;
        });

        return NextResponse.json({
            success: true,
            message: 'Khiếu nại đã được tạo thành công. Admin sẽ xem xét trong 24-48h.',
            data: {
                disputeId: dispute.id,
            },
        });
    } catch (error) {
        console.error('Dispute create error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create dispute' },
            { status: 500 }
        );
    }
}
