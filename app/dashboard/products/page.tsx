'use client';

import { useState } from 'react';
import { Package, Plus, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import Link from 'next/link';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    warrantyHours: number;
    status: 'active' | 'inactive' | 'deleted';
    stock: number;
    sold: number;
    category: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([
        { id: 1, name: 'Clone Facebook 2FA', description: 'Tài khoản đã xác minh danh tính', price: 15000, warrantyHours: 24, status: 'active', stock: 150, sold: 1234, category: 'Facebook' },
        { id: 2, name: 'Gmail PVA', description: 'Phone Verified Account', price: 5000, warrantyHours: 48, status: 'active', stock: 500, sold: 3456, category: 'Gmail' },
        { id: 3, name: 'Tiktok Aged Account', description: 'Tài khoản 6 tháng tuổi', price: 20000, warrantyHours: 24, status: 'active', stock: 75, sold: 567, category: 'Tiktok' },
        { id: 4, name: 'Instagram HQ', description: 'High Quality Profile', price: 12000, warrantyHours: 24, status: 'inactive', stock: 0, sold: 123, category: 'Instagram' },
    ]);

    const statusConfig = {
        active: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', label: 'Đang bán' },
        inactive: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', label: 'Tạm dừng' },
        deleted: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'Đã xóa' },
    };

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
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
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg flex items-center gap-2 transition-all">
                        <Plus size={18} />
                        Thêm sản phẩm
                    </button>
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
                    <p className="text-2xl font-bold text-green-400">{products.filter(p => p.status === 'active').length}</p>
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
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-4 py-4">
                                        <div>
                                            <p className="text-white font-medium">{product.name}</p>
                                            <p className="text-slate-500 text-xs mt-0.5">{product.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="px-2 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-full">
                                            {product.category}
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
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusConfig[product.status].bg} ${statusConfig[product.status].text} ${statusConfig[product.status].border}`}>
                                            {statusConfig[product.status].label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1">
                                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Xem">
                                                <Eye size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Sửa">
                                                <Edit size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Xóa">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
