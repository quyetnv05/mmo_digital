import { TrendingUp, ShoppingCart, Package, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Stats Card Component
function StatsCard({
    title,
    value,
    change,
    changeType,
    icon,
    gradient,
}: {
    title: string;
    value: string;
    change: string;
    changeType: 'up' | 'down';
    icon: React.ReactNode;
    gradient: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-400">{title}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                    <div className="mt-2 flex items-center gap-1">
                        {changeType === 'up' ? (
                            <ArrowUpRight size={16} className="text-green-400" />
                        ) : (
                            <ArrowDownRight size={16} className="text-red-400" />
                        )}
                        <span
                            className={`text-sm font-medium ${changeType === 'up' ? 'text-green-400' : 'text-red-400'
                                }`}
                        >
                            {change}
                        </span>
                        <span className="text-sm text-slate-500">vs tuần trước</span>
                    </div>
                </div>
                <div
                    className={`p-3 rounded-lg bg-gradient-to-br ${gradient}`}
                >
                    {icon}
                </div>
            </div>
            {/* Decorative gradient */}
            <div
                className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-xl`}
            />
        </div>
    );
}

// Recent Orders Table
function RecentOrders() {
    const orders = [
        { id: '#1234', product: 'Clone Facebook 2FA', quantity: 10, price: 150000, status: 'completed', time: '5 phút trước' },
        { id: '#1233', product: 'Gmail PVA', quantity: 50, price: 250000, status: 'pending', time: '15 phút trước' },
        { id: '#1232', product: 'Tiktok Aged', quantity: 5, price: 100000, status: 'completed', time: '1 giờ trước' },
        { id: '#1231', product: 'Instagram HQ', quantity: 20, price: 400000, status: 'disputed', time: '2 giờ trước' },
    ];

    const statusColors = {
        completed: 'bg-green-500/10 text-green-400 border-green-500/30',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        disputed: 'bg-red-500/10 text-red-400 border-red-500/30',
    };

    const statusLabels = {
        completed: 'Hoàn thành',
        pending: 'Đang chờ',
        disputed: 'Khiếu nại',
    };

    return (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-white">Đơn hàng gần đây</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Mã đơn
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Sản phẩm
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                SL
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Giá
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Thời gian
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-blue-400">
                                    {order.id}
                                </td>
                                <td className="px-4 py-3 text-sm text-white">
                                    {order.product}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-300">
                                    {order.quantity}
                                </td>
                                <td className="px-4 py-3 text-sm text-white font-medium">
                                    {order.price.toLocaleString('vi-VN')}đ
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusColors[order.status as keyof typeof statusColors]
                                            }`}
                                    >
                                        {statusLabels[order.status as keyof typeof statusLabels]}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-400">
                                    {order.time}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">
                    Chào mừng trở lại! Đây là tổng quan hoạt động của bạn.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Tổng doanh thu"
                    value="15.000.000đ"
                    change="+12.5%"
                    changeType="up"
                    icon={<TrendingUp size={24} className="text-white" />}
                    gradient="from-blue-500 to-purple-600"
                />
                <StatsCard
                    title="Đơn hàng"
                    value="156"
                    change="+8.2%"
                    changeType="up"
                    icon={<ShoppingCart size={24} className="text-white" />}
                    gradient="from-green-500 to-emerald-600"
                />
                <StatsCard
                    title="Sản phẩm đã bán"
                    value="1,234"
                    change="+23.1%"
                    changeType="up"
                    icon={<Package size={24} className="text-white" />}
                    gradient="from-amber-500 to-orange-600"
                />
                <StatsCard
                    title="Khiếu nại"
                    value="3"
                    change="-15.3%"
                    changeType="down"
                    icon={<AlertTriangle size={24} className="text-white" />}
                    gradient="from-red-500 to-pink-600"
                />
            </div>

            {/* Recent Orders */}
            <RecentOrders />
        </div>
    );
}
