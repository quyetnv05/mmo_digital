'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Helper to get authenticated user ID from JWT
async function getUserId(): Promise<number | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        return decoded.userId;
    } catch (e) {
        return null;
    }
}

/**
 * GET /api/user/balance
 * 
 * Lightweight endpoint to fetch just the user's balance
 * Used for realtime updates in header
 */
export async function GET(req: NextRequest) {
    try {
        // Get userId from JWT token - NO MORE HARDCODED VALUE!
        const userId = await getUserId();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

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
