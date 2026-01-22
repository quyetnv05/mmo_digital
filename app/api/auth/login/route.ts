import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import { createActivityLog } from '@/lib/security/tracking';
import { z } from 'zod';

const loginSchema = z.object({
    identifier: z.string().min(3),
    password: z.string(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid request',
                },
                { status: 400 }
            );
        }

        const { identifier, password } = validation.data;

        // Find user by email or username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'INVALID_CREDENTIALS',
                    message: 'Invalid username or password',
                },
                { status: 401 }
            );
        }

        // Check if user is banned
        if (user.status === 'BANNED') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'ACCOUNT_BANNED',
                    message: 'Your account has been banned',
                },
                { status: 403 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(user.password, password);

        if (!isValid) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'INVALID_CREDENTIALS',
                    message: 'Invalid username or password',
                },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        });

        // Log successful login
        await createActivityLog(req, user.id, 'LOGIN', { status: 'SUCCESS' });

        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                balance: Number(user.balance),
                pendingBalance: Number(user.pendingBalance),
            },
        });

        // Set HttpOnly Cookie
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'SERVER_ERROR',
                message: 'An error occurred during login',
            },
            { status: 500 }
        );
    }
}
