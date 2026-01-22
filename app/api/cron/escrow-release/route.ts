import { NextRequest, NextResponse } from 'next/server';
import { releaseEscrowFunds } from '@/lib/transactions/atomic';
import { sendTelegramNotification } from '@/lib/notifications/telegram';

// Lưu ý: Không export hàm này trực tiếp nữa để tránh lỗi build của Next.js
async function runEscrowReleaseInternal() {
    console.log(`[Escrow Release] Starting job at ${new Date().toISOString()}`);

    try {
        const result = await releaseEscrowFunds();

        if (result.releasedCount > 0) {
            console.log(`[Escrow Release] Released ${result.releasedCount} orders`);

            const message = `
✅ <b>Escrow Release Complete</b>

📦 Orders Released: ${result.releasedCount}
⏰ Time: ${new Date().toLocaleString('vi-VN')}

${result.results.map((r: any) => `\n💰 Order #${r.orderId}: ${r.amount.toLocaleString()}đ`).join('')}
      `.trim();

            await sendTelegramNotification(message);
        } else {
            console.log('[Escrow Release] No orders to release');
        }

        return result;
    } catch (error) {
        console.error('[Escrow Release] Error:', error);
        await sendTelegramNotification(
            `⚠️ <b>Escrow Release Error</b>\n\n${error instanceof Error ? error.message : 'Unknown error'}`
        );
        throw error;
    }
}

// Next.js Route chỉ chấp nhận export các hàm như GET, POST
export async function GET(req: NextRequest) {
    // 1. Kiểm tra bảo mật với CRON_SECRET
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Chỉ cho phép nếu mã Secret khớp để tránh bị người lạ gọi API phá hoại
    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const result = await runEscrowReleaseInternal();
        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: true, // Trả về true để Cron Job không báo lỗi liên tục, nhưng đính kèm lỗi bên trong
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// Vẫn giữ POST nếu bạn muốn dùng các dịch vụ khác gọi qua phương thức POST
export async function POST(req: NextRequest) {
    return GET(req);
}