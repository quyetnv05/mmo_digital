import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateContentHash } from '@/lib/utils/content';
import { z } from 'zod';
import crypto from 'crypto';

const bulkUploadSchema = z.object({
    productId: z.number().int().positive(),
    content: z.string().min(1), // Multi-line text, one item per line
    metadata: z.object({
        proxy: z.string().optional(),
        deviceInfo: z.string().optional(),
        source: z.string().optional(),
    }).optional(),
});

import { encryptData } from '@/lib/crypto';

/**
 * POST /api/inventory/bulk-upload
 * 
 * Upload multiple product items at once.
 * - Splits content by newline
 * - Generates SHA-256 hash for each item
 * - Skips duplicates (existing contentHash)
 * - Returns count of added vs duplicates
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = bulkUploadSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: validation.error.errors[0].message,
                },
                { status: 400 }
            );
        }

        const { productId, content, metadata } = validation.data;

        // Verify product exists and belongs to seller
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found',
                },
                { status: 404 }
            );
        }

        // Split content by newlines and filter empty lines
        const lines = content
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);

        if (lines.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'EMPTY_CONTENT',
                    message: 'No valid items found in content',
                },
                { status: 400 }
            );
        }

        // Generate hashes for all items
        const itemsWithHash = lines.map((line: string) => ({
            content: line,
            contentHash: crypto.createHash('sha256').update(line).digest('hex'),
        }));

        // Check for existing hashes in database
        const existingHashes = await prisma.productItem.findMany({
            where: {
                contentHash: {
                    in: itemsWithHash.map((item) => item.contentHash),
                },
            },
            select: { contentHash: true },
        });

        const existingHashSet = new Set(existingHashes.map((h) => h.contentHash));

        // Filter out duplicates
        const newItems = itemsWithHash.filter(
            (item) => !existingHashSet.has(item.contentHash)
        );

        const duplicateCount = itemsWithHash.length - newItems.length;

        // Insert new items
        if (newItems.length > 0) {
            await prisma.productItem.createMany({
                data: newItems.map((item) => ({
                    productId,
                    content: encryptData(item.content), // Encrypt sensitive data
                    contentHash: item.contentHash, // Hash of RAW content for unique check
                    metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
                    isSold: false,
                })),
                skipDuplicates: true, // Extra safety
            });
        }

        return NextResponse.json({
            success: true,
            message: `Đã thêm thành công ${newItems.length} tài khoản${duplicateCount > 0 ? `, ${duplicateCount} tài khoản bị trùng đã bị loại bỏ` : ''
                }`,
            data: {
                total: itemsWithHash.length,
                added: newItems.length,
                duplicates: duplicateCount,
            },
        });
    } catch (error) {
        console.error('Bulk upload error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'UPLOAD_FAILED',
                message: 'Failed to upload items',
            },
            { status: 500 }
        );
    }
}
