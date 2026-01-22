
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(req: Request) {
    try {
        // 1. Verify Admin
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

        // 2. Get Date Range (Last 30 days by default)
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 3. Aggregate Data
        // Total Revenue (Sum of all orders)
        const totalRevenue = await prisma.order.aggregate({
            where: { createdAt: { gte: startDate } },
            _sum: { totalPrice: true },
            _count: true
        });

        // Total Users
        const totalUsers = await prisma.user.count();
        const newUsers = await prisma.user.count({
            where: { createdAt: { gte: startDate } }
        });

        // Total Products
        const totalProducts = await prisma.product.count({ where: { status: 'ACTIVE' } });

        // Pending Withdrawals
        const pendingWithdrawals = await prisma.withdrawalRequest.count({
            where: { status: 'PENDING' }
        });

        // Net Profit (Platform Fees) - Fixed 5% of Total Revenue
        const PLATFORM_FEE_PERCENTAGE = 0.05;
        const netProfit = (Number(totalRevenue._sum.totalPrice || 0)) * PLATFORM_FEE_PERCENTAGE;

        // Total User Balance (Platform-wide)
        const totalUserBalance = await prisma.user.aggregate({
            _sum: { balance: true, pendingBalance: true }
        });

        // 4. Disputes Management
        const disputeStats = await prisma.dispute.groupBy({
            by: ['status'],
            _count: true
        });

        const pendingDisputesCount = disputeStats.find(d => d.status === 'OPEN')?._count || 0;
        const resolvedDisputesCount = disputeStats.filter(d => d.status !== 'OPEN').reduce((acc, curr) => acc + curr._count, 0);

        // Fetch Recent Disputes
        const recentDisputes = await prisma.dispute.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { username: true } }, // Buyer
                order: {
                    include: {
                        product: {
                            include: {
                                seller: { select: { username: true } }
                            }
                        }
                    }
                }
            }
        });

        const formattedDisputes = recentDisputes.map(d => ({
            id: d.id,
            buyerName: d.user.username,
            sellerName: d.order.product.seller.username,
            orderId: d.orderId,
            reason: d.reason,
            status: d.status,
            createdAt: d.createdAt
        }));

        // Dispute Rate
        const totalOrdersAll = await prisma.order.count({
            where: { createdAt: { gte: startDate } }
        });
        const disputedOrders = await prisma.order.count({
            where: {
                createdAt: { gte: startDate },
                status: 'DISPUTED'
            }
        });
        const disputeRate = totalOrdersAll > 0 ? (disputedOrders / totalOrdersAll) * 100 : 0;

        // Low Stock Products (stock <= 5)
        const productsWithStock = await prisma.product.findMany({
            where: { status: 'ACTIVE' },
            include: {
                category: true,
                _count: {
                    select: { items: { where: { isSold: false } } }
                }
            }
        });

        const lowStockProducts = productsWithStock
            .filter(p => p._count.items <= 5)
            .map(p => ({
                id: p.id,
                name: p.name,
                category: p.category.name,
                stock: p._count.items,
                price: Number(p.price)
            }));

        // 4. Daily Revenue Chart Data (Last 30 days)
        const dailyOrders = await prisma.order.groupBy({
            by: ['createdAt'],
            where: { createdAt: { gte: startDate } },
            _sum: { totalPrice: true },
            _count: true,
        });

        // Process into chart format
        const chartData: { date: string; revenue: number; orders: number }[] = [];
        const dateMap = new Map<string, { revenue: number; orders: number }>();

        // Initialize all dates
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dateMap.set(dateStr, { revenue: 0, orders: 0 });
        }

        // Fill with actual data
        dailyOrders.forEach(order => {
            const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
            const existing = dateMap.get(dateStr) || { revenue: 0, orders: 0 };
            dateMap.set(dateStr, {
                revenue: existing.revenue + Number(order._sum.totalPrice || 0),
                orders: existing.orders + order._count
            });
        });

        // Convert to array
        dateMap.forEach((value, key) => {
            chartData.push({ date: key, revenue: value.revenue, orders: value.orders });
        });

        // Sort by date
        chartData.sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalRevenue: Number(totalRevenue._sum.totalPrice || 0),
                    totalOrders: totalRevenue._count,
                    totalUsers,
                    newUsers,
                    totalProducts,
                    pendingWithdrawals,
                    netProfit: Math.round(netProfit),
                    totalUserBalance: Number(totalUserBalance._sum.balance || 0) + Number(totalUserBalance._sum.pendingBalance || 0),
                    disputeRate: Math.round(disputeRate * 100) / 100
                },
                chartData,
                lowStockProducts,
                recentDisputes: formattedDisputes,
                pendingDisputesCount
            }
        });

    } catch (error) {
        console.error('Statistics error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
