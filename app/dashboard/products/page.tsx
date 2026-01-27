import { Package, Plus, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import ProductActions from './ProductActions';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export default async function ProductsPage() {
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

    // Role check (Optional, Middleware handles it but good for specific page logic)
    if (userRole !== 'SELLER' && userRole !== 'ADMIN') {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-white">Truy cập bị từ chối</h2>
                <p className="text-slate-400">Trang này chỉ dành cho người bán.</p>
                <Link href="/dashboard" className="text-blue-400 hover:underline mt-4 block">Quay lại Dashboard</Link>
            </div>
        );
    }

    // Fetch Products
    // We fetch items' isSold status to calculate stock/sold
    const productsRaw = await prisma.product.findMany({
        where: {
            sellerId: userId,
            status: { not: 'DELETED' }
        },
        include: {
            category: true,
            items: {
                select: { isSold: true }
            }
        },
        orderBy: { id: 'desc' }
    });

    // Process data
    const products = productsRaw.map(p => {
        const stock = p.items.filter(i => !i.isSold).length;
        const sold = p.items.filter(i => i.isSold).length;
        return {
            ...p,
            stock,
            sold,
            categoryName: p.category?.name || 'Chưa phân loại'
        };
    });

    const formatVND = (amount: any) => {
        return new Intl.NumberFormat('vi-VN').format(Number(amount));
    };

    const statusConfig: Record<string, any> = {
        ACTIVE: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', label: 'Đang bán' },
        HIDDEN: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', label: 'Tạm dừng' },
        DELETED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'Đã xóa' },
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Package className="text-purple-400" />
                        Quản lý sản phẩm
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Tạo, chỉnh sửa và quản lý sản phẩm của bạn.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/dashboard/inventory"
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Upload kho
                    </Link>
                    <Link
                        href="/dashboard/products/create"
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg flex items-center gap-2 transition-all"
                    >
                        <Plus size={18} />
                        Thêm sản phẩm
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-slate-400 text-sm">Tổng sản phẩm</p>
                    <p className="text-2xl font-bold text-white">{products.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <p className="text-green-400/80 text-sm">Đang bán</p>
                    <p className="text-2xl font-bold text-green-400">{products.filter(p => p.status === 'ACTIVE').length}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <p className="text-blue-400/80 text-sm">Tổng tồn kho</p>
                    <p className="text-2xl font-bold text-blue-400">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <p className="text-purple-400/80 text-sm">Đã bán</p>
                    <p className="text-2xl font-bold text-purple-400">{products.reduce((sum, p) => sum + p.sold, 0)}</p>
                </div>
            </div>

            {/* Products Table */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/30">
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Sản phẩm
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Danh mục
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Giá
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Tồn kho
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Đã bán
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                        Chưa có sản phẩm nào. Hãy tạo sản phẩm mới!
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="text-white font-medium">{product.name}</p>
                                                <p className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">{product.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-full">
                                                {product.categoryName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-white font-medium">
                                            {formatVND(product.price)}đ
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`font-medium ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-slate-300">
                                            {product.sold}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusConfig[product.status]?.bg || statusConfig.ACTIVE.bg} ${statusConfig[product.status]?.text || statusConfig.ACTIVE.text} ${statusConfig[product.status]?.border || statusConfig.ACTIVE.border}`}>
                                                {statusConfig[product.status]?.label || product.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <td className="px-4 py-4">
                                                <ProductActions product={product} />
                                            </td>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
