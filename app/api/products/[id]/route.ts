
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Helper to validate seller session
async function getSeller(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'SELLER' && decoded.role !== 'ADMIN') return null;
        return decoded;
    } catch {
        return null;
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getSeller(req);
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const productId = parseInt(id);

        // Check ownership
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

        if (product.sellerId !== user.userId && user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // Logical Delete or Physical Delete?
        // Usually logical delete is safer: status = 'DELETED'
        await prisma.product.update({
            where: { id: productId },
            data: { status: 'DELETED' }
        });

        return NextResponse.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                category: true,
                variants: true,
                items: {
                    select: { isSold: true }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getSeller(req);
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { status } = body;

        if (!status || !['ACTIVE', 'HIDDEN', 'DELETED'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        const productId = parseInt(id);
        const product = await prisma.product.findUnique({ where: { id: productId } });

        if (!product) return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });
        if (product.sellerId !== user.userId && user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const updated = await prisma.product.update({
            where: { id: productId },
            data: { status }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error' }, { status: 500 });
    }
}
