
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        // 1. Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded || !decoded.userId) return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });

        const orderId = parseInt(params.id);
        if (isNaN(orderId)) return NextResponse.json({ success: false, error: 'Invalid Order ID' }, { status: 400 });

        // 2. Fetch Order and Items
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

        // 3. Ownership Check (Only Buyer or Admin can download)
        // Assuming role ADMIN check if needed, but for now strict buyer check
        if (order.buyerId !== decoded.userId) {
            return NextResponse.json({ success: false, error: 'Access Denied' }, { status: 403 });
        }

        // 4. Generate Content
        // We need to fetch Product to know the format if needed, but usually metadata stores the rest.
        // Actually, ProductItem stores 'content' (part 0). rest is in metadata.info.

        const fileContent = order.items.map(item => {
            let fullLine = item.content;

            // Reconstruct if metadata exists
            if (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)) {
                const meta = item.metadata as any;
                if (meta.info) {
                    // We assume the original delimiter was used or '|'
                    // To be safe, we join with '|' as standard export, OR we could check product format.
                    // For now, standardizing export to '|' is safer than guessing.
                    fullLine = `${fullLine}|${meta.info}`;
                }
            }
            return fullLine;
        }).join('\n');

        // 5. Return File Response
        return new NextResponse(fileContent, {
            headers: {
                'Content-Type': 'text/plain',
                'Content-Disposition': `attachment; filename="order_${orderId}.txt"`,
            },
        });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
