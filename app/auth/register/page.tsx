'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Store, UserPlus, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'BUYER' as 'BUYER' | 'SELLER',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to login on success
                router.push('/auth/login?registered=true');
            } else {
                setError(data.message || 'Đăng ký thất bại');
            }
        } catch (err) {
            setError('Lỗi kết nối server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Đăng ký tài khoản</h2>
                <p className="text-slate-400 mt-2">
                    Tham gia cộng đồng MMO Digital Marketplace ngay hôm nay.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
                        <AlertCircle size={20} />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'BUYER' })}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all
              ${formData.role === 'BUYER'
                                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                    >
                        <User size={24} />
                        <span className="font-medium text-sm">Người mua</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'SELLER' })}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all
              ${formData.role === 'SELLER'
                                ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                    >
                        <Store size={24} />
                        <span className="font-medium text-sm">Người bán</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Tên đăng nhập
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                required
                                minLength={3}
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="username"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full pl-10 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Xác nhận mật khẩu
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <UserPlus size={20} />
                    )}
                    {isLoading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
                </button>

                <p className="text-center text-slate-400 text-sm">
                    Đã có tài khoản?{' '}
                    <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
                        Đăng nhập ngay
                    </Link>
                </p>
            </form>
        </>
    );
}
