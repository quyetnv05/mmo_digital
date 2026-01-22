import { prisma } from '@/lib/prisma';
import { Prisma, TransactionType } from '@prisma/client';

/**
 * CRITICAL: Atomic purchase transaction to prevent money loss without goods delivery
 * 
 * This function ensures:
 * 1. Buyer balance is checked and deducted atomically with SET balance = balance - amount
 * 2. Product stock is locked and allocated with FOR UPDATE
 * 3. Items are marked as sold with soldAt timestamp
 * 4. Order is created with escrow deadline
 * 5. Seller's pendingBalance is incremented
 * 6. Transaction records are created
 * 
 * If ANY step fails, the entire transaction rolls back.
 */
export async function executePurchaseTransaction(
    buyerId: number,
    productId: number,
    quantity: number
) {
    return await prisma.$transaction(
        async (tx) => {
            // Step 1: Lock and fetch buyer
            const buyer = await tx.user.findUnique({
                where: { id: buyerId },
                select: { id: true, balance: true, username: true },
            });

            if (!buyer) {
                throw new Error('Buyer not found');
            }

            // Step 2: Lock and fetch product with seller info
            const product = await tx.product.findUnique({
                where: { id: productId },
                include: {
                    seller: {
                        select: { id: true, username: true },
                    },
                },
            });

            if (!product || product.status !== 'ACTIVE') {
                throw new Error('Product not available');
            }

            const totalPrice = Number(product.price) * quantity;
            const platformFee = totalPrice * 0.05; // 5% platform fee
            const sellerAmount = totalPrice - platformFee;

            // Step 3: Validate buyer balance
            if (Number(buyer.balance) < totalPrice) {
                throw new Error(`Insufficient balance. Required: ${totalPrice}đ, Available: ${buyer.balance}đ`);
            }

            // Step 4: Lock available items with FOR UPDATE to prevent race conditions
            // This is CRITICAL to prevent overselling
            const availableItems = await tx.$queryRaw<Array<{ id: number; content: string }>>`
        SELECT id, content 
        FROM "ProductItem" 
        WHERE "productId" = ${productId} 
        AND "isSold" = false 
        ORDER BY id ASC 
        LIMIT ${quantity}
        FOR UPDATE
      `;

            if (availableItems.length < quantity) {
                throw new Error(`Insufficient stock. Requested: ${quantity}, Available: ${availableItems.length}`);
            }

            // Step 5: Deduct buyer balance ATOMICALLY using direct SET operation
            // This prevents double-spending even if two transactions happen simultaneously
            const balanceBefore = Number(buyer.balance);
            const balanceAfter = balanceBefore - totalPrice;

            if (balanceAfter < 0) {
                throw new Error(`Insufficient balance. Required: ${totalPrice}đ, Available: ${balanceBefore}đ`);
            }

            // Use raw SQL for balance update to ensure atomicity
            await tx.$executeRaw`
        UPDATE "User" 
        SET balance = balance - ${totalPrice}
        WHERE id = ${buyerId} 
        AND balance >= ${totalPrice}
      `;

            // Verify the update succeeded
            const updatedBuyer = await tx.user.findUnique({
                where: { id: buyerId },
                select: { balance: true }
            });

            if (!updatedBuyer || Number(updatedBuyer.balance) !== balanceAfter) {
                throw new Error('Balance update failed - possible concurrent transaction');
            }

            // Step 6: Calculate escrow deadline (warranty period)
            const escrowDeadline = new Date();
            escrowDeadline.setHours(escrowDeadline.getHours() + product.warrantyHours);

            // Step 7: Create order
            const order = await tx.order.create({
                data: {
                    buyerId,
                    productId,
                    quantity,
                    totalPrice,
                    status: 'COMPLETED',
                    escrowDeadline,
                },
            });

            // Step 8: Mark items as sold with soldAt timestamp
            const itemIds = availableItems.map((item) => item.id);
            const now = new Date();

            await tx.productItem.updateMany({
                where: {
                    id: { in: itemIds },
                },
                data: {
                    isSold: true,
                    soldAt: now,
                    orderId: order.id,
                },
            });

            // Step 9: Increment seller's pending balance (escrow)
            await tx.user.update({
                where: { id: product.sellerId },
                data: {
                    pendingBalance: {
                        increment: sellerAmount,
                    },
                },
            });

            // Step 10: Create buyer transaction record (PURCHASE)
            await tx.transaction.create({
                data: {
                    userId: buyerId,
                    amount: -totalPrice,
                    type: 'PURCHASE',
                    status: 'SUCCESS',
                    referenceCode: `ORDER-${order.id}`,
                },
            });

            // Step 11: Create seller transaction record (EARNING - pending)
            await tx.transaction.create({
                data: {
                    userId: product.sellerId,
                    amount: sellerAmount,
                    type: 'EARNING',
                    status: 'PENDING', // Will be SUCCESS after escrow release
                    referenceCode: `SALE-${order.id}`,
                },
            });

            // Return order with delivered items
            return {
                success: true,
                order: {
                    id: order.id,
                    totalPrice,
                    quantity,
                    status: order.status,
                    escrowDeadline,
                },
                items: availableItems.map((item) => ({
                    content: item.content,
                })),
                message: 'Purchase successful! Items delivered instantly.',
            };
        },
        {
            maxWait: 5000, // Wait up to 5 seconds for a transaction slot
            timeout: 15000, // Transaction must complete within 15 seconds
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // Highest isolation
        }
    );
}

