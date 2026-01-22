import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

/**
 * Middleware helper to check admin role
 */
async function isAdmin(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    if (!token) return false;

    try {
        const payload = verify(token, process.env.JWT_SECRET || 'super-secret-key') as any;
        return payload?.role === 'ADMIN';
    } catch (e) {
        return false;
    }
}

/**
 * GET /api/admin/settings
 * Fetch all system settings
 */
export async function GET(req: NextRequest) {
    if (!(await isAdmin(req))) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const settings = await prisma.systemSetting.findMany({
            orderBy: { group: 'asc' },
        });
        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        console.error('Settings fetch error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
    }
}

/**
 * POST /api/admin/settings
 * Update a system setting
 */
export async function POST(req: NextRequest) {
    if (!(await isAdmin(req))) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { key, value } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
        }

        const setting = await prisma.systemSetting.update({
            where: { key },
            data: { value: String(value) }
        });

        return NextResponse.json({ success: true, data: setting });
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update setting' }, { status: 500 });
    }
}
