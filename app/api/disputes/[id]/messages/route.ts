
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// GET Messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const disputeId = parseInt(id);
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.userId;

        // Verify access (Admin, Seller, or Buyer involved)
        const dispute = await prisma.dispute.findUnique({
            where: { id: disputeId },
            include: { order: { include: { product: true } } }
        });

        if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Access Check
        // Buyer: openedBy === userId
        // Seller: order.product.sellerId === userId
        // Admin: role === ADMIN (need to fetch role, but let's assume if it finds query below it's ok, actually safe way is strict check)

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

        const isParticipant = dispute.openedBy === Number(userId) || dispute.order.product.sellerId === Number(userId) || user.role === 'ADMIN';

        if (!isParticipant) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const messages = await prisma.disputeMessage.findMany({
            where: { disputeId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, username: true, role: true } }
            }
        });

        return NextResponse.json({ success: true, data: messages });
    } catch (error) {
        console.error('Fetch messages error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// POST Message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const disputeId = parseInt(id);
        const { content } = await req.json();

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.userId;

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

        // Create Message
        const message = await prisma.disputeMessage.create({
            data: {
                disputeId,
                senderId: userId,
                content,
                isAdmin: user.role === 'ADMIN'
            },
            include: {
                sender: { select: { id: true, username: true, role: true } }
            }
        });

        return NextResponse.json({ success: true, data: message });

    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
