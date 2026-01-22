'use client';

import Sidebar from './Sidebar';
import Header from './Header';
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { SWRProvider } from '@/components/providers/SWRProvider';
import { useState, useEffect } from 'react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

function DashboardContent({ children }: DashboardLayoutProps) {
    const { user, isLoading } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) {
                setSidebarCollapsed(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Use real user data or fallback to Guest/Buyer for display to avoid crashing
    // Middleware protects the route so user should be present usually
    const currentUserRole = user?.role || 'BUYER';
    const currentUsername = user?.username || 'Guest';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Sidebar */}
            <Sidebar userRole={currentUserRole} />

            {/* Main Content */}
            <div
                className={`
            transition-all duration-300
            ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
            ml-0
          `}
            >
                {/* Header */}
                <Header username={currentUsername} />

                {/* Page Content */}
                <main className="p-4 lg:p-6">{children}</main>
            </div>

            {/* Mobile Overlay */}
            {isMobile && !sidebarCollapsed && (
                <div
                    className="fixed inset-0 z-30 bg-black/50"
                    onClick={() => setSidebarCollapsed(true)}
                />
            )}
        </div>
    );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <SWRProvider>
            <AuthProvider>
                <DashboardContent>{children}</DashboardContent>
            </AuthProvider>
        </SWRProvider>
    );
}
