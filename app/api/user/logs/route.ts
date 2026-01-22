
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// GET: Fetch user's access logs
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded || !decoded.userId) return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });

        // Fetch last 10 login logs
        const logs = await prisma.userLog.findMany({
            where: {
                userId: decoded.userId,
                action: 'LOGIN'
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                action: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true
            }
        });

        return NextResponse.json({ success: true, data: logs });

    } catch (error) {
        console.error('Fetch user logs error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
