'use client';

import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';

const TIMEOUT_MS = 3600 * 1000; // 1 Hour

export default function SessionTimeoutHandler() {
    const { data: session } = useSession();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!session) return;

        const resetTimer = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                console.log('Session timeout due to inactivity. Signing out...');
                signOut({ callbackUrl: '/auth/login' });
            }, TIMEOUT_MS);
        };

        // Initialize timer
        resetTimer();

        // Listen for events
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        const handleActivity = () => resetTimer();

        events.forEach((event) => window.addEventListener(event, handleActivity));

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach((event) => window.removeEventListener(event, handleActivity));
        };
    }, [session]);

    return null; // This component handles logic only, no UI
}
