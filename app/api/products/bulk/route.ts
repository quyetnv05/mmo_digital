
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashContent } from '@/lib/crypto';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: Request) {
    try {
        // 1. Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded || !decoded.userId) return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });

        // 2. Input Validation
        const body = await req.json();
        const { rawText, productId } = body;

        if (!rawText || !productId) {
            return NextResponse.json({ success: false, error: 'Missing rawText or productId' }, { status: 400 });
        }

        // Verify product belongs to seller
        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId) },
        });

        if (!product || product.sellerId !== decoded.userId) {
            return NextResponse.json({ success: false, error: 'Invalid Product or access denied' }, { status: 403 });
        }

        // 3. Processing
        const lines = rawText.split('\n');
        let addedCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;

        // Detect delimiter based on product format
        // Default to '|' if not specified or unrecognized
        let delimiter = '|';
        if (product.format) {
            if (product.format.includes('|')) delimiter = '|';
            else if (product.format.includes(':')) delimiter = ':';
            else if (product.format.includes(';')) delimiter = ';';
        }

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
                // Split by detected delimiter
                const parts = trimmedLine.split(delimiter).map((p: string) => p.trim());
                const content = parts[0];

                if (!content) {
                    errorCount++;
                    continue;
                }

                // Check duplicate content globally or per product? Schema says contentHash is @unique globally.
                const contentHash = hashContent(content);

                // Try to find existing item with this hash
                const existing = await prisma.productItem.findUnique({
                    where: { contentHash }
                });

                if (existing) {
                    duplicateCount++;
                    continue; // Skip duplicate
                }

                // Create Item
                await prisma.productItem.create({
                    data: {
                        productId: parseInt(productId),
                        content: content,
                        contentHash: contentHash,
                        metadata: parts.length > 1 ? {
                            info: parts.slice(1).join(' | '),
                            imported_price: parts[1] // Store for reference
                        } : undefined,
                    }
                });
                addedCount++;

            } catch (err) {
                console.error('Error processing line:', trimmedLine, err);
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                added: addedCount,
                duplicates: duplicateCount,
                errors: errorCount
            }
        });

    } catch (error) {
        console.error('Bulk upload error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
