import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// 1. Định nghĩa lại kiểu dữ liệu cho Next.js 15
type RouteContext = {
    params: Promise<{ id: string }>
}

export async function GET(
    req: Request,
    context: RouteContext // Thay đổi cách nhận params thành context
) {
    try {
        // 2. Await params để lấy ID đơn hàng
        const { id } = await context.params;
        const orderId = parseInt(id);

        if (isNaN(orderId)) {
            return NextResponse.json({ success: false, error: 'Invalid Order ID' }, { status: 400 });
        }

        // 3. Auth Check (Sử dụng await cho cookies())
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded || !decoded.userId) return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });

        // 4. Fetch Order and Items từ Database thật
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

        // 5. Ownership Check
        if (order.buyerId !== decoded.userId) {
            return NextResponse.json({ success: false, error: 'Access Denied' }, { status: 403 });
        }

        // 6. Generate Content (Thay thế cho dữ liệu fix cứng)
        const fileContent = order.items.map((item: any) => {
            let fullLine = item.content;
            if (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)) {
                const meta = item.metadata as any;
                if (meta.info) {
                    fullLine = `${fullLine}|${meta.info}`;
                }
            }
            return fullLine;
        }).join('\n');

        // 7. Return File Response
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