export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950">
            {/* Left Side - Hero / Branding */}
            <div className="hidden lg:flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 p-12">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 filter contrast-150 brightness-150"></div>
                <div className="relative z-10 max-w-md text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/20">
                        <span className="text-4xl text-white font-bold">M</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-6">
                        MMO Digital Marketplace
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed">
                        Nền tảng mua bán tài nguyên số hàng đầu Việt Nam. Giao dịch an toàn, tự động và bảo mật tuyệt đối với công nghệ Escrow.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-12">
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 backdrop-blur-sm">
                            <h3 className="text-2xl font-bold text-white mb-1">10k+</h3>
                            <p className="text-slate-400 text-sm">Sản phẩm active</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 backdrop-blur-sm">
                            <h3 className="text-2xl font-bold text-white mb-1">50k+</h3>
                            <p className="text-slate-400 text-sm">Giao dịch/tháng</p>
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-1/4 left-10 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-pulse-slow delay-75"></div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md space-y-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
