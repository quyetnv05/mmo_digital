import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { executePurchaseTransaction } from '@/lib/transactions/atomic';
import { notifyNewOrder } from '@/lib/notifications/telegram';
import { z } from 'zod';

const purchaseSchema = z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
});

async function handlePurchase(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = purchaseSchema.safeParse(body);

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

        const { productId, quantity } = validation.data;
        const userId = (req as any).user.userId;

        // Execute atomic purchase transaction
        // This uses Prisma $transaction with Serializable isolation
        // and row-level locking (FOR UPDATE) to ensure:
        // 1. No money loss without goods delivery
        // 2. No overselling due to race conditions
        const result = await executePurchaseTransaction(userId, productId, quantity);

        // Send Telegram notification to admin
        await notifyNewOrder(
            result.order.id,
            (req as any).user.username,
            Number(result.order.totalPrice)
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Purchase error:', error);

        // Handle specific errors
        if (error.message.includes('Insufficient balance')) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'INSUFFICIENT_BALANCE',
                    message: error.message,
                },
                { status: 400 }
            );
        }

        if (error.message.includes('Insufficient stock')) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'OUT_OF_STOCK',
                    message: error.message,
                },
                { status: 400 }
            );
        }

        if (error.message.includes('not available')) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'PRODUCT_NOT_AVAILABLE',
                    message: error.message,
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: 'PURCHASE_FAILED',
                message: 'An error occurred during purchase',
            },
            { status: 500 }
        );
    }
}

// Apply middleware: authentication + rate limiting (10 purchases per hour)
export const POST = withRateLimit(
    withAuth(handlePurchase),
    10, // Max 10 purchases
    60 * 60 * 1000 // Per hour
);
