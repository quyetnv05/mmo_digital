import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/transactions
 * 
 * Get transaction history for the current user
 */
export async function GET(req: NextRequest) {
    try {
        // TODO: Get userId from JWT token
        const userId = 1;

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // DEPOSIT, WITHDRAW, PURCHASE, EARNING

        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                ...(type ? { type: type as any } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const formattedTransactions = transactions.map((tx) => ({
            id: tx.id.toString(),
            amount: Number(tx.amount),
            type: tx.type,
            status: tx.status,
            referenceCode: tx.referenceCode,
            createdAt: tx.createdAt.toISOString(),
        }));

        return NextResponse.json({
            success: true,
            data: formattedTransactions,
        });
    } catch (error) {
        console.error('Transactions fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}
