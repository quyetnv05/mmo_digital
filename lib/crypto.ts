
import { createHash } from 'crypto';

/**
 * Generates a SHA-256 hash of the content to prevent duplicate uploads.
 * Use for ProductItem content validation.
 */
export function hashContent(content: string): string {
    return createHash('sha256').update(content.trim()).digest('hex');
}
