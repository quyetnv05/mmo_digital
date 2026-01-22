
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logBalanceChange } from '@/lib/finance/audit';
import { calculateFee } from '@/lib/finance/fees';
import { sendTelegramMessage } from '@/lib/notification/telegram';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: Request) {
    try {
        // 1. Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded || !decoded.userId) return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });

        const buyerId = decoded.userId;

        // 2. Input Validation
        const body = await req.json();
        const { productId, quantity = 1 } = body;

        if (!productId) return NextResponse.json({ success: false, error: 'Missing productId' }, { status: 400 });

        // 3. Atomic Transaction
        const result = await prisma.$transaction(async (tx) => {
            // A. Fetch Product & Buyer
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product) throw new Error('Product not found');
            if (product.status !== 'ACTIVE') throw new Error('Product is not available');

            const buyer = await tx.user.findUnique({ where: { id: buyerId } });
            if (!buyer) throw new Error('Buyer not found');

            // B. Check Balance
            const total = Number(product.price) * quantity;
            if (Number(buyer.balance) < total) {
                throw new Error('Insufficient balance');
            }

            // C. Check Stock & Lock Items
            const items = await tx.productItem.findMany({
                where: { productId: productId, isSold: false },
                take: quantity,
            });

            if (items.length < quantity) {
                throw new Error('Insufficient stock');
            }

            const itemIds = items.map(i => i.id);

            // D. Create Order
            // Calculate escrow deadline (e.g. 24h from now)
            const escrowTime = new Date();
            escrowTime.setHours(escrowTime.getHours() + product.warrantyHours);

            const order = await tx.order.create({
                data: {
                    buyerId,
                    productId,
                    quantity,
                    totalPrice: total,
                    status: 'COMPLETED', // Or PENDING if manual delivery, but this is auto
                    escrowDeadline: escrowTime,
                    isReleased: false,
                }
            });

            // E. Update Items
            await tx.productItem.updateMany({
                where: { id: { in: itemIds } },
                data: { isSold: true, orderId: order.id, soldAt: new Date() }
            });

            // F. Deduct Buyer Balance & Log Audit
            const oldBuyerBalance = Number(buyer.balance);
            const newBuyerBalance = oldBuyerBalance - total;

            await tx.user.update({
                where: { id: buyerId },
                data: { balance: newBuyerBalance }
            });

            await logBalanceChange(
                tx,
                buyerId,
                total,
                'DEBIT',
                'ORDER',
                oldBuyerBalance,
                newBuyerBalance,
                `ORDER_${order.id}`,
                `Payment for Order #${order.id}`
            );

            // G. Add to Seller Pending Balance (Escrow) & Log Audit
            const seller = await tx.user.findUnique({ where: { id: product.sellerId } });
            if (!seller) throw new Error('Seller not found');

            // Calculate Fee
            const { fee, net, rate } = calculateFee(total, seller.sellerLevel);

            const oldSellerPending = Number(seller.pendingBalance);
            const newSellerPending = oldSellerPending + net;

            await tx.user.update({
                where: { id: product.sellerId },
                data: { pendingBalance: newSellerPending }
            });

            // Log Income (Net Amount)
            // Note: We could log full amount then fee debit, but simpler to log Net Income for now?
            // "Double-entry" prefers: Credit Revenue (Total), Debit Expense (Fee).
            // Let's do that for clarity.

            // 1. Credit Full Revenue (Pending) - simulated step for audit trail, but we only incremented Net.
            // Wait, if we only increment Net, we can't Credit Full. 
            // Let's increment User Balance by Net.
            // Log: "Credit Sales Revenue (Net)"

            await logBalanceChange(
                tx,
                product.sellerId,
                net,
                'CREDIT',
                'ORDER_ESCROW',
                oldSellerPending,
                newSellerPending,
                `ORDER_${order.id}`,
                `Income from Order #${order.id} (Fee: ${(rate * 100)}%)`
            );

            // Audit the fee technically "lost" from the potential total? 
            // Maybe just logging the rate in description is enough for simple ledger.
            // If we want detailed tracking:
            // Insert audit record for FEE? No, because balance didn't change for it (it was net).
            // We can just log the fee in description.



            // H. Create Transactions Logs
            // Buyer Log
            await tx.transaction.create({
                data: {
                    userId: buyerId,
                    amount: total,
                    type: 'PURCHASE',
                    status: 'SUCCESS',
                    referenceCode: `ORDER_${order.id}`
                }
            });

            // Seller Log (Optional: Maybe create when released? Or create as pending now?)
            // Usually we log EARNING when it's released. For now, just pendingBalance is updated.

            return { order, sellerTelegramId: seller.telegramId };
        });

        // Send Notification (Fire and forget, don't await/block response)
        if (result.sellerTelegramId) {
            const msg = `💰 **New Order Received!**\n\nOrder #${result.order.id}\nItem: ${body.productId}\nQuantity: ${body.quantity}\nTotal: ${Number(result.order.totalPrice).toLocaleString()} đ\n\nCheck your dashboard for details.`;
            sendTelegramMessage(result.sellerTelegramId, msg);
        }

        return NextResponse.json({ success: true, data: result.order });

    } catch (error: any) {
        console.error('Purchase error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Transaction failed' }, { status: 400 });
    }
}
