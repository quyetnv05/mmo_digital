'use client';

import { SWRConfig } from 'swr';

// Default fetcher for SWR
const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        throw error;
    }
    return res.json();
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                fetcher,
                refreshInterval: 5000, // Refresh every 5 seconds for realtime updates
                revalidateOnFocus: true,
                revalidateOnReconnect: true,
                dedupingInterval: 2000,
            }}
        >
            {children}
        </SWRConfig>
    );
}
