
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// GET: Get current user info including 2FA status
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded || !decoded.userId) return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                balance: true,
                pendingBalance: true,
                status: true,
                twoFactorSecret: true,
                sellerLevel: true,
                createdAt: true
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                balance: Number(user.balance),
                pendingBalance: Number(user.pendingBalance),
                status: user.status,
                sellerLevel: user.sellerLevel,
                twoFactorEnabled: !!user.twoFactorSecret,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
