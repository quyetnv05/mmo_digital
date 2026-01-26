import crypto from 'crypto';
import 'server-only';
import { env } from './env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended for GCM
const AUTH_TAG_LENGTH = 16;
// Ensure key is 32 bytes. If env key is hex, parse it. If string, hash it or slice it? 
// Ideally user provides 32-byte hex. Let's assume hex or perform a hash to ensure length.
// For safety/simplicity here, we'll try to use it as Buffer if hex, or create a hash if it's a passphrase.
// A common pattern is to require a hex string of 64 chars (32 bytes).

function getKey(): Buffer {
    const key = env.ENCRYPTION_KEY;
    if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
        return Buffer.from(key, 'hex');
    }
    // Fallback: If not hex, hash it to get 32 bytes (SHA-256)
    return crypto.createHash('sha256').update(key).digest();
}

export function encryptData(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: IV:AuthTag:EncryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptData(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
    }

    const [ivHex, authTagHex, contentHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(contentHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
