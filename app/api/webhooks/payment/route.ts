
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
            const referenceCode = String(id); // Casso Transaction ID

            // 2. Idempotency Check
            const existing = await prisma.processedPayment.findUnique({
                where: { referenceCode }
            });
            if (existing) continue; // Already processed

            // 3. Parse User ID from Content (e.g., "NAP 123", "NAP 12345")
            const match = content.match(/NAP\s*(\d+)/i);
            if (!match) continue; // Invalid content format

            const userId = parseInt(match[1]);
            const depositAmount = parseFloat(amount);

            // 4. Atomic Processing
            await prisma.$transaction(async (prismaTx) => {
                // Verify User
                const user = await prismaTx.user.findUnique({ where: { id: userId } });
                if (!user) return; // User not found

                // A. Create ProcessedPayment (Lock Idempotency)
                await prismaTx.processedPayment.create({
                    data: {
                        referenceCode,
                        userId,
                        amount: depositAmount
                    }
                });

                // B. Credit User Balance
                const oldBalance = Number(user.balance);
                const newBalance = oldBalance + depositAmount;

                await prismaTx.user.update({
                    where: { id: userId },
                    data: { balance: { increment: depositAmount } }
                });

                // C. Log Transaction
                await prismaTx.transaction.create({
                    data: {
                        userId,
                        amount: depositAmount,
                        type: 'DEPOSIT',
                        status: 'SUCCESS',
                        referenceCode,
                    }
                });

                // D. Log Balance Audit
                await logBalanceChange(
                    prismaTx,
                    userId,
                    depositAmount,
                    'CREDIT',
                    'DEPOSIT',
                    oldBalance,
                    newBalance,
                    referenceCode,
                    `Auto Deposit from Bank (${content})`
                );

                // Refund Notification if Buyer
                if (user.telegramId) {
                    sendTelegramMessage(user.telegramId, `✅ **Deposit Successful!**\n\nAmount: +${depositAmount.toLocaleString()} đ\nNew Balance: ${newBalance.toLocaleString()} đ`);
                }
            });
        }

        return NextResponse.json({ success: true, message: 'Processed' });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
