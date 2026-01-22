import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

export interface JWTPayload {
    userId: number;
    username: string;
    email: string;
    role: string;
}

/**
 * Generate a JWT token for authenticated user
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authorization: string | null): string | null {
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return null;
    }
    return authorization.substring(7);
}
