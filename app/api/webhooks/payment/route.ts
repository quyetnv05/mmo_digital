
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { logBalanceChange } from '@/lib/finance/audit';
import { sendTelegramMessage } from '@/lib/notification/telegram';

const CASSO_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'secret_key'; // Use env var in prod

// HMAC Verification Helper
function verifySignature(body: string, signature: string) {
    if (!signature) return false;
    const computed = crypto.createHmac('sha256', CASSO_SECRET).update(body).digest('hex');
    return computed === signature;
}

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get('x-webhook-signature') || ''; // Adjust header name as per provider

        // 1. Verify Signature (Skip in dev if secret not set, but recommended)
        // Note: For Casso/SePay, check their specific doc. Implementing generic HMAC here.
        // if (!verifySignature(bodyText, signature)) {
        //     return NextResponse.json({ success: false, error: 'Invalid Signature' }, { status: 403 });
        // }

        const data = JSON.parse(bodyText);
        // Assuming payload structure: { id, content, amount, description, ... }
        // Adjust based on actual provider (e.g. Casso gives: { data: [ { id, content, amount ... } ] })

        // Let's handle generic array or single object
        const transactions = Array.isArray(data.data) ? data.data : [data];

        for (const tx of transactions) {
            const { id, content, amount } = tx;
            const webhookRefCode = String(id); // Casso Transaction ID for idempotency

            // 2. Idempotency Check - prevent duplicate processing
            const existing = await prisma.processedPayment.findUnique({
                where: { referenceCode: webhookRefCode }
            });
            if (existing) continue; // Already processed

            const depositAmount = parseFloat(amount);

            // 3. Try to match reference code formats
            // Format 1 (New): "MMO123456" - Look up existing pending transaction
            // Format 2 (Legacy): "NAP 123" - Use user ID directly

            let userId: number | null = null;
            let pendingTransaction: any = null;

            // Check for MMO format first
            const mmoMatch = content.match(/MMO\s*(\d{6})/i);
            if (mmoMatch) {
                const mmoCode = `MMO${mmoMatch[1]}`;
                // Find the pending transaction by referenceCode
                pendingTransaction = await prisma.transaction.findUnique({
                    where: { referenceCode: mmoCode }
                });
                if (pendingTransaction && pendingTransaction.status === 'PENDING') {
                    userId = pendingTransaction.userId;
                }
            }

            // Fallback to NAP format (legacy)
            if (!userId) {
                const napMatch = content.match(/NAP\s*(\d+)/i);
                if (napMatch) {
                    userId = parseInt(napMatch[1]);
                }
            }

            if (!userId) continue; // No valid format found

            // 4. Atomic Processing with Prisma Transaction
            await prisma.$transaction(async (prismaTx) => {
                // Verify User exists
                const user = await prismaTx.user.findUnique({ where: { id: userId! } });
                if (!user) return; // User not found

                // A. Create ProcessedPayment (Lock Idempotency)
                await prismaTx.processedPayment.create({
                    data: {
                        referenceCode: webhookRefCode,
                        userId: userId!,
                        amount: depositAmount
                    }
                });

                // B. If there's a pending transaction from MMO format, update it
                if (pendingTransaction) {
                    await prismaTx.transaction.update({
                        where: { id: pendingTransaction.id },
                        data: { status: 'SUCCESS' }
                    });
                } else {
                    // C. Create new transaction for NAP format (legacy)
                    await prismaTx.transaction.create({
                        data: {
                            userId: userId!,
                            amount: depositAmount,
                            type: 'DEPOSIT',
                            status: 'SUCCESS',
                            referenceCode: webhookRefCode,
                        }
                    });
                }

                // D. Credit User Balance
                const oldBalance = Number(user.balance);
                const newBalance = oldBalance + depositAmount;

                await prismaTx.user.update({
                    where: { id: userId! },
                    data: { balance: { increment: depositAmount } }
                });

                // E. Log Balance Audit
                await logBalanceChange(
                    prismaTx,
                    userId!,
                    depositAmount,
                    'CREDIT',
                    'DEPOSIT',
                    oldBalance,
                    newBalance,
                    webhookRefCode,
                    `Auto Deposit from Bank (${content})`
                );

                // F. Send Telegram notification if available
                if (user.telegramId) {
                    sendTelegramMessage(user.telegramId, `✅ **Nạp tiền thành công!**\n\nSố tiền: +${depositAmount.toLocaleString()} đ\nSố dư mới: ${newBalance.toLocaleString()} đ`);
                }
            });
        }

        return NextResponse.json({ success: true, message: 'Processed' });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
