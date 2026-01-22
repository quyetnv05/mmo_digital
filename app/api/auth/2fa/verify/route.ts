
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Simple TOTP verification (30 second window)
function verifyTOTP(secret: string, token: string): boolean {
    const timeStep = 30;
    const now = Math.floor(Date.now() / 1000);

    // Check current time step and one before/after for tolerance
    for (let i = -1; i <= 1; i++) {
        const counter = Math.floor((now + i * timeStep) / timeStep);
        const expectedToken = generateTOTP(secret, counter);
        if (expectedToken === token) {
            return true;
        }
    }
    return false;
}

function generateTOTP(secret: string, counter: number): string {
    // Convert base32 secret to buffer
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const char of secret.toUpperCase()) {
        const val = base32Chars.indexOf(char);
        if (val >= 0) bits += val.toString(2).padStart(5, '0');
    }
    const secretBytes = Buffer.alloc(Math.floor(bits.length / 8));
    for (let i = 0; i < secretBytes.length; i++) {
        secretBytes[i] = parseInt(bits.substr(i * 8, 8), 2);
    }

    // Convert counter to 8-byte buffer
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));

    // Generate HMAC-SHA1
    const hmac = crypto.createHmac('sha1', secretBytes);
    hmac.update(counterBuffer);
    const hash = hmac.digest();

    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0x0f;
    const binary = ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
}

// POST: Verify TOTP Code
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const body = await req.json();
        const { code } = body;

        // Get User Secret
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || !user.twoFactorSecret) {
            return NextResponse.json({ success: false, error: '2FA not setup' }, { status: 400 });
        }

        // Verify TOTP
        const isValid = verifyTOTP(user.twoFactorSecret, code);

        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid OTP code' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: '2FA verified successfully' });

    } catch (error) {
        console.error('2FA verify error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
