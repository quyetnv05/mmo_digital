'use client';

import { Edit as EditIcon, Eye as EyeIcon, EyeOff as EyeOffIcon, Trash2 as TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface ProductActionsProps {
    product: {
        id: number;
        name: string;
        status: string;
    };
}

export default function ProductActions({ product }: ProductActionsProps) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);

    const toggleStatus = async () => {
        setIsUpdating(true);
        const nextStatus = product.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';

        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });
            const data = await res.json();

            if (data.success) {
                toast.success(nextStatus === 'ACTIVE' ? 'Đã mở bán sản phẩm' : 'Đã ẩn sản phẩm');
                router.refresh();
            } else {
                toast.error(data.error || 'Lỗi cập nhật');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"? (Sản phẩm sẽ biến mất khỏi danh sách nhưng vẫn lưu trong lịch sử hệ thống)`)) return;

        setIsUpdating(true);
        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DELETED' })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Đã xóa sản phẩm');
                router.refresh();
            } else {
                toast.error(data.error || 'Lỗi khi xóa');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex items-center gap-1">
            <Link
                href={`/products/${product.id}`}
                target="_blank"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Xem trên cửa hàng"
            >
                <EyeIcon size={16} />
            </Link>

            <button
                onClick={toggleStatus}
                disabled={isUpdating}
                className={`p-2 transition-colors rounded-lg ${product.status === 'ACTIVE'
                    ? 'text-green-400 hover:bg-green-500/10'
                    : 'text-amber-400 hover:bg-amber-500/10'
                    }`}
                title={product.status === 'ACTIVE' ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
            >
                {product.status === 'ACTIVE' ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
            </button>

            <Link
                href={`/dashboard/products/edit/${product.id}`}
                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                title="Sửa"
            >
                <EditIcon size={16} />
            </Link>

            <button
                onClick={handleDelete}
                disabled={isUpdating}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                title="Xóa"
            >
                <TrashIcon size={16} />
            </button>
        </div>
    );
}
