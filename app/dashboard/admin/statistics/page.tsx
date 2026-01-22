
'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { BarChart3, Users, ShoppingCart, DollarSign, TrendingUp, Package, Clock, Loader2, AlertTriangle, Wallet, Percent } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StatsSummary {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    newUsers: number;
    totalProducts: number;
    pendingWithdrawals: number;
    netProfit: number;
    totalUserBalance: number;
    disputeRate: number;
}

interface ChartDataPoint {
    date: string;
    revenue: number;
    orders: number;
}

interface LowStockProduct {
    id: number;
    name: string;
    category: string;
    stock: number;
    price: number;
}

function StatCard({ title, value, icon: Icon, color, subtitle }: any) {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-400 text-sm font-medium">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
        </div>
    );
}

export default function StatisticsPage() {
    const [days, setDays] = useState(30);
    const { data, isLoading } = useSWR(`/api/admin/statistics?days=${days}`, fetcher, { refreshInterval: 60000 });

    const summary: StatsSummary = data?.data?.summary || {};
    const chartData: ChartDataPoint[] = data?.data?.chartData || [];
    const lowStockProducts: LowStockProduct[] = data?.data?.lowStockProducts || [];

    const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="text-blue-400" />
                        Thống kê Hệ thống
                    </h1>
                    <p className="text-slate-400 mt-1">Tổng quan doanh thu và hoạt động</p>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm"
                >
                    <option value={7}>7 ngày</option>
                    <option value={30}>30 ngày</option>
                    <option value={90}>90 ngày</option>
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng Doanh thu"
                    value={`${formatVND(summary.totalRevenue || 0)} đ`}
                    icon={DollarSign}
                    color="bg-green-600"
                />
                <StatCard
                    title="Lợi nhuận ròng"
                    value={`${formatVND(summary.netProfit || 0)} đ`}
                    icon={TrendingUp}
                    color="bg-emerald-600"
                    subtitle="Phí giao dịch thu được"
                />
                <StatCard
                    title="Tổng số dư người dùng"
                    value={`${formatVND(summary.totalUserBalance || 0)} đ`}
                    icon={Wallet}
                    color="bg-cyan-600"
                />
                <StatCard
                    title="Tỷ lệ khiếu nại"
                    value={`${summary.disputeRate || 0}%`}
                    icon={Percent}
                    color={summary.disputeRate > 5 ? "bg-red-600" : "bg-slate-600"}
                    subtitle={summary.disputeRate > 5 ? "Cần chú ý!" : "Bình thường"}
                />
            </div>

            {/* Second Row of Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng Đơn hàng"
                    value={summary.totalOrders || 0}
                    icon={ShoppingCart}
                    color="bg-blue-600"
                />
                <StatCard
                    title="Người dùng"
                    value={summary.totalUsers || 0}
                    icon={Users}
                    color="bg-purple-600"
                    subtitle={`+${summary.newUsers || 0} mới`}
                />
                <StatCard
                    title="Sản phẩm"
                    value={summary.totalProducts || 0}
                    icon={Package}
                    color="bg-indigo-600"
                />
                <StatCard
                    title="Rút tiền chờ duyệt"
                    value={summary.pendingWithdrawals || 0}
                    icon={Clock}
                    color="bg-amber-600"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-400" />
                        Doanh thu theo ngày
                    </h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                    formatter={(value: any) => [`${formatVND(value || 0)} đ`, 'Doanh thu']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRevenue)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Package size={20} className="text-purple-400" />
                        Số đơn hàng theo ngày
                    </h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                    formatter={(value: any) => [value || 0, 'Đơn hàng']}
                                />
                                <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Disputes Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-400" />
                    Khiếu nại mới nhất
                    {data?.data?.pendingDisputesCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                            {data.data.pendingDisputesCount} cần xử lý
                        </span>
                    )}
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Mã đơn</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Buyer</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Seller</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Lý do</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {data?.data?.recentDisputes?.map((dispute: any) => (
                                <tr key={dispute.id} className="hover:bg-slate-700/30">
                                    <td className="px-4 py-3 text-sm text-slate-400">#{dispute.orderId}</td>
                                    <td className="px-4 py-3 text-sm text-white">{dispute.buyerName}</td>
                                    <td className="px-4 py-3 text-sm text-white">{dispute.sellerName}</td>
                                    <td className="px-4 py-3 text-sm text-white">{dispute.reason}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${dispute.status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-400' :
                                                dispute.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            {dispute.status === 'OPEN' ? 'Cần xử lý' : dispute.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!data?.data?.recentDisputes || data.data.recentDisputes.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        Không có khiếu nại nào gần đây
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-amber-400" />
                        Cảnh báo tồn kho thấp
                        <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                            {lowStockProducts.length} sản phẩm
                        </span>
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Sản phẩm</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Danh mục</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Giá</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Tồn kho</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {lowStockProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-700/30">
                                        <td className="px-4 py-3 text-sm text-white font-medium">{product.name}</td>
                                        <td className="px-4 py-3 text-sm text-slate-400">{product.category}</td>
                                        <td className="px-4 py-3 text-sm text-white">{formatVND(product.price)} đ</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.stock === 0
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {product.stock === 0 ? 'Hết hàng' : `Còn ${product.stock}`}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
