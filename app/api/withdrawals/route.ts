
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { logBalanceChange } from '@/lib/finance/audit';
import { sendTelegramMessage } from '@/lib/notification/telegram';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// GET: List Withdrawals (Admin or Seller)
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded || !decoded.userId) return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });

        const { searchParams } = new URL(req.url); // Use URL here, Request object has url
        const userRole = decoded.role;

        let where: any = {};
        if (userRole !== 'ADMIN') {
            where.userId = decoded.userId; // Seller only sees their own
        }

        const withdrawals = await prisma.withdrawalRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { username: true, balance: true } } } // Include user details for Admin
        });

        return NextResponse.json({ success: true, data: withdrawals });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create Request (Seller) OR Approve/Reject (Admin)
// To keep it simple, POST = Create. PUT = Update Status.
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const body = await req.json();

        // 1. Create Request (Seller)
        if (!body.action) {
            const { amount, bankName, accountNumber, accountName } = body;
            if (!amount || amount < 50000) return NextResponse.json({ success: false, error: 'Min amount 50,000' }, { status: 400 });

            // Atomic: Check Balance & Create Request
            // Note: Usually we deduct balance immediately for "Pending" request? Or hold it?
            // Standard model: Move Balance -> PendingBalance? Or just deduct and log "WITHDRAW_REQUEST".
            // If rejected, refund it.
            // Let's deduct immediately to prevent double spending.

            await prisma.$transaction(async (tx) => {
                const user = await tx.user.findUnique({ where: { id: decoded.userId } });
                if (!user || Number(user.balance) < amount) throw new Error('Insufficient balance');

                // Deduct Balance
                const newBalance = Number(user.balance) - amount;
                await tx.user.update({
                    where: { id: user.id },
                    data: { balance: newBalance }
                });

                // Create Request
                await tx.withdrawalRequest.create({
                    data: {
                        userId: user.id,
                        amount: amount,
                        bankName,
                        accountNumber,
                        accountName
                    }
                });

                await logBalanceChange(
                    tx,
                    user.id,
                    amount,
                    'DEBIT',
                    'WITHDRAW_REQUEST',
                    Number(user.balance),
                    newBalance,
                    undefined,
                    `Request withdrawal to ${bankName}`
                );
            }, {
                timeout: 30000, // 30 seconds timeout
                maxWait: 10000, // Max 10 seconds wait for connection
            });

            // Send Telegram Notification to Admin
            // Admin Chat ID can be hardcoded or env var. Let's use env TELEGRAM_ADMIN_CHAT_ID or fallback.
            const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
            if (adminChatId) {
                const msg = `💸 **New Withdrawal Request**\n\nUser: ${decoded.username || 'Seller'}\nAmount: ${amount.toLocaleString()} đ\nBank: ${bankName} (${accountNumber})\n\nPlease check Admin Dashboard.`;
                sendTelegramMessage(adminChatId, msg);
            }

            return NextResponse.json({ success: true });
        }

        // 2. Approve/Reject (Admin)
        if (body.action === 'APPROVE' || body.action === 'REJECT') {
            if (decoded.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

            const { id } = body;
            const request = await prisma.withdrawalRequest.findUnique({ where: { id } });
            if (!request || request.status !== 'PENDING') return NextResponse.json({ success: false, error: 'Invalid Request' }, { status: 400 });

            if (body.action === 'APPROVE') {
                await prisma.withdrawalRequest.update({
                    where: { id },
                    data: { status: 'APPROVED' }
                });
                // Money already deducted. Just update status.
                // Optionally log "WITHDRAW_SUCCESS".
            } else {
                // REJECT -> Refund
                await prisma.$transaction(async (tx) => {
                    await tx.withdrawalRequest.update({
                        where: { id },
                        data: { status: 'REJECTED', rejectionReason: body.reason }
                    });

                    // Refund
                    const user = await tx.user.findUnique({ where: { id: request.userId } });
                    if (user) {
                        const newBalance = Number(user.balance) + Number(request.amount);
                        await tx.user.update({
                            where: { id: user.id },
                            data: { balance: newBalance }
                        });

                        await logBalanceChange(
                            tx,
                            user.id,
                            Number(request.amount),
                            'CREDIT',
                            'REFUND',
                            Number(user.balance),
                            newBalance,
                            `WITHDRAW_${id}`,
                            `Refund rejected withdrawal #${id}`
                        );
                    }
                });
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid Action' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Error' }, { status: 500 });
    }
}