/**
 * Release escrow funds to seller after warranty period expires
 * This should be run by a cron job every minute
 * 
 * Logic:
 * 1. Find orders where escrowDeadline < now AND status = COMPLETED AND isReleased = false
 * 2. Move pendingBalance to balance for seller
 * 3. Mark order as isReleased = true with releasedAt timestamp
 * 4. Update transaction status to SUCCESS
 */
export async function releaseEscrowFunds() {
    const now = new Date();

    // Find all orders past escrow deadline that are not disputed and not yet released
    const expiredOrders = await prisma.order.findMany({
        where: {
            escrowDeadline: { lte: now },
            status: 'COMPLETED', // Not disputed
            isReleased: false, // Not yet released
        },
        include: {
            product: {
                include: { seller: true },
            },
        },
    });

    const results: { orderId: number; sellerId: number; amount: number; releasedAt: Date }[] = [];

    for (const order of expiredOrders) {
        try {
            await prisma.$transaction(async (tx) => {
                const platformFee = Number(order.totalPrice) * 0.05;
                const sellerAmount = Number(order.totalPrice) - platformFee;

                // Move from pending to available balance
                await tx.user.update({
                    where: { id: order.product.sellerId },
                    data: {
                        pendingBalance: { decrement: sellerAmount },
                        balance: { increment: sellerAmount },
                    },
                });

                // Mark order as released (only isReleased exists in schema)
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        isReleased: true,
                    },
                });

                // Update transaction status to SUCCESS
                await tx.transaction.updateMany({
                    where: {
                        referenceCode: `SALE-${order.id}`,
                        status: 'PENDING',
                    },
                    data: {
                        status: 'SUCCESS',
                    },
                });

                results.push({
                    orderId: order.id,
                    sellerId: order.product.sellerId,
                    amount: sellerAmount,
                    releasedAt: now,
                });
            });
        } catch (error) {
            console.error(`Failed to release escrow for order ${order.id}:`, error);
        }
    }

    return {
        releasedCount: results.length,
        results,
    };
}

/**
 * Process deposit from payment gateway webhook
 * Uses ProcessedPayment table to prevent duplicate processing
 * 
 * @param userId User ID to credit
 * @param amount Amount to deposit
 * @param referenceCode Unique reference code from gateway
 * @param transactionId Transaction ID from gateway
 */
export async function processDeposit(
    userId: number,
    amount: number,
    referenceCode: string,
    transactionId: string
) {
    return await prisma.$transaction(async (tx) => {
        // Check if this payment was already processed using ProcessedPayment table
        const existing = await tx.processedPayment.findUnique({
            where: { referenceCode },
        });

        if (existing) {
            throw new Error('Payment already processed');
        }

        // Also check Transaction table as backup
        const existingTransaction = await tx.transaction.findUnique({
            where: { referenceCode },
        });

        if (existingTransaction) {
            throw new Error('Transaction already recorded');
        }

        // Add balance
        await tx.user.update({
            where: { id: userId },
            data: {
                balance: { increment: amount },
            },
        });

        // Create transaction record
        await tx.transaction.create({
            data: {
                userId,
                amount,
                type: 'DEPOSIT',
                status: 'SUCCESS',
                referenceCode,
            },
        });

        // Create ProcessedPayment record to prevent duplicates
        // Create ProcessedPayment record to prevent duplicates
        // Note: Schema only has userId, amount, referenceCode, processedAt
        await tx.processedPayment.create({
            data: {
                userId,
                amount,
                referenceCode,
            },
        });

        // Get new balance
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { balance: true },
        });

        return {
            success: true,
            message: `Deposited ${amount}đ successfully`,
            newBalance: Number(user?.balance || 0),
        };
    });
}
