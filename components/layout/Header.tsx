'use client';

import { Bell, Search, Wallet, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useBalance } from '@/lib/hooks/useData';
import { useAuth } from '@/components/providers/AuthProvider';

interface HeaderProps {
    username: string;
}

export default function Header({ username }: HeaderProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { logout } = useAuth();

    // Use SWR for realtime balance updates
    const { balance, pendingBalance, isLoading } = useBalance();

    // Format currency VND
    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    return (
        <header className="sticky top-0 z-30 h-16 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-6 mr-8">
                    <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        Cửa hàng
                    </Link>
                    <Link href="/faq" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        Hỏi đáp
                    </Link>
                    <Link href="/dashboard/deposit" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        Nạp tiền
                    </Link>
                </nav>

                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg
                text-white placeholder-slate-500 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-4">
                    {/* Balance Cards - with loading state */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Available Balance */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                            <Wallet size={16} className="text-green-400" />
                            <div className="text-right">
                                <p className="text-[10px] text-green-400/80 uppercase tracking-wide">
                                    Khả dụng
                                </p>
                                <p className={`text-sm font-semibold text-green-400 ${isLoading ? 'animate-pulse' : ''}`}>
                                    {isLoading ? '...' : formatVND(balance)}
                                </p>
                            </div>
                        </div>

                        {/* Pending Balance */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
                            <TrendingUp size={16} className="text-amber-400" />
                            <div className="text-right">
                                <p className="text-[10px] text-amber-400/80 uppercase tracking-wide">
                                    Đang treo
                                </p>
                                <p className={`text-sm font-semibold text-amber-400 ${isLoading ? 'animate-pulse' : ''}`}>
                                    {isLoading ? '...' : formatVND(pendingBalance)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notification */}
                    <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <User size={16} className="text-white" />
                            </div>
                            <span className="hidden lg:block text-sm font-medium text-white">
                                {username}
                            </span>
                        </button>

                        {/* Dropdown Menu */}
                        {isProfileOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsProfileOpen(false)}
                                />
                                <div className="absolute right-0 top-12 z-50 w-48 py-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
                                    {/* Mobile Balance Display */}
                                    <div className="md:hidden px-4 py-2 border-b border-slate-700 mb-2">
                                        <p className="text-xs text-slate-500">Số dư</p>
                                        <p className="text-green-400 font-semibold">{formatVND(balance)}</p>
                                    </div>
                                    <a
                                        href="/dashboard/profile"
                                        className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50"
                                    >
                                        Hồ sơ
                                    </a>
                                    <a
                                        href="/dashboard/deposit"
                                        className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50"
                                    >
                                        Nạp tiền
                                    </a>
                                    <a
                                        href="/dashboard/settings"
                                        className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50"
                                    >
                                        Cài đặt
                                    </a>
                                    <hr className="my-2 border-slate-700" />
                                    <button
                                        onClick={() => logout()}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
