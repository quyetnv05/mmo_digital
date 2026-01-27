'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Wallet, Copy, CheckCircle, Clock, QrCode, Building2, CreditCard, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'react-hot-toast';

// Thông tin tài khoản lấy từ Env
const bankConfig = {
    id: process.env.NEXT_PUBLIC_BANK_ID || 'MB',
    accountNo: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0000000000',
    accountName: process.env.NEXT_PUBLIC_BANK_NAME || 'MMO USER',
    logo: '💳'
};

interface Transaction {
    id: number;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    createdAt: string;
    referenceCode: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DepositPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [copied, setCopied] = useState<string | null>(null);
    const [referenceCode, setReferenceCode] = useState<string | null>(null);
    const [isCreatingDeposit, setIsCreatingDeposit] = useState(false);
    const [qrUrl, setQrUrl] = useState<string>('');

    // Tự động làm mới lịch sử mỗi 10 giây để cập nhật trạng thái nạp tiền
    const { data: historyData, mutate: refreshHistory } = useSWR<{ success: boolean; data: Transaction[] }>(
        '/api/deposits',
        fetcher,
        { refreshInterval: 10000 }
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

    // Hàm tạo link ảnh QR code qua SePay
    const generateVietQR = useCallback(() => {
        if (!referenceCode) return "";

        const amountValue = parseInt(amount) || 0;
        let bankId = bankConfig.id;
        const accNo = bankConfig.accountNo;

        // Map common standard codes updates
        if (bankId.toLowerCase() === 'mb' || bankId.toLowerCase() === 'mbb') {
            bankId = 'MBBank';
        }

        // SePay: https://qr.sepay.vn/img?bank=<BANK>&acc=<ACC>&amount=<AMOUNT>&des=<DESC>
        return `https://qr.sepay.vn/img?acc=${accNo}&bank=${bankId}&amount=${amountValue}&des=${encodeURIComponent(referenceCode)}`;
    }, [amount, referenceCode]);

    // Update QR URL whenever amount or referenceCode changes
    useEffect(() => {
        if (!referenceCode) {
            setQrUrl('');
            return;
        }

        const originalUrl = generateVietQR();
        // Use internal proxy to bypass CORS/Hotlink protection
        const proxyUrl = `/api/qr?url=${encodeURIComponent(originalUrl)}`;

        console.log('Original QR URL:', originalUrl);
        console.log('Proxy QR URL:', proxyUrl);

        setQrUrl(proxyUrl);
    }, [amount, referenceCode, generateVietQR]);

    // Check if current Pending transaction became SUCCESS
    useEffect(() => {
        if (referenceCode) {
            const currentTx = transactions.find(tx => tx.referenceCode === referenceCode);
            if (currentTx && currentTx.status === 'SUCCESS') {
                toast.success('Nạp tiền thành công!');
                setReferenceCode(null);
                setAmount('');
                setQrUrl('');
            }
        }
    }, [transactions, referenceCode]);


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

    const checkPaid = () => {
        toast.loading('Đang kiểm tra giao dịch...');
        refreshHistory().then(() => {
            toast.dismiss();
            toast.success('Đã làm mới trạng thái');
        });
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
                <p className="text-slate-400 mt-1">Chuyển khoản đến {bankConfig.id} ({bankConfig.accountName}). Tiền cộng tự động sau 1-3 phút.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {/* Bank Selection - Simplified to single active bank */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-blue-400" /> Ngân hàng nhận
                        </h3>
                        <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-500/10 text-center w-40">
                            <span className="text-2xl mb-2 block">{bankConfig.logo}</span>
                            <span className="text-sm font-medium text-blue-400">{bankConfig.id}</span>
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
                            <div><p className="text-xs text-slate-500">Số tài khoản</p><p className="text-white font-medium text-lg">{bankConfig.accountNo}</p></div>
                            <button onClick={() => copyToClipboard(bankConfig.accountNo, 'account')}><Copy size={20} className="text-slate-400" /></button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div><p className="text-xs text-slate-500">Chủ tài khoản</p><p className="text-white font-medium text-lg">{bankConfig.accountName}</p></div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
                            <div><p className="text-xs text-amber-400/80">Nội dung chuyển khoản (BẮT BUỘC)</p><p className="text-amber-400 font-bold text-xl">{referenceCode || '...'}</p></div>
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
                        <div className="bg-white p-3 rounded-xl inline-block mb-6 shadow-lg relative min-h-[200px] flex items-center justify-center">
                            {qrUrl ? (
                                <a href={qrUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        key={qrUrl}
                                        src={qrUrl}
                                        alt="QR Code"
                                        className="w-48 h-48 block mx-auto"
                                        referrerPolicy="no-referrer"
                                    />
                                </a>
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center text-slate-400 bg-slate-100 mx-auto">
                                    <span className="text-xs text-slate-500 px-4">Chọn số tiền để hiện QR</span>
                                </div>
                            )}
                        </div>

                        {referenceCode && (
                            <div className="space-y-3">
                                <div className="text-green-400 font-bold text-2xl">{formatVND(parseInt(amount))}đ</div>
                                <button
                                    onClick={checkPaid}
                                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={20} />
                                    Đã chuyển khoản
                                </button>
                                <p className="text-xs text-slate-500">
                                    Hệ thống sẽ tự động cộng tiền sau 1-3 phút. <br />
                                    Nếu quá lâu, vui lòng liên hệ Admin.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Transaction History */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Clock size={16} /> Lịch sử gần đây</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
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