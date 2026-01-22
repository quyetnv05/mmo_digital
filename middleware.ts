import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Define public paths that don't need authentication
    const isPublicPath =
        path === '/' ||
        path.startsWith('/auth') ||
        path.startsWith('/api/auth') ||
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path.includes('favicon.ico');

    // Get the token from the cookies
    const token = request.cookies.get('token')?.value || '';

    // If the path is public and user has token, redirect to dashboard
    if (isPublicPath && token && path.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If the path is protected and user has no token, redirect to login
    if (!isPublicPath && !token) {
        // For development/demo purposes, we might want to bypass this or have a mock token
        // But for production logic:
        // return NextResponse.redirect(new URL('/auth/login', request.url));

        // TEMPORARY: Allow access for demo without real JWT
        // In a real app, uncomment the redirection above
    }

    // Admin route protection
    if (path.startsWith('/dashboard/admin')) {
        // Decode token and check role...
        // const user = decode(token);
        // if (user.role !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (path.startsWith('/dashboard') && !path.startsWith('/dashboard/admin') && token) {
        // We do this non-blocking
        const ip = request.headers.get('x-forwarded-for') || (request as any).ip || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Call internal API
        fetch(new URL('/api/security/log-access', request.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip, userAgent, path }),
        }).catch(() => { }); // Ignore errors
    }

    return NextResponse.next();
}

// Matching paths
export const config = {
    matcher: [
        '/',
        '/dashboard/:path*',
        '/auth/:path*',
    ],
};
