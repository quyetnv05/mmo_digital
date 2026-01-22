
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Generate a base32 secret for TOTP
function generateBase32Secret(length: number = 20): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % chars.length];
    }
    return result;
}

// POST: Generate 2FA Secret and QR Code URL
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Generate Secret
        const secret = generateBase32Secret(20);

        // Store Secret in DB
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { twoFactorSecret: secret }
        });

        // Generate OTPAuth URL for QR Code
        const issuer = encodeURIComponent('MMO Digital');
        const account = encodeURIComponent(decoded.username || decoded.email);
        const otpauthUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;

        // Generate QR Code using a public API (simpler than importing qrcode library)
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

        return NextResponse.json({ success: true, qrCode, secret });

    } catch (error) {
        console.error('2FA setup error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
