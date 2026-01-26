import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env'; // Use our validated env

export async function POST(req: NextRequest) {
    try {
        const SEPAY_API_KEY = env.SEPAY_API_KEY;
        const authHeader = req.headers.get('Authorization') || '';

        // 1. Validate Source
        if (authHeader !== `Apikey ${SEPAY_API_KEY}`) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const tx = Array.isArray(body) ? body[0] : body;
        // SePay ID is the unique Bank Transaction ID
        const { content, transferAmount, id: sepayId } = tx;

        // 2. Idempotency Check (Check ProcessedPayment by sepayId)
        // We use 'referenceCode' in ProcessedPayment to store the Unique SePay ID
        const existingPayment = await prisma.processedPayment.findUnique({
            where: { referenceCode: String(sepayId) }
        });

        if (existingPayment) {
            // Already processed, return success to stop SePay from retrying
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        // 3. Find User via MMO Code in content
        const mmoMatch = content?.match(/MMO(\d{6})/i);
        if (!mmoMatch) {
            // Valid payment but no code? Log it? 
            // For now return success so SePay doesn't retry forever.
            return NextResponse.json({ success: true, message: 'No MMO code found' });
        }

        const userIdentifier = `MMO${mmoMatch[1]}`;
        // Find the Deposit Transaction request (optional) OR Find User directly?
        // Usually MMO code maps to a stored Transaction request or User ID.
        // Assuming MMOxxxx is generic reference logic.
        // Let's look for the Pending Transaction to get UserId.
        const pendingTx = await prisma.transaction.findUnique({
            where: { referenceCode: userIdentifier }
        });

        if (!pendingTx) {
            return NextResponse.json({ success: true, message: 'Transaction request not found' });
        }

        const userId = pendingTx.userId;
        const amount = parseFloat(transferAmount);

        // 4. Process Balance Update Transactionally
        await prisma.$transaction(async (txPrisma) => {
            // A. Get current user for audit
            const user = await txPrisma.user.findUniqueOrThrow({ where: { id: userId } });

            // B. Update User Balance
            const updatedUser = await txPrisma.user.update({
                where: { id: userId },
                data: { balance: { increment: amount } }
            });

            // C. Create ProcessedPayment Record (Idempotency Lock)
            await txPrisma.processedPayment.create({
                data: {
                    referenceCode: String(sepayId), // Store SePay ID!
                    userId: userId,
                    amount: amount,
                    processedAt: new Date(),
                }
            });

            // D. Update Transaction Status (The Deposit Request)
            // Only update if it's PENDING? Or always?
            // If user deposits multiple times with same MMO code?
            // Usually MMO code is unique per deposit request. 
            await txPrisma.transaction.update({
                where: { id: pendingTx.id },
                data: { status: 'SUCCESS' }
            });

            // E. Create Balance Audit Record
            await txPrisma.balanceAudit.create({
                data: {
                    userId: userId,
                    amount: amount,
                    type: 'CREDIT',
                    reason: 'DEPOSIT',
                    oldBalance: user.balance,
                    newBalance: updatedUser.balance,
                    referenceId: String(sepayId),
                    description: `Deposit via SePay (Tx: ${sepayId})`
                }
            });

            // F. Alerting Logic (In-Memory Check)
            // Decimal arithmetic check.
            const expectedBalance = Number(user.balance) + amount;
            const actualNewBalance = Number(updatedUser.balance);

            if (Math.abs(expectedBalance - actualNewBalance) > 0.01) {
                console.error(`CRITICAL: Balance Mismatch for User ${userId}. Expected ${expectedBalance}, Got ${actualNewBalance}`);
                // TODO: Send Telegram Alert here
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 200 }); // Return 200 to acknowledge receipt even on error? Or 500? SePay prefers 200 usually.
    }
}