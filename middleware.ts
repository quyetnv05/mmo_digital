import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Do not import env from '@/lib/env' here if it causes Edge Runtime issues with Zod or 'server-only'.
// But we want to fail fast if keys are missing.
// We'll trust lib/env is checked at build time/runtime entry elsewhere (like layout or instrumentation).
// Here we access process.env directly for avoiding complex imports in Edge.

// Redis instance for Rate Limiting
// Create only if env vars exist to avoid crash during build if envs are missing (though env.ts handles that)
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? Redis.fromEnv()
    : null; // Fallback or handle null? IF null, we might bypass RL or Fail.

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';

    // --- 1. RATE LIMITING (Edge Compatible) ---
    if (redis && (path.startsWith('/api') || path.startsWith('/auth'))) {
        let limit = 60; // Default: 60 req/min
        let window = '1 m';

        // Stricter for Login/Auth endpoints
        if (path.includes('/login') || path.includes('/register') || path.includes('/auth')) {
            limit = 5; // 5 req/min
        }

        const ratelimit = new Ratelimit({
            redis: redis,
            limiter: Ratelimit.slidingWindow(limit, "1 m"),
            analytics: true,
            prefix: "@upstash/ratelimit",
        });

        const { success, limit: l, reset, remaining } = await ratelimit.limit(`mw_${ip}_${path}`); // Limit by IP + Path (broadly) or just IP? Usually IP.
        // Using `mw_${ip}` means shared limit across all routes. 
        // Using `mw_${ip}_${path}` implies per-route bucket. 
        // User asked: "5 req/min for login", "60 req/min for API" globally per IP?
        // Let's use separate identifiers for Auth vs API to avoid API usage blocking Login.

        let identifier = `ip_${ip}_api`;
        if (path.includes('/login') || path.includes('/register')) {
            identifier = `ip_${ip}_auth`;
        }

        const { success: allow } = await ratelimit.limit(identifier);

        if (!allow) {
            return NextResponse.json(
                { error: 'Too Many Requests', message: 'Rate limit exceeded, please try again later.' },
                { status: 429, headers: { 'Retry-After': reset.toString() } }
            );
        }
    }

    // --- 2. AUTHENTICATION & RBAC ---

    // Define public paths
    const isPublicPath =
        path === '/' ||
        path.startsWith('/auth') ||
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path.includes('favicon.ico') ||
        path.startsWith('/api/webhooks'); // Webhooks must be public (protected by signature)

    // Get token from cookie (HttpOnly)
    const token = request.cookies.get('auth_token')?.value;

    // A. Redirect to Dashboard if logged in and trying to access Auth pages
    if (path.startsWith('/auth') && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // B. Redirect to Login if accessing protected routes without token
    if (!isPublicPath && !token) {
        // API vs Page redirect
        if (path.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // C. Verify Token & Check Roles for Protected Routes
    if (token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
            const { payload } = await jwtVerify(token, secret);
            const userRole = payload.role as string;

            // ADMIN Routes Protection
            if (path.startsWith('/dashboard/admin') || path.startsWith('/api/admin')) {
                if (userRole !== 'ADMIN') {
                    // API vs Page
                    if (path.startsWith('/api')) {
                        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                    }
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
            }

            // SELLER Routes Protection
            if (path.startsWith('/dashboard/inventory') || path.startsWith('/dashboard/products')) {
                if (userRole !== 'SELLER' && userRole !== 'ADMIN') {
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
            }

        } catch (error) {
            // Token invalid or expired
            const response = NextResponse.redirect(new URL('/auth/login', request.url));
            response.cookies.delete('auth_token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/auth/:path*',
        '/api/admin/:path*',
        '/api/user/:path*',
        // Note: We are matching specific API routes or all?
        // User asked "block unauthorized access to /api/*".
        '/api/:path*',
    ],
};
