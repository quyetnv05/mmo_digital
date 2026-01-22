import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/lib/auth/jwt';

export interface AuthenticatedRequest extends NextRequest {
    user?: JWTPayload;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function withAuth(
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
    return async (req: NextRequest) => {
        const authorization = req.headers.get('authorization');
        const token = extractTokenFromHeader(authorization);

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
                { status: 401 }
            );
        }

        const user = verifyToken(token);

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'INVALID_TOKEN',
                    message: 'Invalid or expired token',
                },
                { status: 401 }
            );
        }

        // Attach user to request
        (req as AuthenticatedRequest).user = user;
        return handler(req as AuthenticatedRequest);
    };
}

/**
 * Middleware to check if user has required role
 */
export function withRole(
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
    allowedRoles: string[]
) {
    return withAuth(async (req: AuthenticatedRequest) => {
        const user = req.user!;

        if (!allowedRoles.includes(user.role)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'FORBIDDEN',
                    message: 'You do not have permission to access this resource',
                },
                { status: 403 }
            );
        }

        return handler(req);
    });
}
