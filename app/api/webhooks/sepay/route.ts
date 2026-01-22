import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        // Lấy Key từ Vercel Env, nếu không có thì dùng key mặc định bạn đã đặt
        const SEPAY_API_KEY = 'MMO_Digital_2402_@!';
        // SePay gửi Key trong header Authorization: "Apikey MMO_Digital_2402_@!"
        const authHeader = req.headers.get('Authorization') || '';
        const receivedKey = authHeader.replace('Apikey ', '').trim();

        console.log('--- DEBUG WEBHOOK ---');
        console.log('Header nhan duoc:', authHeader);
        console.log('Key mong doi:', `Apikey ${SEPAY_API_KEY}`);

        if (authHeader !== `Apikey ${SEPAY_API_KEY}`) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const tx = Array.isArray(body) ? body[0] : body;
        const { content, transferAmount, id: sepayId } = tx;

        // Tìm mã MMOxxxxxx trong nội dung
        const mmoMatch = content?.match(/MMO(\d{6})/i);
        if (!mmoMatch) return NextResponse.json({ success: true, message: 'No MMO code' });

        const refCode = `MMO${mmoMatch[1]}`;

        // Cập nhật Database (Dùng cổng 6543)
        await prisma.$transaction([
            prisma.user.update({
                where: { id: (await prisma.transaction.findUnique({ where: { referenceCode: refCode } }))?.userId },
                data: { balance: { increment: parseFloat(transferAmount) } }
            }),
            prisma.transaction.update({
                where: { referenceCode: refCode },
                data: { status: 'SUCCESS' }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }
}