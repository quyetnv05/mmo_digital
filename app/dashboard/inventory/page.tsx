import { Upload } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import InventoryForm from '@/components/inventory/InventoryForm';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export default async function InventoryPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect('/auth/login');
    }

    let userId: number;
    let userRole: string;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
        userRole = decoded.role;
    } catch (e) {
        redirect('/auth/login');
    }

    if (userRole !== 'SELLER' && userRole !== 'ADMIN') {
        redirect('/dashboard');
    }

    // Fetch Products (Seller's only)
    // We need product list to select where to upload items to
    const productsRaw = await prisma.product.findMany({
        where: { sellerId: userId },
        include: {
            items: {
                select: { isSold: true }
            }
        },
        orderBy: { id: 'desc' }
    });

    const products = productsRaw.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.items.filter(i => !i.isSold).length
    }));

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Upload className="text-blue-400" />
                    Quản lý Kho hàng
                </h1>
                <p className="text-slate-400 mt-1">
                    Upload hàng loạt tài khoản vào kho. Hệ thống tự động loại bỏ các tài khoản trùng lặp.
                </p>
            </div>

            <InventoryForm products={products} />
        </div>
    );
}
