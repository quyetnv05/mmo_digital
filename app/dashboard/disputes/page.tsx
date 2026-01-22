'use client';

import { useState } from 'react';
import { AlertTriangle, MessageSquare, Clock, Send, CheckCircle, XCircle } from 'lucide-react';

interface Dispute {
    id: string;
    orderId: string;
    productName: string;
    reason: string;
    status: 'open' | 'pending' | 'resolved_refunded' | 'resolved_released';
    createdAt: string;
    amount: number;
}

export default function DisputesPage() {
    const [showNewDispute, setShowNewDispute] = useState(false);

    const disputes: Dispute[] = [
        {
            id: 'D001',
            orderId: '1232',
            productName: 'Tiktok Aged Account',
            reason: 'Tài khoản bị khóa sau 2 giờ sử dụng',
            status: 'open',
            createdAt: '2026-01-21 18:00',
            amount: 100000,
        },
        {
            id: 'D002',
            orderId: '1230',
            productName: 'Clone Facebook 2FA',
            reason: 'Tài khoản không đăng nhập được',
            status: 'resolved_refunded',
            createdAt: '2026-01-20 14:30',
            amount: 30000,
        },
    ];

    const statusConfig = {
        open: {
            bg: 'bg-amber-500/10',
            text: 'text-amber-400',
            border: 'border-amber-500/30',
            label: 'Đang mở',
            icon: <Clock size={14} />
        },
        pending: {
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            border: 'border-blue-500/30',
            label: 'Đang xử lý',
            icon: <MessageSquare size={14} />
        },
        resolved_refunded: {
            bg: 'bg-green-500/10',
            text: 'text-green-400',
            border: 'border-green-500/30',
            label: 'Đã hoàn tiền',
            icon: <CheckCircle size={14} />
        },
        resolved_released: {
            bg: 'bg-purple-500/10',
            text: 'text-purple-400',
            border: 'border-purple-500/30',
            label: 'Đã giải ngân',
            icon: <XCircle size={14} />
        },
    };

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="text-amber-400" />
                        Khiếu nại
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Quản lý và theo dõi các khiếu nại của bạn.
                    </p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <p className="text-amber-400/80 text-sm">Đang mở</p>
                    <p className="text-2xl font-bold text-amber-400">{disputes.filter(d => d.status === 'open').length}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <p className="text-blue-400/80 text-sm">Đang xử lý</p>
                    <p className="text-2xl font-bold text-blue-400">{disputes.filter(d => d.status === 'pending').length}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <p className="text-green-400/80 text-sm">Đã giải quyết</p>
                    <p className="text-2xl font-bold text-green-400">{disputes.filter(d => d.status.startsWith('resolved')).length}</p>
                </div>
            </div>

            {/* Disputes List */}
            <div className="space-y-4">
                {disputes.length === 0 ? (
                    <div className="text-center py-12 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <AlertTriangle className="mx-auto text-slate-600 mb-4" size={48} />
                        <p className="text-slate-400">Chưa có khiếu nại nào</p>
                    </div>
                ) : (
                    disputes.map((dispute) => (
                        <div
                            key={dispute.id}
                            className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 hover:border-slate-600 transition-colors"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-blue-400 font-medium">#{dispute.id}</span>
                                        <span className="text-slate-500">•</span>
                                        <span className="text-slate-400 text-sm">Đơn #{dispute.orderId}</span>
                                        <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${statusConfig[dispute.status].bg} ${statusConfig[dispute.status].text} ${statusConfig[dispute.status].border}`}>
                                            {statusConfig[dispute.status].icon}
                                            {statusConfig[dispute.status].label}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-medium">{dispute.productName}</h3>
                                    <p className="text-slate-400 text-sm mt-1">{dispute.reason}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                        <span>{dispute.createdAt}</span>
                                        <span>Giá trị: {formatVND(dispute.amount)}đ</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
                                        Xem chi tiết
                                    </button>
                                    {dispute.status === 'open' && (
                                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
                                            <Send size={14} />
                                            Gửi phản hồi
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* How Disputes Work */}
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-6">
                <h3 className="text-blue-400 font-semibold mb-3">💡 Quy trình khiếu nại</h3>
                <ol className="text-sm text-blue-300/80 space-y-2 list-decimal list-inside">
                    <li>Mở khiếu nại trong thời gian bảo hành (thường là 24h)</li>
                    <li>Tiền Escrow sẽ bị khóa, không giải ngân cho Seller</li>
                    <li>Admin sẽ xem xét và ra quyết định trong 24-48h</li>
                    <li>Nếu khiếu nại hợp lệ: Hoàn tiền cho Buyer</li>
                    <li>Nếu không hợp lệ: Giải ngân cho Seller</li>
                </ol>
            </div>
        </div>
    );
}
