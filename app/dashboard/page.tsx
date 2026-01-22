import { TrendingUp, ShoppingCart, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Helper to get currency format
const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
};

// Stats Card Component
function StatsCard({
    title,
    value,
    subValue,
    icon,
    gradient,
}: {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ReactNode;
    gradient: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-400">{title}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                    {subValue && (
                        <p className="mt-1 text-sm text-slate-400">{subValue}</p>
                    )}
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient}`}>
                    {icon}
                </div>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-xl`} />
        </div>
    );
}

// Recent Orders Table
function RecentOrders({ orders }: { orders: any[] }) {
    const statusColors: any = {
        completed: 'bg-green-500/10 text-green-400 border-green-500/30',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        disputed: 'bg-red-500/10 text-red-400 border-red-500/30',
        refunded: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    };

    const statusLabels: any = {
        completed: 'Hoàn thành',
        pending: 'Đang xử lý',
        disputed: 'Khiếu nại',
        refunded: 'Hoàn tiền',
    };

    return (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-white">Đơn hàng gần đây (Mua & Bán)</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Mã đơn</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Sản phẩm</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">SL</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng tiền</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Vai trò</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {orders.length > 0 ? (
                            orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-blue-400">#{order.id}</td>
                                    <td className="px-4 py-3 text-sm text-white">{order.product.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-300">{order.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-white font-medium">{formatVND(Number(order.totalPrice))}đ</td>
                                    <td className="px-4 py-3 text-sm">
                                        {order.isSeller ? (
                                            <span className="text-emerald-400 font-medium">Bán</span>
                                        ) : (
                                            <span className="text-blue-400 font-medium">Mua</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusColors[order.status.toLowerCase()] || 'bg-slate-500/10 text-slate-400'}`}>
                                            {statusLabels[order.status.toLowerCase()] || order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-400">
                                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                    Chưa có đơn hàng nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect('/auth/login');
    }

    let userId: number;
    let userRole: string;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
        userRole = decoded.role;
    } catch (e) {
        redirect('/auth/login');
    }

    // 1. Fetch User Info including Balance
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true, pendingBalance: true, username: true }
    });

    if (!user) redirect('/auth/login');

    // 2. Fetch Orders (Both bought and sold)
    // Just for recent orders list
    const recentOrdersRaw = await prisma.order.findMany({
        where: {
            OR: [
                { buyerId: userId },
                { product: { sellerId: userId } }
            ]
        },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    const recentOrders = recentOrdersRaw.map(o => ({
        ...o,
        isSeller: o.product.sellerId === userId
    }));

    // 3. Helper queries for stats
    // A. Revenue (Sold items)
    const revenueAgg = await prisma.order.aggregate({
        where: {
            product: { sellerId: userId },
            status: 'COMPLETED'
        },
        _sum: { totalPrice: true }
    });
    const totalRevenue = Number(revenueAgg._sum.totalPrice || 0);

    // B. Total Orders (Bought items)
    const ordersCount = await prisma.order.count({
        where: { buyerId: userId }
    });

    // C. Inventory Count (My products in stock)
    // Count ProductItems where product.sellerId = userId AND isSold = false
    const inventoryCount = await prisma.productItem.count({
        where: {
            product: { sellerId: userId },
            isSold: false
        }
    });

    // D. Disputes / Issues (Active disputes)
    // Assuming Dispute model exists or checking order status 'DISPUTED'
    const disputedCount = await prisma.order.count({
        where: {
            OR: [
                { buyerId: userId },
                { product: { sellerId: userId } }
            ],
            status: 'DISPUTED'
        }
    });

    // E. Total Spent (For Buyers)
    const spentAgg = await prisma.order.aggregate({
        where: {
            buyerId: userId,
            status: 'COMPLETED'
        },
        _sum: { totalPrice: true }
    });
    const totalSpent = Number(spentAgg._sum.totalPrice || 0);

    const isSeller = userRole === 'SELLER' || userRole === 'ADMIN';

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard của {user.username}</h1>
                <p className="text-slate-400 mt-1">
                    Tổng quan tài chính và hoạt động kinh doanh.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Số dư khả dụng"
                    value={`${formatVND(Number(user.balance))}đ`}
                    subValue={`Đang chờ: ${formatVND(Number(user.pendingBalance))}đ`}
                    icon={<Wallet size={24} className="text-white" />}
                    gradient="from-blue-500 to-indigo-600"
                />

                {isSeller ? (
                    <>
                        <StatsCard
                            title="Doanh thu bán hàng"
                            value={`${formatVND(totalRevenue)}đ`}
                            subValue="Tổng tiền bán được"
                            icon={<TrendingUp size={24} className="text-white" />}
                            gradient="from-emerald-500 to-green-600"
                        />
                        <StatsCard
                            title="Kho hàng (Tồn kho)"
                            value={inventoryCount.toString()}
                            subValue="Sản phẩm đang bán"
                            icon={<Package size={24} className="text-white" />}
                            gradient="from-amber-500 to-orange-600"
                        />
                    </>
                ) : (
                    <StatsCard
                        title="Đã chi tiêu"
                        value={`${formatVND(totalSpent)}đ`}
                        subValue="Tổng tiền mua sắm"
                        icon={<TrendingUp size={24} className="text-white" />}
                        gradient="from-pink-500 to-rose-600"
                    />
                )}

                <StatsCard
                    title="Đơn hàng đã mua"
                    value={ordersCount.toString()}
                    subValue="Đơn mua thành công"
                    icon={<ShoppingCart size={24} className="text-white" />}
                    gradient="from-violet-500 to-purple-600"
                />

                {/* For Buyers, fill the 4th slot or leave empty. 
                    Let's show Disputes or Support Tickets if available, or just nothing.
                    Or show "Pending Orders" count.
                */}
                {!isSeller && (
                    <StatsCard
                        title="Khiếu nại / Hỗ trợ"
                        value={disputedCount.toString()}
                        subValue="Yêu cầu đang mở"
                        icon={<AlertTriangle size={24} className="text-white" />}
                        gradient="from-red-500 to-orange-600"
                    />
                )}
            </div>

            {/* Recent Orders */}
            <RecentOrders orders={recentOrders} />
        </div>
    );
}

