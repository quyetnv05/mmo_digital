
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// GET Messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const conversationId = parseInt(resolvedParams.id);

        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.userId;

        // Verify Access
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                buyer: { select: { id: true, username: true } },
                seller: { select: { id: true, username: true } },
                product: { select: { id: true, name: true } }
            }
        });

        if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const messages = await prisma.directMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, username: true } } }
        });

        return NextResponse.json({ success: true, data: { conversation, messages } });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// POST Send Message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const conversationId = parseInt(resolvedParams.id);
        const { content } = await req.json();

        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.userId;

        if (!content || !content.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

        const message = await prisma.directMessage.create({
            data: {
                conversationId,
                senderId: userId,
                content
            },
            include: { sender: { select: { id: true, username: true } } }
        });

        // Update updated_at of conversation
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({ success: true, data: message });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
