
import { PrismaClient } from '@prisma/client';

/**
 * Logs a balance change to the audit ledger.
 * @param tx Prisma Transaction Client (essential for atomic operations)
 * @param userId User ID
 * @param amount Amount changed (positive decimal)
 * @param type 'CREDIT' | 'DEBIT'
 * @param reason Reason for change (ORDER, DEPOSIT, etc.)
 * @param oldBalance User's balance before change
 * @param newBalance User's balance after change
 * @param referenceId Optional reference (Order ID, etc.)
 */
export async function logBalanceChange(
    tx: any, // Using 'any' for Prisma.TransactionClient compatibility 
    userId: number,
    amount: number,
    type: 'CREDIT' | 'DEBIT',
    reason: string,
    oldBalance: number,
    newBalance: number,
    referenceId?: string,
    description?: string
) {
    if (!tx) throw new Error('Transaction client is required for audit logging');

    await tx.balanceAudit.create({
        data: {
            userId,
            amount: amount,
            type,
            reason,
            oldBalance,
            newBalance,
            referenceId,
            description
        }
    });
}
