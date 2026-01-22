import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Define public paths
    const isPublicPath =
        path === '/' ||
        path.startsWith('/auth') ||
        path.startsWith('/api/auth') || // Allow all auth APIs
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path.includes('favicon.ico');

    // Get token from cookie (HttpOnly)
    const token = request.cookies.get('auth_token')?.value;

    // 1. Redirect to Dashboard if logged in and trying to access Auth pages
    if (path.startsWith('/auth') && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 2. Redirect to Login if accessing protected routes without token
    if (!isPublicPath && !token) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 3. Verify Token & Check Roles for Protected Routes
    if (token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
            const { payload } = await jwtVerify(token, secret);
            const userRole = payload.role as string;

            // ADMIN Routes Protection
            if (path.startsWith('/dashboard/admin')) {
                if (userRole !== 'ADMIN') {
                    // Log attempt?
                    return NextResponse.redirect(new URL('/dashboard', request.url)); // Access Denied -> Back to User Dashboard
                }
            }

            // SELLER Routes Protection (Inventory, Products)
            if (path.startsWith('/dashboard/inventory') || path.startsWith('/dashboard/products')) {
                if (userRole !== 'SELLER' && userRole !== 'ADMIN') {
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
            }

        } catch (error) {
            // Token invalid or expired
            const response = NextResponse.redirect(new URL('/auth/login', request.url));
            response.cookies.delete('auth_token'); // Clear invalid cookie
            return response;
        }
    }

    return NextResponse.next();
}

// Matching paths
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/auth/:path*',
        // We generally don't want to match API routes to avoid blocking public APIs unless specific pattern
        // But here we might want to protect /apiRoutes too? 
        // Better to handle API auth inside Route Handlers for granular control.
        // So exclude /api from matcher or handle it carefully.
        // For now, only matching pages.
    ],
};
