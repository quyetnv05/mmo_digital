# Environment Variables - Production Checklist

## Required Variables for Vercel

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Supabase/Neon/Railway |
| `JWT_SECRET` | Secret key for JWT tokens | Generate below |
| `NEXTAUTH_SECRET` | Same as JWT_SECRET | (Use same value) |
| `NEXTAUTH_URL` | Application URL | e.g., https://mmo-digital.vercel.app |
| `PAYMENT_WEBHOOK_SECRET` | HMAC secret from Casso/SePay | Payment provider dashboard |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token | @BotFather on Telegram |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat ID for admin notifications | @userinfobot on Telegram |
| `CRON_SECRET` | Secret to protect cron endpoints | Generate similar to JWT_SECRET |

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PLATFORM_FEE_PERCENTAGE` | Platform fee rate | 5 |
| `SESSION_SECRET` | Session encryption key | Same as JWT_SECRET |

## How to Generate NEXTAUTH_SECRET / JWT_SECRET

Run one of these commands in your terminal:

### Option 1: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: Using OpenSSL
```bash
openssl rand -hex 32
```

### Option 3: Using PowerShell (Windows)
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## Copy this for Vercel Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
JWT_SECRET=<generated-secret>
NEXTAUTH_SECRET=<same-as-jwt-secret>
NEXTAUTH_URL=https://<your-project>.vercel.app
PAYMENT_WEBHOOK_SECRET=<from-casso-or-sepay>
TELEGRAM_BOT_TOKEN=<from-botfather>
TELEGRAM_ADMIN_CHAT_ID=<your-chat-id>
CRON_SECRET=<another-generated-secret>
```

## Vercel Cron Jobs

The `vercel.json` is configured to run `/api/cron/release-escrow` every 30 minutes.
This automatically releases funds to sellers after warranty period expires.

To verify cron is working:
1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. You should see the job listed with "Every 30 minutes" schedule
