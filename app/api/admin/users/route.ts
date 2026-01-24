
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// GET: List all users
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
                balance: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedUsers = users.map((u: any) => ({
            ...u,
            balance: Number(u.balance),
            createdAt: u.createdAt.toISOString().split('T')[0]
        }));

        return NextResponse.json({ success: true, data: formattedUsers });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update User Status (Ban/Unban)
export async function PUT(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const { userId, status, role } = body;

        if (!userId) return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });

        const updateData: any = {};
        if (status) updateData.status = status;
        if (role) updateData.role = role;

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        return NextResponse.json({ success: true, message: 'Updated successfully' });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
    }
}
