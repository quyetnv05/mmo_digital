import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/balance
 * 
 * Lightweight endpoint to fetch just the user's balance
 * Used for realtime updates in header
 */
export async function GET(req: NextRequest) {
    try {
        // TODO: Get userId from JWT token
        const userId = 1; // Mock for now

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                balance: true,
                pendingBalance: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                balance: Number(user.balance),
                pendingBalance: Number(user.pendingBalance),
            },
        });
    } catch (error) {
        console.error('Balance fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch balance' },
            { status: 500 }
        );
    }
}
