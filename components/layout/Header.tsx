'use client';

import {
    Bell,
    Search,
    Wallet,
    Store,
    User,
    MessageCircle,
    Menu,
    LogIn,
    LayoutDashboard,
    LogOut,
    X,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
    username?: string;
}

interface Notification {
    id: string;
    text: string;
    type: 'DEPOSIT' | 'SYSTEM';
    time: Date;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Header({ username }: HeaderProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [hasNewNotifications, setHasNewNotifications] = useState(false);
    const { data: session, status } = useSession();

    // Use ref to track previous balance for comparison
    const prevBalanceRef = useRef<number | null>(null);

    // Load notifications from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Convert string dates back to Date objects
                const formatted = parsed.map((n: any) => ({
                    ...n,
                    time: new Date(n.time)
                }));
                setNotifications(formatted);

                // Check if there are any unread ones (simple check: if any exist and dot wasn't cleared)
                const dotStatus = localStorage.getItem('notifications_dot');
                if (dotStatus === 'true') {
                    setHasNewNotifications(true);
                }
            } catch (e) {
                console.error('Failed to parse notifications', e);
            }
        }
    }, []);

    // Save notifications to localStorage when they change
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    // Track dot status in localStorage
    useEffect(() => {
        localStorage.setItem('notifications_dot', hasNewNotifications.toString());
    }, [hasNewNotifications]);

    // Real-time Balance Polling
    const { data: balanceData, isLoading: isBalanceLoading } = useSWR(
        session?.user ? '/api/user/balance' : null,
        fetcher,
        {
            refreshInterval: 10000,
            revalidateOnFocus: true,
            dedupingInterval: 5000,
        }
    );

    const balance = balanceData?.balance ? Number(balanceData.balance) : (session?.user as any)?.balance ?? 0;
    const isLoading = status === 'loading' || (session?.user && isBalanceLoading && balanceData === undefined);

    // Unread Messages Polling
    const { data: messagesData } = useSWR(
        session?.user ? '/api/messages/unread-count' : null,
        fetcher,
        {
            refreshInterval: 15000,
            revalidateOnFocus: true,
        }
    );

    const unreadMessagesCount = messagesData?.count ?? 0;

    // Detect Balance Increase & Add Notification
    useEffect(() => {
        if (balanceData?.success && prevBalanceRef.current !== null) {
            if (balance > prevBalanceRef.current) {
                // Add success notification
                const newNotif: Notification = {
                    id: Math.random().toString(36).substring(7),
                    text: 'Nạp tiền thành công',
                    type: 'DEPOSIT',
                    time: new Date()
                };
                setNotifications(prev => [newNotif, ...prev]);
                setHasNewNotifications(true);
            }
        }
        if (balanceData?.success) {
            prevBalanceRef.current = balance;
        }
    }, [balance, balanceData]);

    const removeNotification = (id: string) => {
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            if (updated.length === 0) setHasNewNotifications(false);
            return updated;
        });
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        setHasNewNotifications(false);
    };

    const handleOpenNotifications = () => {
        setIsNotificationOpen(!isNotificationOpen);
        if (!isNotificationOpen) {
            setHasNewNotifications(false);
        }
    };

    // Format currency VND
    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(Number(amount)) + 'đ';
    };

    const currentUser = session?.user?.name || username;
    const isLoggedIn = !!currentUser;

    return (
        <header className="sticky top-0 z-40 h-16 bg-[#0f172a] border-b border-[#1e293b] text-white shadow-lg">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">

                {/* 1. LEFT: Logo & Main Menu */}
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-500 transition-colors">
                            <span className="font-bold text-white text-lg leading-none">M</span>
                        </div>
                        <span className="font-bold text-lg tracking-wide hidden sm:block">
                            MMO <span className="text-blue-500">DIGITAL</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            <Store size={18} className="text-blue-400" />
                            <span>Cửa hàng</span>
                        </Link>
                        <Link
                            href="/dashboard/deposit"
                            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            <Wallet size={18} className="text-green-400" />
                            <span>Nạp tiền</span>
                        </Link>
                    </nav>
                </div>

                {/* 2. RIGHT: User Section */}
                <div className="flex items-center gap-3 sm:gap-6">

                    {isLoggedIn ? (
                        <>
                            {/* Balance Display */}
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-[10px] uppercase text-slate-400 font-medium tracking-wider">Số dư</span>
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={balance}
                                        initial={{ scale: 1.2, color: '#4ade80' }}
                                        animate={{ scale: 1, color: '#22c55e' }}
                                        transition={{ duration: 0.5, type: 'spring' }}
                                        className="text-sm sm:text-base font-bold text-[#22c55e]"
                                    >
                                        {isLoading ? '...' : formatVND(balance)}
                                    </motion.span>
                                </AnimatePresence>
                            </div>

                            {/* Action Icons */}
                            <div className="flex items-center gap-2 sm:gap-4 border-l border-slate-700 pl-4">
                                {/* Notification Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={handleOpenNotifications}
                                        className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                                    >
                                        <Bell size={20} />
                                        {hasNewNotifications && notifications.length > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#0f172a] animate-pulse"></span>
                                        )}
                                    </button>

                                    {/* Notification Dropdown */}
                                    <AnimatePresence>
                                        {isNotificationOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 top-12 z-50 w-72 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/50"
                                                >
                                                    <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Thông báo</h3>
                                                        <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded text-white font-bold">{notifications.length}</span>
                                                    </div>

                                                    <div className="max-h-80 overflow-y-auto">
                                                        {notifications.length === 0 ? (
                                                            <div className="px-4 py-8 text-center">
                                                                <Bell size={32} className="mx-auto text-slate-600 mb-2 opacity-20" />
                                                                <p className="text-xs text-slate-500">Chưa có thông báo mới</p>
                                                            </div>
                                                        ) : (
                                                            <div className="divide-y divide-slate-700">
                                                                {notifications.map((n) => (
                                                                    <div key={n.id} className="p-3 hover:bg-slate-700/30 transition-colors flex items-start gap-3 group">
                                                                        <div className="mt-1">
                                                                            <CheckCircle2 size={16} className="text-green-400" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm text-slate-100 font-medium">{n.text}</p>
                                                                            <p className="text-[10px] text-slate-500 mt-0.5">Vừa xong</p>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                removeNotification(n.id);
                                                                            }}
                                                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {notifications.length > 0 && (
                                                        <button
                                                            onClick={clearAllNotifications}
                                                            className="w-full py-2.5 text-[11px] font-bold text-slate-400 hover:text-white border-t border-slate-700 bg-slate-900/50 hover:bg-slate-800 transition-colors"
                                                        >
                                                            Xóa tất cả
                                                        </button>
                                                    )}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Message / Chatbot Trigger */}
                                <Link
                                    href="/dashboard/messages"
                                    className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                                >
                                    <MessageCircle size={20} />
                                    {unreadMessagesCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-600 rounded-full text-[10px] font-bold flex items-center justify-center text-white ring-2 ring-[#0f172a]">
                                            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                                        </span>
                                    )}
                                </Link>
                            </div>

                            {/* Profile Dropdown */}
                            <div className="relative ml-2">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 hover:bg-slate-800 rounded-full p-1 transition-all border border-transparent hover:border-slate-700"
                                >
                                    <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                                        {currentUser?.[0]?.toUpperCase() || <User size={18} />}
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-14 z-50 w-56 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/50"
                                            >
                                                <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                                                    <p className="text-sm text-white font-medium truncate">{currentUser}</p>
                                                    <p className="text-xs text-green-400 mt-0.5">Online</p>
                                                </div>

                                                <div className="py-2">
                                                    <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                                                        <User size={16} /> Hồ sơ
                                                    </Link>
                                                    <Link href="/dashboard/deposit" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                                                        <Wallet size={16} /> Nạp tiền
                                                    </Link>
                                                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                                                        <LayoutDashboard size={16} /> Dashboard
                                                    </Link>
                                                </div>

                                                <div className="border-t border-slate-700 pt-1 pb-2">
                                                    <button
                                                        onClick={() => signOut({ callbackUrl: '/' })}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                                                    >
                                                        <LogOut size={16} /> Đăng xuất
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/auth/login"
                                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/auth/register"
                                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-500/20"
                            >
                                Đăng ký
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
