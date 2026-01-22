# Production Test Guide

## 1. Environment Verification

1.  **Vercel / VPS Config:** Ensure all variables from `PRODUCTION_SETUP.md` are set.
2.  **Cron Job:** Verify that Vercel Cron is active and hitting `/api/cron/release-escrow`.

## 2. Real Money Deposit Test (VietQR/Casso)

Perform this test to verify the payment webhook.

### Steps:
1.  **Login** to your platform as a regular user (create a new account if needed).
2.  **Go to Deposit Page:** `/dashboard/deposit`.
3.  **Get ID:** Note your User ID (e.g. `123`) which is usually in the transfer syntax `NAP 123`.
4.  **Make Transfer:** Use your banking app to transfer a **small amount (e.g., 2,000 VND)** to the verified bank account connected to Casso/VietQR.
    *   **Content/Memo:** Must include `NAP <UserId>` (e.g., `NAP 123`).
5.  **Wait < 30s:** The webhook should trigger automatically.
6.  **Verify:**
    *   Check your balance in Header or `/dashboard/profile`.
    *   Check Telegram notification (if configured).
    *   Check Database: `BalanceAudit` table should have a new `DEPOSIT` record.

### Troubleshooting:
*   **Balance not updated?** Check Vercel Function Logs for `/api/webhooks/payment`.
    *   Look for "Webhook error" or "Invalid Signature".
    *   Ensure `PAYMENT_WEBHOOK_SECRET` matches exactly with Casso/SePay.

## 3. Escrow Release Test (Cron Job)

Perform this test to verify auto-release of funds to sellers.

### Steps:
1.  **Buy a Product:** Buy a product with immediate warranty (or edit database to set `escrowDeadline` to 1 minute ago).
2.  **Wait:** Wait for the Cron Job to run (every 30 mins) OR manually trigger it.
3.  **Manual Trigger (Optional):**
    *   Visit: `https://your-domain.com/api/cron/release-escrow`
    *   Response should be: `{ success: true, count: 1, ... }`
4.  **Verify:**
    *   Check Seller Dashboard Balance.
    *   Check Database: `Transaction` status should change from `PENDING` to `SUCCESS`.
