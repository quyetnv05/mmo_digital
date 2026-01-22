
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { ip, userAgent, path } = body;

        // Verify User
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        let userId: number | null = null;

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as any;
                userId = decoded.userId;
            } catch (e) {
                // Invalid token, treat as anonymous or ignore
            }
        }

        // We only log if we have userId (Security Log) or if explicitly failed login (handled elsewhere)
        // For Dashboard tracking, we usually want to know WHO accessed it.
        if (userId) {
            await prisma.userLog.create({
                data: {
                    userId,
                    action: 'ACCESS_DASHBOARD',
                    ipAddress: ip,
                    userAgent: userAgent,
                    details: { path }
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        // Silent fail
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
