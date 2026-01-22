import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logBalanceChange } from '@/lib/finance/audit';
import { sendTelegramMessage } from '@/lib/notification/telegram';

// Lấy Key bảo mật từ Env. Vercel phải có biến SEPAY_API_KEY
const SEPAY_API_KEY = process.env.SEPAY_API_KEY || 'MMO_Digital_2402_@!';

export async function POST(req: Request) {
    try {
        // 1. Kiểm tra xác thực từ SePay (Header Authorization)
        const authHeader = req.headers.get('Authorization');

        // SePay gửi Key dưới dạng: "Apikey MMO_Digital_2402_@!"
        if (!authHeader || authHeader !== `Apikey ${SEPAY_API_KEY}`) {
            console.error('Lỗi xác thực: Key không khớp');
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();

        // 2. SePay gửi dữ liệu đơn lẻ hoặc mảng, ta đưa về mảng để xử lý
        const transactions = Array.isArray(data) ? data : [data];

        for (const tx of transactions) {
            const { id, content, amount } = tx;
            const webhookRefCode = String(id); // ID giao dịch của SePay để chống nạp trùng

            // 3. Chống nạp trùng (Idempotency)
            const existing = await prisma.processedPayment.findUnique({
                where: { referenceCode: webhookRefCode }
            });
            if (existing) continue;

            const depositAmount = parseFloat(amount);
            let userId: number | null = null;
            let pendingTransaction: any = null;

            // 4. Tìm mã MMOxxxxxx trong nội dung chuyển khoản
            // Dùng Regex để bắt mã MMO kể cả khi nó nằm giữa chuỗi dài
            const mmoMatch = content.match(/MMO\s*(\d{6})/i);

            if (mmoMatch) {
                const mmoCode = `MMO${mmoMatch[1]}`;
                // Tìm lệnh nạp PENDING trong DB khớp với mã MMO
                pendingTransaction = await prisma.transaction.findUnique({
                    where: { referenceCode: mmoCode }
                });

                if (pendingTransaction && pendingTransaction.status === 'PENDING') {
                    userId = pendingTransaction.userId;
                }
            }

            if (!userId) {
                console.log(`Không tìm thấy mã MMO hợp lệ trong nội dung: ${content}`);
                continue;
            }

            // 5. Xử lý cộng tiền an toàn bằng Transaction
            await prisma.$transaction(async (prismaTx) => {
                const user = await prismaTx.user.findUnique({ where: { id: userId! } });
                if (!user) return;

                // A. Đánh dấu giao dịch đã xử lý
                await prismaTx.processedPayment.create({
                    data: {
                        referenceCode: webhookRefCode,
                        userId: userId!,
                        amount: depositAmount
                    }
                });

                // B. Cập nhật trạng thái lệnh nạp thành SUCCESS
                await prismaTx.transaction.update({
                    where: { id: pendingTransaction.id },
                    data: { status: 'SUCCESS' }
                });

                // C. Cộng số dư User
                const oldBalance = Number(user.balance);
                const newBalance = oldBalance + depositAmount;

                await prismaTx.user.update({
                    where: { id: userId! },
                    data: { balance: { increment: depositAmount } }
                });

                // D. Ghi log biến động số dư
                await logBalanceChange(
                    prismaTx,
                    userId!,
                    depositAmount,
                    'CREDIT',
                    'DEPOSIT',
                    oldBalance,
                    newBalance,
                    webhookRefCode,
                    `Nạp tiền tự động SePay (${content})`
                );

                // E. Thông báo Telegram (nếu có)
                if (user.telegramId) {
                    await sendTelegramMessage(user.telegramId, `✅ **Nạp tiền thành công!**\n\n💰 Số tiền: +${depositAmount.toLocaleString()}đ\n💳 Nội dung: ${content}\n📈 Số dư mới: ${newBalance.toLocaleString()}đ`);
                }
            });
        }

        return NextResponse.json({ success: true, message: 'Processed' });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

// Thêm phương thức GET để SePay kiểm tra trạng thái Webhook
export async function GET() {
    return NextResponse.json({ success: true, message: "SePay Webhook is active" });
}