'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Wallet,
    ShoppingCart,
    Package,
    AlertTriangle,
    Upload,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
    BarChart3,
    Heart,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

interface SidebarProps {
    userRole: 'BUYER' | 'SELLER' | 'ADMIN';
}

interface MenuItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    roles: string[];
}

const menuItems: MenuItem[] = [
    {
        icon: <LayoutDashboard size={20} />,
        label: 'Dashboard',
        href: '/dashboard',
        roles: ['BUYER', 'SELLER', 'ADMIN'],
    },
    {
        icon: <Wallet size={20} />,
        label: 'Nạp tiền',
        href: '/dashboard/deposit',
        roles: ['BUYER', 'SELLER', 'ADMIN'],
    },
    {
        icon: <ShoppingCart size={20} />,
        label: 'Đơn hàng',
        href: '/dashboard/orders',
        roles: ['BUYER', 'SELLER', 'ADMIN'],
    },
    {
        icon: <AlertTriangle size={20} />,
        label: 'Khiếu nại',
        href: '/dashboard/disputes',
        roles: ['BUYER', 'SELLER', 'ADMIN'],
    },
    {
        icon: <Heart size={20} />, // Need to import Heart
        label: 'Yêu thích',
        href: '/dashboard/wishlist',
        roles: ['BUYER'],
    },
    // Seller & Admin only
    {
        icon: <Package size={20} />,
        label: 'Sản phẩm',
        href: '/dashboard/products',
        roles: ['SELLER', 'ADMIN'],
    },
    {
        icon: <Upload size={20} />,
        label: 'Kho hàng',
        href: '/dashboard/inventory',
        roles: ['SELLER', 'ADMIN'],
    },
    {
        icon: <Upload size={20} />,
        label: 'Bulk Upload',
        href: '/dashboard/seller/bulk-upload',
        roles: ['SELLER', 'ADMIN'],
    },
    // Admin only
    {
        icon: <BarChart3 size={20} />,
        label: 'Thống kê',
        href: '/dashboard/admin/statistics',
        roles: ['ADMIN'],
    },
    {
        icon: <Users size={20} />,
        label: 'Người dùng',
        href: '/dashboard/admin/users',
        roles: ['ADMIN'],
    },
    {
        icon: <Wallet size={20} />,
        label: 'Duyệt rút tiền',
        href: '/dashboard/admin/withdrawals',
        roles: ['ADMIN'],
    },
    {
        icon: <Settings size={20} />,
        label: 'Cài đặt',
        href: '/dashboard/admin/settings',
        roles: ['ADMIN'],
    },
];

export default function Sidebar({ userRole }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { logout } = useAuth();

    const filteredMenuItems = menuItems.filter((item) =>
        item.roles.includes(userRole)
    );

    return (
        <aside
            className={`
        fixed left-0 top-0 z-40 h-screen
        bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
        border-r border-slate-700/50
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700/50">
                {!collapsed && (
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">M</span>
                        </div>
                        <span className="text-white font-semibold text-lg">MMO Shop</span>
                    </Link>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                    {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2">
                <ul className="space-y-1">
                    {filteredMenuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActive
                                            ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                        }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <span className={isActive ? 'text-blue-400' : ''}>
                                        {item.icon}
                                    </span>
                                    {!collapsed && (
                                        <span className="font-medium">{item.label}</span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="p-2 border-t border-slate-700/50">
                <button
                    onClick={() => logout()}
                    className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg w-full
            text-red-400 hover:text-red-300 hover:bg-red-500/10
            transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
                    title={collapsed ? 'Đăng xuất' : undefined}
                >
                    <LogOut size={20} />
                    {!collapsed && <span className="font-medium">Đăng xuất</span>}
                </button>
            </div>
        </aside>
    );
}
