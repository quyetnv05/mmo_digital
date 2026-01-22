
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET() {
    try {
        // 1. Auth Check (TODO: Move to robust middleware/lib)
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });
        }

        // 2. Fetch Products
        const products = await prisma.product.findMany({
            where: {
                sellerId: decoded.userId,
                status: { not: 'DELETED' } // Don't show deleted products
            },
            select: {
                id: true,
                name: true,
                price: true,
            },
            orderBy: { id: 'desc' }
        });

        return NextResponse.json({ success: true, data: products });

    } catch (error) {
        console.error('Fetch seller products error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
