'use client';

import { useState } from 'react';
import { User, Shield, Ban, CheckCircle, Search } from 'lucide-react';

interface UserData {
    id: number;
    username: string;
    email: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    status: 'ACTIVE' | 'BANNED';
    balance: number;
    createdAt: string;
}

// ... (imports remain)
import useSWR from 'swr';
import { toast } from 'react-hot-toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserData {
    id: number;
    username: string;
    email: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    status: 'ACTIVE' | 'BANNED';
    balance: number;
    createdAt: string;
}

export default function AdminUsersPage() {
    const { data, mutate } = useSWR('/api/admin/users', fetcher);
    const users: UserData[] = data?.data || [];
    const isLoading = !data && !data?.error;

    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdateStatus = async (userId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
        if (!confirm(`Bạn có chắc muốn ${newStatus === 'BANNED' ? 'KHÓA' : 'MỞ KHÓA'} user này?`)) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status: newStatus })
            });
            const result = await res.json();
            if (result.success) {
                toast.success('Cập nhật thành công');
                mutate();
            } else {
                toast.error('Lỗi: ' + result.error);
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
    };

    const roleColors = {
        ADMIN: 'text-red-400 bg-red-500/10 border-red-500/30',
        SELLER: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        BUYER: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <User className="text-blue-400" />
                        Quản lý người dùng
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Danh sách và phân quyền người dùng hệ thống.
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/30">
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Số dư</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Ngày tạo</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Đang tải...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Không tìm thấy user nào</td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">
                                                {user.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{user.username}</p>
                                                <p className="text-slate-500 text-xs">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${roleColors[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-white font-mono text-sm">
                                        {new Intl.NumberFormat('vi-VN').format(user.balance)}đ
                                    </td>
                                    <td className="px-4 py-4">
                                        {user.status === 'ACTIVE' ? (
                                            <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
                                                <CheckCircle size={12} /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
                                                <Ban size={12} /> Banned
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-slate-400 text-sm">
                                        {user.createdAt}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button
                                            onClick={() => handleUpdateStatus(user.id, user.status)}
                                            className={`p-2 rounded-lg transition-colors ${user.status === 'ACTIVE'
                                                    ? 'text-red-400 hover:bg-red-500/10'
                                                    : 'text-green-400 hover:bg-green-500/10'
                                                }`}
                                            title={user.status === 'ACTIVE' ? "Ban user" : "Unban user"}
                                            disabled={user.role === 'ADMIN'}
                                        >
                                            {user.status === 'ACTIVE' ? <Ban size={16} /> : <CheckCircle size={16} />}
                                        </button>
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
