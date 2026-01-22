import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/profile
 * 
 * Get current logged in user profile based on JWT token in cookies
 */
export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        try {
            const payload = verify(token, process.env.JWT_SECRET || 'super-secret-key') as any;

            if (!payload || !payload.userId) {
                return NextResponse.json(
                    { success: false, error: 'Invalid token' },
                    { status: 401 }
                );
            }

            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    balance: true,
                    pendingBalance: true,
                    status: true,
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
                user: {
                    ...user,
                    balance: Number(user.balance),
                    pendingBalance: Number(user.pendingBalance)
                },
            });
        } catch (e) {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
