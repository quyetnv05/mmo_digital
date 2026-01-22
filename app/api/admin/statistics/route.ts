
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

        // Net Profit (Platform Fees) - Estimated from BalanceAudit with ORDER_ESCROW
        // Fee is typically 5-10% of order total. We calculate from difference between order total and seller net.
        const feeAudits = await prisma.balanceAudit.findMany({
            where: {
                reason: 'ORDER_ESCROW',
                createdAt: { gte: startDate }
            },
            select: { amount: true, description: true }
        });

        // Parse fee percentage from description and calculate total fees
        let netProfit = 0;
        feeAudits.forEach(audit => {
            const feeMatch = audit.description?.match(/Fee: (\d+(?:\.\d+)?)%/);
            if (feeMatch) {
                const feeRate = parseFloat(feeMatch[1]) / 100;
                const netAmount = Number(audit.amount);
                // Net = Total * (1 - feeRate), so Total = Net / (1 - feeRate), Fee = Total - Net
                const totalAmount = netAmount / (1 - feeRate);
                netProfit += totalAmount - netAmount;
            }
        });

        // Total User Balance (Platform-wide)
        const totalUserBalance = await prisma.user.aggregate({
            _sum: { balance: true, pendingBalance: true }
        });

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
                lowStockProducts
            }
        });

    } catch (error) {
        console.error('Statistics error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
