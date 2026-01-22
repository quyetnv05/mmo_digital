'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { Wallet, Copy, CheckCircle, Clock, QrCode, Building2, CreditCard, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'react-hot-toast';

// Thông tin tài khoản MB Bank của bạn
const banks = [
    { id: 'MB', name: 'MB Bank', logo: '💳', accountNo: '6124022005', accountName: 'NGUYEN VAN QUYET' },
];

interface Transaction {
    id: number;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED'; // Khớp với Prisma Enum
    createdAt: string;
    referenceCode: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DepositPage() {
    const { user } = useAuth();
    const [selectedBank, setSelectedBank] = useState(banks[0]);
    const [amount, setAmount] = useState('');
    const [copied, setCopied] = useState<string | null>(null);
    const [referenceCode, setReferenceCode] = useState<string | null>(null);
    const [isCreatingDeposit, setIsCreatingDeposit] = useState(false);

    // Tự động làm mới lịch sử mỗi 30 giây để cập nhật trạng thái nạp tiền
    const { data: historyData, mutate: refreshHistory } = useSWR<{ success: boolean; data: Transaction[] }>(
        '/api/deposits',
        fetcher,
        { refreshInterval: 30000 }
    );

    const transactions = historyData?.data || [];

    // Tự động lấy referenceCode từ giao dịch đang chờ mới nhất
    useEffect(() => {
        if (!referenceCode && transactions.length > 0) {
            const pendingTx = transactions.find(tx => tx.status === 'PENDING');
            if (pendingTx && pendingTx.referenceCode) {
                setReferenceCode(pendingTx.referenceCode);
                setAmount(pendingTx.amount.toString());
            }
        }
    }, [transactions, referenceCode]);

    // Hàm tạo link ảnh VietQR chuẩn nhất cho MB Bank
    const generateVietQR = useCallback(() => {
        if (!referenceCode) return ""; // Không có mã thì không hiện ảnh lỗi

        const bank = selectedBank;
        const amountValue = parseInt(amount) || 0;

        // Cấu trúc URL chuẩn: mbb-stk-compact2.jpg
        return `https://img.vietqr.io/image/${bank.id}-${bank.accountNo}-compact2.jpg?amount=${amountValue}&addInfo=${referenceCode}&accountName=${encodeURIComponent(bank.accountName)}`;
    }, [selectedBank, amount, referenceCode]);

    const createDepositRequest = useCallback(async (depositAmount: number) => {
        if (depositAmount < 10000) {
            toast.error('Số tiền tối thiểu là 10.000đ');
            return;
        }

        setIsCreatingDeposit(true);
        try {
            const res = await fetch('/api/deposits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: depositAmount })
            });
            const data = await res.json();

            if (data.success) {
                setReferenceCode(data.data.referenceCode);
                refreshHistory();
            } else {
                toast.error(data.error || 'Không thể tạo yêu cầu nạp tiền');
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setIsCreatingDeposit(false);
        }
    }, [refreshHistory]);

    const handleAmountSelect = (amt: number) => {
        setAmount(amt.toString());
        setReferenceCode(null);
        createDepositRequest(amt);
    };

    const handleAmountChange = (value: string) => {
        setAmount(value);
        setReferenceCode(null);
    };

    const handleAmountConfirm = () => {
        const amt = parseInt(amount);
        if (amt >= 10000) {
            createDepositRequest(amt);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        toast.success('Đã sao chép!');
        setTimeout(() => setCopied(null), 2000);
    };

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    const statusColors: any = {
        PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Đang chờ' },
        SUCCESS: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', label: 'Thành công' },
        FAILED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'Thất bại' },
    };

    const quickAmounts = [10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Wallet className="text-green-400" />
                    Nạp tiền
                </h1>
                <p className="text-slate-400 mt-1">Chuyển khoản đến MB Bank. Tiền cộng tự động sau 1-3 phút.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {/* Bank Selection */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-blue-400" /> Chọn ngân hàng
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {banks.map((bank) => (
                                <button
                                    key={bank.id}
                                    className="p-4 rounded-lg border-2 border-blue-500 bg-blue-500/10 text-center"
                                >
                                    <span className="text-2xl mb-2 block">{bank.logo}</span>
                                    <span className="text-sm font-medium text-blue-400">{bank.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount Selection */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-green-400" /> Số tiền nạp
                        </h3>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                            {quickAmounts.map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => handleAmountSelect(amt)}
                                    disabled={isCreatingDeposit}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${amount === amt.toString() ? 'bg-green-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                                >
                                    {formatVND(amt)}đ
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                onBlur={handleAmountConfirm}
                                placeholder="Nhập số tiền khác..."
                                className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-lg"
                            />
                        </div>
                    </div>

                    {/* Transfer Details */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div><p className="text-xs text-slate-500">Số tài khoản</p><p className="text-white font-medium text-lg">{selectedBank.accountNo}</p></div>
                            <button onClick={() => copyToClipboard(selectedBank.accountNo, 'account')}><Copy size={20} className="text-slate-400" /></button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
                            <div><p className="text-xs text-amber-400/80">Nội dung chuyển khoản (BẮT BUỘC)</p><p className="text-amber-400 font-bold text-xl">{referenceCode || 'Chọn số tiền...'}</p></div>
                            {referenceCode && <button onClick={() => copyToClipboard(referenceCode, 'content')}><Copy size={20} className="text-amber-400" /></button>}
                        </div>
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="space-y-4">
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6 text-center">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                            <QrCode size={20} className="text-purple-400" /> Quét mã VietQR
                        </h3>
                        <div className="bg-white p-3 rounded-xl inline-block mb-4 shadow-lg">
                            {referenceCode ? (
                                <img src={generateVietQR()} alt="QR" className="w-48 h-48" />
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center text-slate-400 bg-slate-100">Chọn số tiền</div>
                            )}
                        </div>
                        {amount && <div className="mt-2 text-green-400 font-bold text-lg">{formatVND(parseInt(amount))}đ</div>}
                    </div>

                    {/* Transaction History */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Clock size={16} /> Lịch sử gần đây</h3>
                        <div className="space-y-2">
                            {transactions.length === 0 ? <p className="text-xs text-slate-500 text-center py-2">Chưa có giao dịch</p> :
                                transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-2 bg-slate-900/30 rounded-lg">
                                        <div className="text-xs">
                                            <p className="font-bold text-white">+{formatVND(tx.amount)}đ</p>
                                            <p className="text-slate-500">{tx.referenceCode}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${statusColors[tx.status]?.bg} ${statusColors[tx.status]?.text} ${statusColors[tx.status]?.border}`}>
                                            {statusColors[tx.status]?.label}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}