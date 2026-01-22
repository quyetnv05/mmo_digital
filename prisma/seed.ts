import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Create initial system settings
    const settings = [
        {
            key: 'site_name',
            value: 'MMO Marketplace',
            group: 'GENERAL',
            description: 'Tên hiển thị của Website',
            type: 'string',
            isPublic: true,
        },
        {
            key: 'maintenance_mode',
            value: 'false',
            group: 'GENERAL',
            description: 'Chế độ bảo trì hệ thống (true/false)',
            type: 'boolean',
            isPublic: true,
        },
        {
            key: 'transaction_fee',
            value: '5',
            group: 'FINANCE',
            description: 'Phí giao dịch (%)',
            type: 'number',
            isPublic: true,
        },
        {
            key: 'min_withdrawal',
            value: '100000',
            group: 'FINANCE',
            description: 'Số tiền rút tối thiểu (VND)',
            type: 'number',
            isPublic: true,
        },
        {
            key: 'support_email',
            value: 'admin@mmo.com',
            group: 'SUPPORT',
            description: 'Email hỗ trợ kỹ thuật',
            type: 'string',
            isPublic: true,
        },
        {
            key: 'support_telegram',
            value: 'https://t.me/admin',
            group: 'SUPPORT',
            description: 'Link Telegram hỗ trợ',
            type: 'string',
            isPublic: true,
        },
    ];

    for (const setting of settings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            update: {}, // Don't overwrite if exists
            create: setting,
        });
    }

    // Create Admin User
    const adminPassword = await argon2.hash('admin123', {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
    });

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            role: 'ADMIN',
            status: 'ACTIVE',
            password: adminPassword, // Force update password
        },
        create: {
            username: 'admin',
            email: 'admin@mmo.com',
            password: adminPassword,
            role: 'ADMIN',
            balance: 100000000,
            status: 'ACTIVE',
        },
    });

    // Create Categories based on User Screenshot
    const categories = [
        // SẢN PHẨM
        { name: 'Tài khoản', slug: 'tai-khoan' },
        { name: 'Email', slug: 'email-accounts' }, // Avoid duplicate slug if 'email' exists
        { name: 'Clone', slug: 'clone' },
        { name: 'Tools', slug: 'tools' },
        { name: 'Proxy & VPN', slug: 'proxy-vpn' },
        { name: 'Phần mềm', slug: 'software-product' },

        // DỊCH VỤ
        { name: 'Nâng cấp tài khoản', slug: 'nang-cap-tai-khoan' },
        { name: 'Dịch vụ phần mềm', slug: 'dich-vu-phan-mem' },
        { name: 'Tool/Script Auto', slug: 'tool-script-auto' },
        { name: 'VPS', slug: 'vps' },
        { name: 'Tăng tương tác', slug: 'tang-tuong-tac' },
        { name: 'Seo', slug: 'seo' },
        { name: 'Marketing', slug: 'marketing' },
        { name: 'Blockchain', slug: 'blockchain' },

        { name: 'Khác', slug: 'other-general' },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name },
            create: cat,
        });
    }
    console.log('Detailed Categories created/updated.');

    console.log('Seeding finished.');
    console.log('Admin user created/updated:', admin.username);
    console.log('Password: admin123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
