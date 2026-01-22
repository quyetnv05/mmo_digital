
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { CheckCircle, XCircle, Clock, Search, AlertCircle, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Withdrawal {
    id: number;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    createdAt: string;
    user: {
        username: string;
        balance: string;
    };
}

export default function AdminWithdrawalsPage() {
    const { data, mutate } = useSWR('/api/withdrawals', fetcher);
    // data.data is the list

    const [isProcessing, setIsProcessing] = useState<number | null>(null);
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleAction = async (id: number, action: 'APPROVE' | 'REJECT', reason?: string) => {
        if (!confirm(`Bạn có chắc chắn muốn ${action === 'APPROVE' ? 'DUYỆT' : 'TỪ CHỐI'} yêu cầu #${id}?`)) return;

        setIsProcessing(id);
        try {
            const res = await fetch('/api/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, id, reason }),
            });
            const result = await res.json();
            if (result.success) {
                alert('Thành công!');
                mutate();
                setRejectId(null);
                setRejectReason('');
            } else {
                alert('Lỗi: ' + result.error);
            }
        } catch (error) {
            alert('Lỗi kết nối');
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Quản lý Rút tiền</h1>
                <p className="text-slate-400">Duyệt yêu cầu rút tiền từ Seller.</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr className="border-b border-slate-700 text-slate-400 text-left text-sm">
                                <th className="px-6 py-4 font-medium">ID</th>
                                <th className="px-6 py-4 font-medium">Seller</th>
                                <th className="px-6 py-4 font-medium">Số tiền</th>
                                <th className="px-6 py-4 font-medium">Ngân hàng</th>
                                <th className="px-6 py-4 font-medium">Trạng thái</th>
                                <th className="px-6 py-4 font-medium">Ngày tạo</th>
                                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {data?.data?.map((w: Withdrawal) => (
                                <tr key={w.id} className="text-sm hover:bg-slate-700/30">
                                    <td className="px-6 py-4 text-slate-300">#{w.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-white font-medium">{w.user.username}</div>
                                        <div className="text-xs text-slate-500">
                                            Dư: {Number(w.user.balance).toLocaleString()} đ
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-green-400 font-bold">
                                        {Number(w.amount).toLocaleString()} đ
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        <p>{w.bankName}</p>
                                        <p className="text-xs text-slate-500">{w.accountNumber}</p>
                                        <p className="text-xs text-slate-500">{w.accountName}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
                                            ${w.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                                w.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                                            {w.status}
                                        </span>
                                        {w.rejectionReason && (
                                            <p className="text-xs text-red-400 mt-1 max-w-[150px] truncate" title={w.rejectionReason}>
                                                Lý do: {w.rejectionReason}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(w.createdAt).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {w.status === 'PENDING' && (
                                            <div className="flex items-center justify-end gap-2">
                                                {rejectId === w.id ? (
                                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                                                        <input
                                                            autoFocus
                                                            placeholder="Lý do từ chối..."
                                                            className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white w-32"
                                                            value={rejectReason}
                                                            onChange={e => setRejectReason(e.target.value)}
                                                        />
                                                        <button
                                                            onClick={() => handleAction(w.id, 'REJECT', rejectReason)}
                                                            className="p-1 bg-red-600 rounded hover:bg-red-500 text-white"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectId(null)}
                                                            className="p-1 bg-slate-600 rounded hover:bg-slate-500 text-white"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(w.id, 'APPROVE')}
                                                            disabled={isProcessing === w.id}
                                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                                                        >
                                                            {isProcessing === w.id ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle size={12} />}
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => { setRejectId(w.id); setRejectReason(''); }}
                                                            disabled={isProcessing === w.id}
                                                            className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-600/30 text-xs font-medium rounded transition-colors flex items-center gap-1"
                                                        >
                                                            <XCircle size={12} />
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
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
