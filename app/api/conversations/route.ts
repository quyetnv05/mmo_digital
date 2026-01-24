
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// GET List of Conversations
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.userId;

        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { buyerId: userId },
                    { sellerId: userId }
                ]
            },
            include: {
                buyer: { select: { id: true, username: true } },
                seller: { select: { id: true, username: true } },
                product: { select: { name: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        const data = conversations.map((c: any) => ({
            id: c.id,
            partner: c.buyerId === userId ? c.seller : c.buyer,
            productName: c.product?.name,
            lastMessage: c.messages[0]?.content || 'Chưa có tin nhắn',
            updatedAt: c.updatedAt
        }));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// POST Create Conversation
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.userId;

        const { sellerId, productId } = await req.json();

        if (!sellerId || !productId) return NextResponse.json({ error: 'Missing sellerId or productId' }, { status: 400 });

        if (sellerId === userId) return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 });

        // Check exists
        let conversation = await prisma.conversation.findFirst({
            where: {
                buyerId: userId,
                sellerId: sellerId,
                productId: productId
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    buyerId: userId,
                    sellerId: sellerId,
                    productId: productId
                }
            });
        }

        return NextResponse.json({ success: true, data: { id: conversation.id } });

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
