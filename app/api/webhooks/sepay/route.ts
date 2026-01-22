import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Đảm bảo lấy đúng Key từ Vercel Env
const SEPAY_API_KEY = process.env.SEPAY_API_KEY || 'MMO_Digital_2402_@!';

export async function POST(req: NextRequest) {
    try {
        // 1. Xác thực Header Authorization chuẩn SePay
        const authHeader = req.headers.get('Authorization') || '';
        const apiKey = authHeader.replace('Apikey ', '').trim();

        if (!SEPAY_API_KEY || apiKey !== SEPAY_API_KEY) {
            console.error('[SePay Webhook] Unauthorized:', apiKey);
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const transactions = Array.isArray(body) ? body : [body];

        for (const tx of transactions) {
            // SePay dùng transferAmount và transferType
            const { content, transferAmount, transferType, id: sepayId } = tx;

            if (transferType !== 'in') continue;

            const amount = parseFloat(transferAmount) || 0;
            if (amount <= 0) continue;

            // 2. Tìm mã MMOxxxxxx trong chuỗi nội dung phức tạp
            // Regex này sẽ tìm MMO đi kèm với đúng 6 chữ số
            const mmoMatch = content?.match(/MMO(\d{6})/i);
            if (!mmoMatch) {
                console.log('[SePay Webhook] No MMO code found in:', content);
                continue;
            }

            const referenceCode = `MMO${mmoMatch[1]}`;

            // 3. Tìm giao dịch PENDING
            const pendingTx = await prisma.transaction.findUnique({
                where: { referenceCode }
            });

            if (!pendingTx || pendingTx.status !== 'PENDING') {
                console.log('[SePay Webhook] Skip (Not found or Processed):', referenceCode);
                continue;
            }

            // 4. Xử lý nguyên tử (Atomic Transaction)
            await prisma.$transaction(async (prismaTx) => {
                // Kiểm tra User
                const user = await prismaTx.user.findUnique({
                    where: { id: pendingTx.userId }
                });

                if (!user) throw new Error("User not found");

                const oldBalance = Number(user.balance);
                const newBalance = oldBalance + amount;

                // Cập nhật số dư và trạng thái lệnh nạp
                await prismaTx.user.update({
                    where: { id: user.id },
                    data: { balance: { increment: amount } }
                });

                await prismaTx.transaction.update({
                    where: { id: pendingTx.id },
                    data: { status: 'SUCCESS' }
                });

                // Ghi log biến động số dư (BalanceAudit)
                await prismaTx.balanceAudit.create({
                    data: {
                        userId: user.id,
                        amount: amount,
                        type: 'CREDIT',
                        oldBalance: oldBalance,
                        newBalance: newBalance,
                        reason: 'DEPOSIT',
                        referenceId: String(sepayId),
                        description: `Nạp tiền tự động SePay - ${content}`
                    }
                });
            });
        }

        return NextResponse.json({ success: true, message: 'Processed' });

    } catch (error: any) {
        console.error('[SePay Webhook] Error:', error.message);
        // Trả về 200 để SePay không bắn lại khi có lỗi code (tránh treo database)
        return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }
}

export async function GET() {
    return NextResponse.json({ success: true, message: 'SePay Webhook Active' });
}