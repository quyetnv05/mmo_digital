import * as argon2 from 'argon2';

/**
 * Hash a plain text password using Argon2id
 * Argon2id is the recommended algorithm for password hashing (OWASP)
 */
export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4,
    });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
    hash: string,
    password: string
): Promise<boolean> {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
}
