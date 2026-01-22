
export const SELLER_FEES = {
    BRONZE: 0.10, // 10%
    SILVER: 0.05, // 5%
    GOLD: 0.03,   // 3%
    DIAMOND: 0.01 // 1%
};

/**
 * Calculates the transaction fee based on seller level
 * @param amount Total transaction amount
 * @param level Seller Level (BRONZE, SILVER, GOLD, DIAMOND)
 * @returns { fee: number, net: number }
 */
export function calculateFee(amount: number, level: string) {
    // Default to BRONZE if invalid
    const rate = SELLER_FEES[level as keyof typeof SELLER_FEES] || SELLER_FEES.BRONZE;
    const fee = Math.floor(amount * rate);
    const net = amount - fee;
    return { fee, net, rate };
}
