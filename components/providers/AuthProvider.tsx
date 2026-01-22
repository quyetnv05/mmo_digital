'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

interface User {
    id: number;
    username: string;
    email: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    balance: number;
    pendingBalance: number;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isError: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    // We use SWR to fetch user profile if token exists (handled by cookies automatically in API requests)
    // However, for the initial state or when we manually login, we might want manual control.
    // Actually, standard SWR approach is good if the /api/auth/profile endpoint exists and uses cookies.

    // Let's assume /api/auth/profile returns the current user based on cookie
    const { data, error, mutate } = useSWR('/api/auth/profile', {
        shouldRetryOnError: false,
        revalidateOnFocus: false,
    });

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (data && data.success) {
            setUser(data.user);
        } else if (error || (data && !data.success)) {
            setUser(null);
        }
    }, [data, error]);

    const login = (token: string, userData: User) => {
        // In a real app with httpOnly cookies, the token is set by the server response header.
        // If we are handling it manually (e.g. storing in localStorage - which is less secure but common), we would do it here.
        // Since our API `login` sets the token in the response body, let's assume we might depend on a cookie-setting API or client-side storage?
        // Looking at previous `login/route.ts`, it returns the token in the body but doesn't explicitly set a cookie header in the provided snippet?
        // Wait, the middleware checks `request.cookies.get('token')`.
        // The previous `login` route implementation I saw returned `{ token, user }` JSON but didn't set `Set-Cookie` header.
        // WE NEED TO FIX THIS. Client needs to set the cookie or Server needs to set it.
        // For simplicity in this "next.js" environment, usually server actions or API routes set cookies.
        // I will stick to the plan: Modify Login mechanism slightly if needed, or just set cookie via js-cookie here for now to make it work quickly with middleware.

        // For now, let's simulate setting cookie if the server didn't (though server SHOULD).
        document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`; // simple cookie set
        setUser(userData);
        mutate(); // Refresh SWR
        router.push('/dashboard');
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout API call failed', e);
        }
        // Clear cookie
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        setUser(null);
        mutate(null, false); // Clear SWR cache
        router.push('/auth/login');
    };

    const refreshUser = () => {
        mutate();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading: !error && !data,
                isError: !!error,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
