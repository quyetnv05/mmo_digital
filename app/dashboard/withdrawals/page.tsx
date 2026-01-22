
'use client';

import { useState, useEffect } from 'react';
import { CreditCard, History, AlertCircle, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface WithdrawalRequest {
    id: number;
    amount: number;
    bankName: string;
    accountNumber: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    createdAt: string;
}

export default function WithdrawalPage() {
    const { data: user } = useSWR('/api/auth/me', fetcher);
    // We'll implement GET /api/transactions/withdrawals later or use transactions?
    // Let's create a dedicated API for withdrawals: /api/withdrawals
    const { data: withdrawals, mutate } = useSWR('/api/withdrawals', fetcher);

    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(amount),
                    bankName,
                    accountNumber,
                    accountName
                }),
            });
            const data = await res.json();

            if (data.success) {
                alert('Yêu cầu rút tiền thành công!');
                mutate(); // Refresh list
                setAmount('');
            } else {
                setError(data.error || 'Lỗi xử lý');
            }
        } catch (err) {
            setError('Lỗi kết nối');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="text-blue-400" />
                    Rút tiền
                </h1>
                <p className="text-slate-400 mt-1">
                    Yêu cầu rút doanh thu về tài khoản ngân hàng.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Request Form */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Tạo yêu cầu mới</h2>

                        <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
                            <p className="text-sm text-slate-400">Số dư khả dụng</p>
                            <p className="text-2xl font-bold text-green-400">
                                {new Intl.NumberFormat('vi-VN').format(user?.user?.balance || 0)} đ
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Số tiền muốn rút</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Min: 50,000"
                                    min="50000"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Ngân hàng</label>
                                <select
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    required
                                >
                                    <option value="">Chọn ngân hàng</option>
                                    <option value="VCB">Vietcombank</option>
                                    <option value="MB">MB Bank</option>
                                    <option value="TCB">Techcombank</option>
                                    <option value="ACB">ACB</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Số tài khoản</label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Tên chủ tài khoản</label>
                                <input
                                    type="text"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Gửi yêu cầu'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <History size={20} className="text-slate-400" />
                            Lịch sử rút tiền
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700 text-slate-400 text-left text-sm">
                                        <th className="pb-3 font-medium">Mã</th>
                                        <th className="pb-3 font-medium">Số tiền</th>
                                        <th className="pb-3 font-medium">Ngân hàng</th>
                                        <th className="pb-3 font-medium">Trạng thái</th>
                                        <th className="pb-3 font-medium">Ngày tạo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {withdrawals?.data?.map((w: any) => (
                                        <tr key={w.id} className="text-sm">
                                            <td className="py-3 text-slate-300">#{w.id}</td>
                                            <td className="py-3 text-white font-medium">
                                                {new Intl.NumberFormat('vi-VN').format(w.amount)} đ
                                            </td>
                                            <td className="py-3 text-slate-300">
                                                {w.bankName} - {w.accountNumber}
                                            </td>
                                            <td className="py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
                                                    ${w.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                                        w.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                                            'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                                                    {w.status === 'APPROVED' && <CheckCircle size={12} />}
                                                    {w.status === 'REJECTED' && <XCircle size={12} />}
                                                    {w.status === 'PENDING' && <Clock size={12} />}
                                                    {w.status}
                                                </span>
                                                {w.rejectionReason && (
                                                    <p className="text-xs text-red-400 mt-1">{w.rejectionReason}</p>
                                                )}
                                            </td>
                                            <td className="py-3 text-slate-500">
                                                {new Date(w.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                        </tr>
                                    ))}
                                    {!withdrawals?.data?.length && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-500">
                                                Chưa có giao dịch nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
