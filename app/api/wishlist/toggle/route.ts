import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = decoded.userId;
        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
        }

        // Check if exists
        const existing = await prisma.wishlist.findFirst({
            where: {
                userId: userId,
                productId: productId
            }
        });

        if (existing) {
            // Remove
            await prisma.wishlist.delete({
                where: { id: existing.id }
            });
            return NextResponse.json({ success: true, action: 'removed' });
        } else {
            // Add
            await prisma.wishlist.create({
                data: {
                    userId: userId,
                    productId: productId
                }
            });
            return NextResponse.json({ success: true, action: 'added' });
        }

    } catch (error) {
        console.error('Wishlist toggle error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
