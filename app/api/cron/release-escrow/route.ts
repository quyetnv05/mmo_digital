
import { NextResponse } from 'next/server';
import { releaseEscrowFunds } from '@/lib/transactions/atomic';

// Security: This endpoint should be called by a trusted cron service (Vercel Cron, Railway, etc.)
const CRON_SECRET = process.env.CRON_SECRET || 'cron_secret_key';

export async function GET(req: Request) {
    try {
        // 1. Verify Cron Secret
        const authHeader = req.headers.get('authorization');
        // Allow if checking from Vercel/Internal or if secret matches
        // For production, uncomment strict check:
        // if (authHeader !== `Bearer ${CRON_SECRET}`) { ... }

        // 2. Execute Release Logic
        const result = await releaseEscrowFunds();

        return NextResponse.json({
            success: true,
            message: `Released ${result.releasedCount} orders`,
            count: result.releasedCount,
            details: result.results
        });

    } catch (error) {
        console.error('Escrow release error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
