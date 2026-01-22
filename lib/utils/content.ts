import crypto from 'crypto';

/**
 * Generate SHA-256 hash from content for duplicate detection
 * This prevents sellers from uploading the same account multiple times
 */
export function generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content.trim()).digest('hex');
}

/**
 * Validate content format
 * Expected format: username|password|cookie (or similar)
 */
export function validateContentFormat(content: string): boolean {
    const parts = content.split('|');
    return parts.length >= 2 && parts.every(part => part.trim().length > 0);
}

/**
 * Parse metadata from JSON
 */
export function parseMetadata(metadata: any): {
    proxy?: string;
    deviceInfo?: string;
    ipAddress?: string;
    [key: string]: any;
} | null {
    if (!metadata) return null;

    try {
        if (typeof metadata === 'string') {
            return JSON.parse(metadata);
        }
        return metadata;
    } catch {
        return null;
    }
}
