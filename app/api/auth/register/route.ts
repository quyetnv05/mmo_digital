import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';

const registerSchema = z.object({
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['BUYER', 'SELLER']).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: validation.error.errors[0].message,
                },
                { status: 400 }
            );
        }

        const { username, email, password, role = 'BUYER' } = validation.data;

        // Check if user already exists
        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });

        if (existing) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'USER_EXISTS',
                    message: 'Username or email already taken',
                },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role,
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                balance: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Account created successfully',
            user,
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'SERVER_ERROR',
                message: 'An error occurred during registration',
            },
            { status: 500 }
        );
    }
}
