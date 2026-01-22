
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: Request) {
    try {
        // 1. Verify User
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
        }

        // 2. Get User
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

        // 3. Verify Current Password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return NextResponse.json({ success: false, error: 'Mật khẩu hiện tại không đúng' }, { status: 400 });

        // 4. Hash New Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 5. Update Password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
