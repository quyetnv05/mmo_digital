
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const disputeId = parseInt(resolvedParams.id);
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.userId;

        const dispute = await prisma.dispute.findUnique({
            where: { id: disputeId },
            include: {
                order: {
                    include: {
                        product: true
                    }
                },
                user: { select: { username: true } }
            }
        });

        if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Access Control
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        // Correct logic: Admin can see, Opener can see, Seller of product can see
        const isParticipant = dispute.openedBy === userId || dispute.order.product.sellerId === userId || user?.role === 'ADMIN';

        console.log(`[Dispute Debug] UserID: ${userId} | Role: ${user?.role}`);
        console.log(`[Dispute Debug] Opener: ${dispute.openedBy} | Seller: ${dispute.order.product.sellerId}`);
        console.log(`[Dispute Debug] Is Participant: ${isParticipant}`);

        if (!isParticipant) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ success: true, data: dispute });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
