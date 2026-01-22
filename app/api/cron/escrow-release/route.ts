import { releaseEscrowFunds } from '@/lib/transactions/atomic';
import { sendTelegramNotification } from '@/lib/notifications/telegram';

/**
 * Escrow Release Cron Job
 * 
 * This should be run every minute to automatically release funds
 * from escrow to sellers after the warranty period expires.
 * 
 * Setup:
 * - Use a cron service like Vercel Cron, node-cron, or external services
 * - Configure to run: * * * * * (every minute)
 * 
 * Example with node-cron:
 * ```
 * import cron from 'node-cron';
 * cron.schedule('* * * * *', async () => {
 *   await runEscrowRelease();
 * });
 * ```
 */
export async function runEscrowRelease() {
    console.log(`[Escrow Release] Starting job at ${new Date().toISOString()}`);

    try {
        const result = await releaseEscrowFunds();

        if (result.releasedCount > 0) {
            console.log(`[Escrow Release] Released ${result.releasedCount} orders`);

            // Notify admin via Telegram
            const message = `
✅ <b>Escrow Release Complete</b>

📦 Orders Released: ${result.releasedCount}
⏰ Time: ${new Date().toLocaleString('vi-VN')}

${result.results.map((r) => `\n💰 Order #${r.orderId}: ${r.amount.toLocaleString()}đ`).join('')}
      `.trim();

            await sendTelegramNotification(message);
        } else {
            console.log('[Escrow Release] No orders to release');
        }

        return result;
    } catch (error) {
        console.error('[Escrow Release] Error:', error);

        // Notify admin about error
        await sendTelegramNotification(
            `⚠️ <b>Escrow Release Error</b>\n\n${error instanceof Error ? error.message : 'Unknown error'}`
        );

        throw error;
    }
}

/**
 * API Route for manual trigger or webhook
 * POST /api/cron/escrow-release
 * 
 * Should be protected with a secret token in production
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    // Verify cron secret in production
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const result = await runEscrowRelease();
        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
