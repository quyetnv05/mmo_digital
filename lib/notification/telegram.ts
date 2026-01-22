
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Sends a message via Telegram Bot API
 * @param chatId The recipient's chat ID
 * @param text The message text (supports Markdown)
 */
export async function sendTelegramMessage(chatId: string, text: string) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('TELEGRAM_BOT_TOKEN is not set. Skipping notification.');
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Telegram notification failed:', error);
        }
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}
