/**
 * Send notification to Telegram
 * Used for admin alerts: new orders, disputes, withdrawal requests
 */
export async function sendTelegramNotification(message: string): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!botToken || !chatId) {
        console.warn('Telegram not configured, skipping notification');
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });
    } catch (error) {
        console.error('Failed to send Telegram notification:', error);
    }
}

/**
 * Notify admins about new order
 */
export async function notifyNewOrder(orderId: number, buyerName: string, totalPrice: number) {
    const message = `
🛒 <b>New Order #${orderId}</b>

👤 Buyer: ${buyerName}
💰 Amount: ${totalPrice.toLocaleString()}đ
⏰ Time: ${new Date().toLocaleString('vi-VN')}
  `.trim();

    await sendTelegramNotification(message);
}

/**
 * Notify admins about new dispute
 */
export async function notifyNewDispute(disputeId: number, orderId: number, reason: string) {
    const message = `
⚠️ <b>New Dispute #${disputeId}</b>

📦 Order: #${orderId}
💬 Reason: ${reason}
⏰ Time: ${new Date().toLocaleString('vi-VN')}

⚡ Action required!
  `.trim();

    await sendTelegramNotification(message);
}

/**
 * Notify admins about withdrawal request
 */
export async function notifyWithdrawalRequest(
    requestId: number,
    username: string,
    amount: number,
    bankAccount: string
) {
    const message = `
💸 <b>Withdrawal Request #${requestId}</b>

👤 User: ${username}
💰 Amount: ${amount.toLocaleString()}đ
🏦 Bank: ${bankAccount}
⏰ Time: ${new Date().toLocaleString('vi-VN')}

⚡ Approval required!
  `.trim();

    await sendTelegramNotification(message);
}
