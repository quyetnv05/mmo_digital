import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SEPAY_API_KEY = process.env.SEPAY_API_KEY || '';

/**
 * SePay Webhook Handler
 * 
 * Receives deposit notifications from SePay and automatically credits user balance.
 * 
 * Expected SePay payload structure:
 * {
 *   id: number,
 *   gateway: string,
 *   transactionDate: string,
 *   accountNumber: string,
 *   subAccount: string | null,
 *   transferType: "in" | "out",
 *   transferAmount: number,
 *   accumulated: number,
 *   code: string | null,
 *   content: string,
 *   referenceCode: string,
 *   description: string
 * }
 */

export async function POST(req: NextRequest) {
    try {
        // 1. Validate API Key
        // SePay sends: "Authorization": "Apikey YOUR_API_KEY"
        const authHeader = req.headers.get('Authorization') || '';
        const apiKey = req.headers.get('x-api-key') ||
            authHeader.replace('Apikey ', '').replace('Bearer ', '').trim();

        if (!SEPAY_API_KEY || apiKey !== SEPAY_API_KEY) {
            console.error('[SePay Webhook] Invalid API Key. Received:', apiKey, 'Expected:', SEPAY_API_KEY);
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse request body
        const body = await req.json();
        console.log('[SePay Webhook] Received:', JSON.stringify(body, null, 2));

        // Handle both single object and array format
        const transactions = Array.isArray(body) ? body : [body];

        for (const tx of transactions) {
            // 3. Extract transaction data
            const { content, transferAmount, transferType, id: sepayTransactionId } = tx;

            // Only process incoming transfers
            if (transferType !== 'in') {
                console.log('[SePay Webhook] Skipping outgoing transfer');
                continue;
            }

            const amount = parseFloat(transferAmount) || 0;
            if (amount <= 0) {
                console.log('[SePay Webhook] Invalid amount:', amount);
                continue;
            }

            // 4. Extract MMO reference code from content (e.g., "MMO123456")
            const mmoMatch = content?.match(/MMO\s*(\d{6})/i);
            if (!mmoMatch) {
                console.log('[SePay Webhook] No MMO code found in content:', content);
                continue;
            }

            const referenceCode = `MMO${mmoMatch[1]}`;
            console.log('[SePay Webhook] Found referenceCode:', referenceCode);

            // 5. Find pending transaction by referenceCode
            const pendingTx = await prisma.transaction.findUnique({
                where: { referenceCode }
            });

            if (!pendingTx) {
                console.log('[SePay Webhook] No transaction found for code:', referenceCode);
                continue;
            }

            // 6. Anti-duplicate check - Skip if already SUCCESS
            if (pendingTx.status === 'SUCCESS') {
                console.log('[SePay Webhook] Transaction already processed:', referenceCode);
                continue;
            }

            // 7. Atomic transaction processing
            await prisma.$transaction(async (prismaTx) => {
                // A. Update transaction status to SUCCESS
                await prismaTx.transaction.update({
                    where: { id: pendingTx.id },
                    data: { status: 'SUCCESS' }
                });

                // B. Get user and calculate new balance
                const user = await prismaTx.user.findUnique({
                    where: { id: pendingTx.userId }
                });

                if (!user) {
                    throw new Error(`User not found: ${pendingTx.userId}`);
                }

                const oldBalance = Number(user.balance);
                const newBalance = oldBalance + amount;

                // C. Update user balance
                await prismaTx.user.update({
                    where: { id: user.id },
                    data: { balance: { increment: amount } }
                });

                // D. Create BalanceAudit log
                await prismaTx.balanceAudit.create({
                    data: {
                        userId: user.id,
                        amount: amount,
                        type: 'CREDIT',
                        oldBalance: oldBalance,
                        newBalance: newBalance,
                        reason: 'DEPOSIT',
                        referenceId: String(sepayTransactionId || referenceCode),
                        description: `Nạp tiền tự động qua SePay - ${referenceCode}`
                    }
                });

                console.log(`[SePay Webhook] SUCCESS: User ${user.id} credited ${amount}đ. Balance: ${oldBalance} -> ${newBalance}`);
            });
        }

        // 8. Return success to SePay
        return NextResponse.json({ success: true, message: 'Processed' });

    } catch (error) {
        console.error('[SePay Webhook] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'SePay Webhook is active',
        timestamp: new Date().toISOString()
    });
}
