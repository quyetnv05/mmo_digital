'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, LogIn, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';

import { Suspense } from 'react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Use NextAuth signIn
            const result = await signIn('credentials', {
                identifier: formData.identifier,
                password: formData.password,
                redirect: false,
                callbackUrl,
            });

            if (result?.error) {
                setError('Tên đăng nhập hoặc mật khẩu không đúng');
                setIsLoading(false);
            } else {
                // Successful login
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (err) {
            setError('Lỗi kết nối server');
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Đăng nhập</h2>
                <p className="text-slate-400 mt-2">
                    Chào mừng trở lại! Vui lòng nhập thông tin đăng nhập.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
                        <AlertCircle size={20} />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Username / Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                required
                                value={formData.identifier}
                                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="Username hoặc Email"
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
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500/20" />
                        <span className="text-slate-400">Ghi nhớ đăng nhập</span>
                    </label>
                    <a href="#" className="text-blue-400 hover:text-blue-300 font-medium">
                        Quên mật khẩu?
                    </a>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <LogIn size={20} />
                    )}
                    {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>

                <p className="text-center text-slate-400 text-sm">
                    Chưa có tài khoản?{' '}
                    <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium">
                        Đăng ký ngay
                    </Link>
                </p>
            </form>
        </>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="text-center text-slate-400">Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
