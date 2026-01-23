import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { uploadToCloudinary } from '@/lib/cloudinary';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

/**
 * POST /api/upload
 * Upload image file to Cloudinary and return URL
 * 
 * Form data: file (image)
 * Returns: { success: true, url: 'https://res.cloudinary.com/...' }
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Auth check
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded.userId) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        // 2. Parse form data
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        // 3. Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid file type. Only JPEG, PNG, GIF, WEBP allowed'
            }, { status: 400 });
        }

        // 4. Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({
                success: false,
                error: 'File too large. Max 5MB allowed'
            }, { status: 400 });
        }

        // 5. Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 6. Upload to Cloudinary
        const result = await uploadToCloudinary(buffer, 'mmo-digital/products');

        return NextResponse.json({
            success: true,
            url: result.url,
            publicId: result.publicId
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Upload failed'
        }, { status: 500 });
    }
}
