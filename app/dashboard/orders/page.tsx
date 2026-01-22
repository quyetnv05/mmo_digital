'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ShoppingCart, Eye, Copy, CheckCircle, Clock, AlertTriangle, Package, Download, Loader2 } from 'lucide-react';

interface OrderItem {
    id: number;
    content: string;
}

interface Order {
    id: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    status: 'completed' | 'pending' | 'disputed' | 'refunded';
    escrowDeadline: string;
    createdAt: string;
    items: OrderItem[];
}

// Countdown component
function EscrowCountdown({ deadline }: { deadline: string }) {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const diff = deadlineTime - now;

    if (diff <= 0) {
        return <span className="text-green-400 text-xs">Đã giải ngân</span>;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return (
        <span className="text-amber-400 text-xs flex items-center gap-1">
            <Clock size={12} />
            {hours}h {minutes}m còn lại
        </span>
    );
}

// Order Detail Modal
function OrderDetailModal({
    order,
    onClose,
}: {
    order: Order;
    onClose: () => void;
}) {
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);

    const copyItem = (content: string, id: number) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const copyAll = () => {
        const allContent = order.items.map((item) => item.content).join('\n');
        navigator.clipboard.writeText(allContent);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Chi tiết đơn #{order.id}</h3>
                        <p className="text-sm text-slate-400">{order.productName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.open(`/api/orders/${order.id}/download`, '_blank')}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors border border-slate-600"
                        >
                            <Download size={16} />
                            Tải .txt
                        </button>
                        <button
                            onClick={copyAll}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                        >
                            {copiedAll ? <CheckCircle size={16} /> : <Copy size={16} />}
                            {copiedAll ? 'Đã copy!' : 'Copy tất cả'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                    {order.items.map((item, index) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg group hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500 text-sm w-6">{index + 1}.</span>
                                <code className="text-sm text-green-400 font-mono">{item.content}</code>
                            </div>
                            <button
                                onClick={() => copyItem(item.content, item.id)}
                                className="p-2 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                            >
                                {copiedId === item.id ? (
                                    <CheckCircle size={16} className="text-green-400" />
                                ) : (
                                    <Copy size={16} />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 flex justify-between items-center">
                <EscrowCountdown deadline={order.escrowDeadline} />
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Đóng
                </button>
            </div>
        </div>
    );
}

export default function OrdersPage() {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const fetcher = (url: string) => fetch(url).then((res) => res.json());
    const { data, isLoading } = useSWR('/api/orders', fetcher);
    const orders: Order[] = data?.data || [];

    const statusColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
        completed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', label: 'Hoàn thành' },
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Đang xử lý' },
        disputed: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'Khiếu nại' },
        refunded: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', label: 'Hoàn tiền' },
    };

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="text-blue-400" />
                    Đơn hàng của tôi
                </h1>
                <p className="text-slate-400 mt-1">
                    Quản lý đơn hàng và xem chi tiết tài khoản đã mua.
                </p>
            </div>

            {/* Orders Table */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/30">
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Mã đơn
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Sản phẩm
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    SL
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Tổng tiền
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Bảo hành
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-4 py-4 text-sm font-medium text-blue-400">
                                        #{order.id}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Package size={16} className="text-slate-500" />
                                            <span className="text-sm text-white">{order.productName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-300">
                                        {order.quantity}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-white font-medium">
                                        {formatVND(order.totalPrice)}đ
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusColors[order.status].bg} ${statusColors[order.status].text} ${statusColors[order.status].border}`}>
                                            {statusColors[order.status].label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <EscrowCountdown deadline={order.escrowDeadline} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {order.status === 'completed' && (
                                                <button
                                                    className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                    title="Khiếu nại"
                                                >
                                                    <AlertTriangle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
}
