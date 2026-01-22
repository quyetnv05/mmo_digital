import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetAt: number;
    };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * In production, use Redis or a database
 */
export function rateLimit(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; remaining: number } {
    const now = Date.now();
    const record = store[identifier];

    // Clean up expired entries
    if (record && record.resetAt < now) {
        delete store[identifier];
    }

    if (!record || record.resetAt < now) {
        store[identifier] = {
            count: 1,
            resetAt: now + windowMs,
        };
        return { success: true, remaining: maxRequests - 1 };
    }

    if (record.count >= maxRequests) {
        return { success: false, remaining: 0 };
    }

    record.count++;
    return { success: true, remaining: maxRequests - record.count };
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(
    handler: (req: NextRequest) => Promise<NextResponse>,
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000
) {
    return async (req: NextRequest) => {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const identifier = `${ip}-${req.nextUrl.pathname}`;

        const { success, remaining } = rateLimit(identifier, maxRequests, windowMs);

        if (!success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Too many requests',
                    message: 'Rate limit exceeded. Please try again later.',
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': '0',
                        'Retry-After': '900', // 15 minutes
                    },
                }
            );
        }

        const response = await handler(req);
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        return response;
    };
}
