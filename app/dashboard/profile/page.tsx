
'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { User, Lock, Shield, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Smartphone, Clock, Globe, Monitor, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AccessLog {
    id: number;
    action: string;
    ipAddress: string;
    userAgent: string | null;
    createdAt: string;
}

export default function ProfilePage() {
    const { data: userData, mutate: mutateUser } = useSWR('/api/auth/me', fetcher);
    const { data: logsData } = useSWR('/api/user/logs', fetcher);
    const user = userData?.user;
    const accessLogs: AccessLog[] = logsData?.data || [];

    // Password Change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // 2FA - now synced with API
    const is2FAEnabled = !!user?.twoFactorEnabled;
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
    const [isDisabling2FA, setIsDisabling2FA] = useState(false);
    const [disableCode, setDisableCode] = useState('');
    const [showDisableModal, setShowDisableModal] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu mới không khớp!');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }

        setIsChangingPassword(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Đổi mật khẩu thành công!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(data.error || 'Đổi mật khẩu thất bại!');
            }
        } catch (error) {
            toast.error('Lỗi kết nối!');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const setup2FA = async () => {
        setIsSettingUp2FA(true);
        try {
            const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setQrCodeUrl(data.qrCode);
            } else {
                toast.error(data.error || 'Không thể thiết lập 2FA');
            }
        } catch (error) {
            toast.error('Lỗi kết nối!');
        } finally {
            setIsSettingUp2FA(false);
        }
    };

    const verify2FA = async () => {
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: totpCode }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Bật 2FA thành công!');
                setQrCodeUrl('');
                setTotpCode('');
                mutateUser(); // Refresh user data
            } else {
                toast.error(data.error || 'Mã OTP không đúng!');
            }
        } catch (error) {
            toast.error('Lỗi kết nối!');
        }
    };

    const disable2FA = async () => {
        if (!disableCode || disableCode.length !== 6) {
            toast.error('Vui lòng nhập mã OTP 6 số!');
            return;
        }
        setIsDisabling2FA(true);
        try {
            const res = await fetch('/api/auth/2fa/disable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: disableCode }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã tắt 2FA!');
                setShowDisableModal(false);
                setDisableCode('');
                mutateUser(); // Refresh user data
            } else {
                toast.error(data.error || 'Mã OTP không đúng!');
            }
        } catch (error) {
            toast.error('Lỗi kết nối!');
        } finally {
            setIsDisabling2FA(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    const parseUserAgent = (ua: string | null) => {
        if (!ua) return 'Không xác định';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return ua.substring(0, 30) + '...';
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <User className="text-blue-400" />
                    Hồ sơ cá nhân
                </h1>
                <p className="text-slate-400 mt-1">Quản lý thông tin và bảo mật tài khoản</p>
            </div>

            {/* Profile Info */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Thông tin tài khoản</h2>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-slate-700">
                        <span className="text-slate-400">Tên đăng nhập</span>
                        <span className="text-white font-medium">{user?.username || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-700">
                        <span className="text-slate-400">Email</span>
                        <span className="text-white font-medium">{user?.email || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-700">
                        <span className="text-slate-400">Vai trò</span>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium">
                            {user?.role || 'USER'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                        <span className="text-slate-400">Số dư</span>
                        <span className="text-green-400 font-bold">
                            {new Intl.NumberFormat('vi-VN').format(user?.balance || 0)} đ
                        </span>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lock size={20} className="text-amber-400" />
                    Đổi mật khẩu
                </h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu hiện tại</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu mới</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Xác nhận mật khẩu mới</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        {isChangingPassword ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        Đổi mật khẩu
                    </button>
                </form>
            </div>

            {/* 2FA Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-green-400" />
                    Bảo mật 2 lớp (2FA)
                </h2>

                {is2FAEnabled ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <CheckCircle className="text-green-400" size={24} />
                            <div className="flex-1">
                                <p className="text-green-400 font-medium">2FA đã được bật</p>
                                <p className="text-slate-400 text-sm">Tài khoản của bạn được bảo vệ bằng xác thực 2 lớp</p>
                            </div>
                            <button
                                onClick={() => setShowDisableModal(true)}
                                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg border border-red-500/30 transition-colors"
                            >
                                Tắt 2FA
                            </button>
                        </div>

                        {/* Disable 2FA Modal */}
                        {showDisableModal && (
                            <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg space-y-3">
                                <p className="text-slate-300 text-sm">Nhập mã OTP để xác nhận tắt 2FA:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={disableCode}
                                        onChange={(e) => setDisableCode(e.target.value)}
                                        placeholder="123456"
                                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white text-center text-lg tracking-widest"
                                        maxLength={6}
                                    />
                                    <button
                                        onClick={disable2FA}
                                        disabled={isDisabling2FA}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg flex items-center gap-2"
                                    >
                                        {isDisabling2FA ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                                        Xác nhận
                                    </button>
                                    <button
                                        onClick={() => { setShowDisableModal(false); setDisableCode(''); }}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : qrCodeUrl ? (
                    <div className="space-y-4">
                        <p className="text-slate-300 text-sm">Quét mã QR bằng ứng dụng Authenticator (Google Authenticator, Authy, etc.)</p>
                        <div className="flex justify-center p-4 bg-white rounded-lg">
                            <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Nhập mã OTP từ ứng dụng</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value)}
                                    placeholder="123456"
                                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white text-center text-lg tracking-widest"
                                    maxLength={6}
                                />
                                <button
                                    onClick={verify2FA}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg"
                                >
                                    Xác nhận
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-slate-400 text-sm">
                            Bật xác thực 2 lớp để bảo vệ tài khoản khỏi truy cập trái phép.
                        </p>
                        <button
                            onClick={setup2FA}
                            disabled={isSettingUp2FA}
                            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 border border-slate-600"
                        >
                            {isSettingUp2FA ? <Loader2 className="animate-spin" size={18} /> : <Smartphone size={18} />}
                            Thiết lập 2FA
                        </button>
                    </div>
                )}
            </div>

            {/* Access Logs */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-purple-400" />
                    Lịch sử đăng nhập
                </h2>

                {accessLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Thời gian</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">IP</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Thiết bị</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {accessLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-700/30">
                                        <td className="px-3 py-3 text-sm text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-slate-500" />
                                                {formatDate(log.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-sm text-white font-mono">
                                            <div className="flex items-center gap-2">
                                                <Globe size={14} className="text-slate-500" />
                                                {log.ipAddress}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-sm text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Monitor size={14} className="text-slate-500" />
                                                {parseUserAgent(log.userAgent)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm text-center py-4">Chưa có lịch sử đăng nhập</p>
                )}
            </div>
        </div>
    );
}
