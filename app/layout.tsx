import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
    title: "MMO Digital Marketplace",
    description: "Nền tảng marketplace tài nguyên số MMO với giao dịch tự động",
};

import { AuthProvider } from '@/components/providers/AuthProvider';
import ChatWidget from '@/components/ChatWidget';

// ... (imports)

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // Thêm suppressHydrationWarning để sửa lỗi Hydration Mismatch từ extension
        <html lang="vi" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <AuthProvider>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: '#1e293b',
                                color: '#f1f5f9',
                                border: '1px solid #334155',
                            },
                            success: {
                                iconTheme: { primary: '#22c55e', secondary: '#1e293b' },
                            },
                            error: {
                                iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
                            },
                        }}
                    />
                    {children}
                    <ChatWidget />
                </AuthProvider>
            </body>
        </html>
    );
}