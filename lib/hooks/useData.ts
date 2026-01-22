import useSWR from 'swr';

interface UserBalance {
    balance: number;
    pendingBalance: number;
}

interface UserData {
    id: number;
    username: string;
    email: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    balance: number;
    pendingBalance: number;
}

// Hook to fetch current user data with realtime updates
export function useUser() {
    const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: UserData }>(
        '/api/auth/profile'
    );

    return {
        user: data?.data,
        isLoading,
        isError: error,
        mutate,
    };
}

// Hook to fetch only balance (lighter)
export function useBalance() {
    const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: UserBalance }>(
        '/api/user/balance'
    );

    return {
        balance: data?.data?.balance ?? 0,
        pendingBalance: data?.data?.pendingBalance ?? 0,
        isLoading,
        isError: error,
        mutate,
    };
}

// Hook to fetch products
export function useProducts(categoryId?: number) {
    const url = categoryId ? `/api/products?categoryId=${categoryId}` : '/api/products';

    const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: any[] }>(url);

    return {
        products: data?.data ?? [],
        isLoading,
        isError: error,
        mutate,
    };
}

// Hook to fetch orders
export function useOrders() {
    const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: any[] }>(
        '/api/orders'
    );

    return {
        orders: data?.data ?? [],
        isLoading,
        isError: error,
        mutate,
    };
}
