import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt((session.user as any).id);

        // Count unread messages in conversations where user is buyer or seller
        // AND user is not the sender
        const unreadCount = await prisma.directMessage.count({
            where: {
                conversation: {
                    OR: [
                        { buyerId: userId },
                        { sellerId: userId }
                    ]
                },
                senderId: { not: userId },
                isRead: false
            }
        });

        return NextResponse.json({
            success: true,
            count: unreadCount
        });

    } catch (error) {
        console.error('Unread Count API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
