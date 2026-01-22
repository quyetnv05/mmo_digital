'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Helper to get authenticated user ID
async function getUserId(): Promise<number | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        return decoded.userId;
    } catch (e) {
        return null;
    }
}

// Generate unique reference code: MMO + 6 random digits
function generateReferenceCode(): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    return `MMO${randomDigits}`;
}

/**
 * GET /api/deposits
 * Fetch last 5 deposit transactions for authenticated user
 */
export async function GET(req: NextRequest) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                type: 'DEPOSIT'
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                amount: true,
                status: true,
                referenceCode: true,
                createdAt: true
            }
        });

        const formatted = transactions.map(tx => ({
            id: tx.id,
            amount: Number(tx.amount),
            status: tx.status.toLowerCase(),
            referenceCode: tx.referenceCode || '',
            createdAt: tx.createdAt.toISOString()
        }));

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching deposits:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch deposits' }, { status: 500 });
    }
}

/**
 * POST /api/deposits
 * Create a new pending deposit transaction with unique referenceCode
 * Body: { amount: number }
 */
export async function POST(req: NextRequest) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { amount } = body;

        // Validate amount
        if (!amount || amount < 10000) {
            return NextResponse.json({
                success: false,
                error: 'Số tiền nạp tối thiểu là 10,000đ'
            }, { status: 400 });
        }

        // Generate unique reference code with retry logic
        let referenceCode: string;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            referenceCode = generateReferenceCode();

            // Check if code already exists
            const existing = await prisma.transaction.findUnique({
                where: { referenceCode }
            });

            if (!existing) break;
            attempts++;
        }

        if (attempts >= maxAttempts) {
            return NextResponse.json({
                success: false,
                error: 'Không thể tạo mã giao dịch. Vui lòng thử lại.'
            }, { status: 500 });
        }

        // Create pending transaction
        const transaction = await prisma.transaction.create({
            data: {
                userId,
                amount,
                type: 'DEPOSIT',
                status: 'PENDING',
                referenceCode: referenceCode!
            },
            select: {
                id: true,
                amount: true,
                status: true,
                referenceCode: true,
                createdAt: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                id: transaction.id,
                amount: Number(transaction.amount),
                status: transaction.status.toLowerCase(),
                referenceCode: transaction.referenceCode,
                createdAt: transaction.createdAt.toISOString()
            }
        });

    } catch (error) {
        console.error('Error creating deposit:', error);
        return NextResponse.json({ success: false, error: 'Failed to create deposit' }, { status: 500 });
    }
}
