
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import argon2 from "argon2";

export async function GET() {
    try {
        console.log("Starting seed process...");

        // 1. System Settings
        const settings = [
            {
                group: 'general',
                key: 'siteName',
                value: 'MMO Market',
                type: 'string',
                description: 'Tên hiển thị của website',
                isPublic: true,
            },
            {
                group: 'general',
                key: 'maintenanceMode',
                value: 'false',
                type: 'boolean',
                description: 'Bảo trì hệ thống',
                isPublic: true,
            },
            {
                group: 'finance',
                key: 'minDeposit',
                value: '10000',
                type: 'number',
                description: 'Số tiền nạp tối thiểu (VNĐ)',
                isPublic: true,
            },
            {
                group: 'finance',
                key: 'minWithdraw',
                value: '50000',
                type: 'number',
                description: 'Số tiền rút tối thiểu (VNĐ)',
                isPublic: true,
            },
            {
                group: 'support',
                key: 'contactEmail',
                value: 'support@mmo-market.com',
                type: 'string',
                description: 'Email hỗ trợ',
                isPublic: true,
            },
        ];

        for (const setting of settings) {
            await prisma.systemSetting.upsert({
                where: { key: setting.key },
                update: {},
                create: setting,
            });
        }
        console.log("System settings seeded.");

        // 2. Admin User
        const adminPassword = await argon2.hash('admin123');

        const admin = await prisma.user.upsert({
            where: { email: 'admin@mmo.com' },
            update: {
                role: 'ADMIN',
                status: 'ACTIVE',
                password: adminPassword,
            },
            create: {
                username: 'admin',
                email: 'admin@mmo.com',
                password: adminPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });
        console.log("Admin user seeded:", admin.email);

        return NextResponse.json({
            success: true,
            message: "Database seeded successfully",
            details: {
                adminUser: "admin@mmo.com",
                settingsCount: settings.length
            }
        });
    } catch (error) {
        console.error("Seeding error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
