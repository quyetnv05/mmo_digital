'use client';

import { SessionProvider, useSession, signOut, signIn } from 'next-auth/react';
import { useContext, createContext } from 'react';
import { useRouter } from 'next/navigation';

// 1. The Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}

// 2. Compatibility Hook (Adapting NextAuth to old useAuth interface)
// This allows existing components using useAuth() to keep working while switching to NextAuth.
export function useAuth() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated';

    // Map NextAuth user to your App's User interface
    const user = session?.user ? {
        ...session.user,
        id: (session.user as any).id as string,
        username: (session.user as any).username || session.user.name,
        role: (session.user as any).role,
        balance: (session.user as any).balance,
    } : null;

    const login = () => {
        signIn(); // Redirects to NextAuth login page
    };

    const logout = async () => {
        await signOut({ callbackUrl: '/auth/login' });
    };

    return {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
    };
}
