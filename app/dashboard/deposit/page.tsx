'use client';

import { useState, useEffect } from 'react';
import { Wallet, Copy, CheckCircle, Clock, QrCode, Building2, CreditCard } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

// Bank list for deposits
const banks = [
    { id: 'vcb', name: 'Vietcombank', logo: '🏦', accountNo: '1234567890', accountName: 'MMO DIGITAL' },
    { id: 'tcb', name: 'Techcombank', logo: '🏛️', accountNo: '0987654321', accountName: 'MMO DIGITAL' },
    { id: 'mb', name: 'MB Bank', logo: '💳', accountNo: '1122334455', accountName: 'MMO DIGITAL' },
    { id: 'acb', name: 'ACB', logo: '🏧', accountNo: '5566778899', accountName: 'MMO DIGITAL' },
];

interface Transaction {
    id: string;
    amount: number;
    status: 'pending' | 'success' | 'failed';
    createdAt: string;
    referenceCode: string;
}

export default function DepositPage() {
    const { user } = useAuth();
    const userId = user?.id || 0;
    const [selectedBank, setSelectedBank] = useState(banks[0]);
    const [amount, setAmount] = useState('');
    const [copied, setCopied] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([
        { id: '1', amount: 500000, status: 'success', createdAt: '2026-01-21 20:30', referenceCode: `NAP ${userId}` },
    ]);

    const transferContent = `NAP ${userId}`;

    // Generate VietQR URL
    const generateVietQR = () => {
        const bank = selectedBank;
        const amountValue = parseInt(amount) || 0;
        // VietQR format: bank code, account number, amount, content
        return `https://img.vietqr.io/image/${bank.id}-${bank.accountNo}-compact2.png?amount=${amountValue}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bank.accountName)}`;
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const statusColors = {
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Đang chờ' },
        success: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', label: 'Thành công' },
        failed: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'Thất bại' },
    };

    const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Wallet className="text-green-400" />
                    Nạp tiền
                </h1>
                <p className="text-slate-400 mt-1">
                    Chuyển khoản đến tài khoản bên dưới. Tiền sẽ được cộng tự động sau 1-3 phút.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Bank Selection & Amount */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Bank Selection */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-blue-400" />
                            Chọn ngân hàng
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {banks.map((bank) => (
                                <button
                                    key={bank.id}
                                    onClick={() => setSelectedBank(bank)}
                                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center
                    ${selectedBank.id === bank.id
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                                        }`}
                                >
                                    <span className="text-2xl mb-2 block">{bank.logo}</span>
                                    <span className={`text-sm font-medium ${selectedBank.id === bank.id ? 'text-blue-400' : 'text-slate-300'}`}>
                                        {bank.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount Selection */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-green-400" />
                            Số tiền nạp
                        </h3>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                            {quickAmounts.map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setAmount(amt.toString())}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all
                    ${amount === amt.toString()
                                            ? 'bg-green-500 text-white'
                                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    {formatVND(amt)}đ
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Hoặc nhập số tiền khác..."
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
                text-white text-lg font-medium placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                        />
                    </div>

                    {/* Transfer Info */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Thông tin chuyển khoản</h3>

                        <div className="space-y-4">
                            {/* Bank Name */}
                            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                <div>
                                    <p className="text-xs text-slate-500">Ngân hàng</p>
                                    <p className="text-white font-medium">{selectedBank.name}</p>
                                </div>
                            </div>

                            {/* Account Number */}
                            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                <div>
                                    <p className="text-xs text-slate-500">Số tài khoản</p>
                                    <p className="text-white font-medium text-lg">{selectedBank.accountNo}</p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(selectedBank.accountNo, 'account')}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    {copied === 'account' ? <CheckCircle size={20} className="text-green-400" /> : <Copy size={20} />}
                                </button>
                            </div>

                            {/* Account Name */}
                            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                <div>
                                    <p className="text-xs text-slate-500">Tên tài khoản</p>
                                    <p className="text-white font-medium">{selectedBank.accountName}</p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(selectedBank.accountName, 'name')}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    {copied === 'name' ? <CheckCircle size={20} className="text-green-400" /> : <Copy size={20} />}
                                </button>
                            </div>

                            {/* Transfer Content - IMPORTANT */}
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
                                <div>
                                    <p className="text-xs text-amber-400/80">Nội dung chuyển khoản (BẮT BUỘC)</p>
                                    <p className="text-amber-400 font-bold text-xl">{transferContent}</p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(transferContent, 'content')}
                                    className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                                >
                                    {copied === 'content' ? <CheckCircle size={20} className="text-green-400" /> : <Copy size={20} />}
                                </button>
                            </div>

                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <p className="text-red-400 text-sm">
                                    ⚠️ <strong>Lưu ý:</strong> Ghi đúng nội dung <code className="bg-red-500/20 px-1 rounded">{transferContent}</code> để hệ thống tự động cộng tiền. Sai nội dung sẽ không được xử lý tự động.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - QR Code & History */}
                <div className="space-y-4">
                    {/* VietQR Code */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6 text-center">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                            <QrCode size={20} className="text-purple-400" />
                            Quét mã VietQR
                        </h3>

                        <div className="bg-white p-3 rounded-xl inline-block mb-4">
                            <img
                                src={generateVietQR()}
                                alt="VietQR Code"
                                className="w-48 h-48 object-contain"
                            />
                        </div>

                        <p className="text-sm text-slate-400">
                            Quét mã bằng ứng dụng ngân hàng để chuyển khoản nhanh
                        </p>

                        {amount && (
                            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <p className="text-green-400 font-semibold text-lg">
                                    {formatVND(parseInt(amount))}đ
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Recent Deposits */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <Clock size={16} className="text-slate-400" />
                            Lịch sử nạp gần đây
                        </h3>

                        <div className="space-y-2">
                            {transactions.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">Chưa có giao dịch nào</p>
                            ) : (
                                transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-2 bg-slate-900/30 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-white">+{formatVND(tx.amount)}đ</p>
                                            <p className="text-xs text-slate-500">{tx.createdAt}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[tx.status].bg} ${statusColors[tx.status].text} ${statusColors[tx.status].border}`}>
                                            {statusColors[tx.status].label}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <a href="/dashboard/orders?type=deposit" className="block mt-3 text-center text-sm text-blue-400 hover:text-blue-300">
                            Xem tất cả →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
