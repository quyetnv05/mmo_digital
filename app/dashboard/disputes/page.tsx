import { AlertTriangle, MessageSquare, Clock, Send, CheckCircle, XCircle } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export default async function DisputesPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect('/auth/login');
    }

    let userId: number;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
    } catch (e) {
        redirect('/auth/login');
    }

    // Fetch Disputes from DB
    const disputes = await prisma.dispute.findMany({
        where: { openedBy: userId },
        include: {
            order: {
                include: {
                    product: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    });

    // Helper to format currency
    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    // Helper for Status Config (Badge Colors)
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'OPEN':
                return {
                    bg: 'bg-amber-500/10',
                    text: 'text-amber-400',
                    border: 'border-amber-500/30',
                    label: 'Đang mở',
                    icon: <Clock size={14} />
                };
            case 'RESOLVED_REFUNDED':
                return {
                    bg: 'bg-green-500/10',
                    text: 'text-green-400',
                    border: 'border-green-500/30',
                    label: 'Đã hoàn tiền',
                    icon: <CheckCircle size={14} />
                };
            case 'RESOLVED_RELEASED':
                return {
                    bg: 'bg-purple-500/10',
                    text: 'text-purple-400',
                    border: 'border-purple-500/30',
                    label: 'Đã giải ngân', // Means Buyer lost dispute
                    icon: <XCircle size={14} />
                };
            default:
                return {
                    bg: 'bg-slate-500/10',
                    text: 'text-slate-400',
                    border: 'border-slate-500/30',
                    label: status,
                    icon: <AlertTriangle size={14} />
                };
        }
    };

    // Calculate Stats
    // Schema Enum: OPEN, RESOLVED_REFUNDED, RESOLVED_RELEASED
    // Mapping: 
    // "Đang mở" = OPEN
    // "Đang xử lý" = (User requested this, but Schema has only OPEN. We can assume OPEN covers both or check logical status. Let's just use OPEN for both Pending/Processing conceptually or if we had a PROCESSING enum).
    // Let's filter strict Enums.

    const countOpen = disputes.filter(d => d.status === 'OPEN').length;
    // We treat 'RESOLVED' generally as concluded
    const countResolved = disputes.filter(d => d.status === 'RESOLVED_REFUNDED' || d.status === 'RESOLVED_RELEASED').length;
    // For "Đang xử lý" (Processing), since we lack the Enum, we'll display 0 or merge with Open. 
    // User requested "Đang mở (PENDING)" and "Đang xử lý (PROCESSING)".
    // If we only have OPEN, let's put countOpen in "Đang mở" and 0 in "Đang xử lý" to respect Schema, or maybe "Đang xử lý" is "OPEN" disputes that are assigned? 
    // I will set "Đang xử lý" to 0 for now as Schema doesn't support it, to avoid misrepresentation.
    const countProcessing = 0;

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
                    <p className="text-amber-400/80 text-sm">Đang mở (Pending)</p>
                    <p className="text-2xl font-bold text-amber-400">{countOpen}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <p className="text-blue-400/80 text-sm">Đang xử lý</p>
                    <p className="text-2xl font-bold text-blue-400">{countProcessing}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <p className="text-green-400/80 text-sm">Đã giải quyết</p>
                    <p className="text-2xl font-bold text-green-400">{countResolved}</p>
                </div>
            </div>

            {/* Disputes List */}
            <div className="space-y-4">
                {disputes.length === 0 ? (
                    <div className="text-center py-12 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <AlertTriangle className="mx-auto text-slate-600 mb-4" size={48} />
                        <p className="text-slate-400">Bạn chưa có khiếu nại nào</p>
                    </div>
                ) : (
                    disputes.map((dispute) => {
                        const status = getStatusConfig(dispute.status);
                        return (
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
                                            <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
                                        </div>
                                        <h3 className="text-white font-medium">{dispute.order.product.name}</h3>
                                        <p className="text-slate-400 text-sm mt-1">{dispute.reason}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                            <span>{new Date(dispute.createdAt).toLocaleString('vi-VN')}</span>
                                            <span>Giá trị: {formatVND(Number(dispute.order.totalPrice))}đ</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Client Component Button or Link */}
                                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
                                            Xem chi tiết
                                        </button>
                                        {dispute.status === 'OPEN' && (
                                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
                                                <Send size={14} />
                                                Gửi phản hồi
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
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

