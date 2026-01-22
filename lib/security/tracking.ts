
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Logs user activity to the database for anti-fraud tracking.
 */
export async function createActivityLog(
    req: NextRequest,
    userId: number | null,
    action: string,
    details?: any
) {
    try {
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        // Simple fingerprinting (In a real app, uses a client-side library)
        // Here we just hash basic headers
        // const fingerprint = ... 

        await prisma.userLog.create({
            data: {
                userId,
                action,
                ipAddress,
                userAgent,
                details: details ? JSON.stringify(details) : undefined,
            }
        });
    } catch (error) {
        console.error('Failed to create activity log', error);
        // Don't blow up the main request if logging fails
    }
}
