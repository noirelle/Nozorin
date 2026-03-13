'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Hero from './Hero';
import { useHistory, useUser } from '../hooks';
import { useSocketEvent, SocketEvents } from '../lib/socket';

export default function HomeClient() {
    const router = useRouter();
    const { token, ensureToken, user, isChecking } = useUser({ skipCheck: false });

    useEffect(() => {
        if (user) {
            router.push('/app/voice');
        }
    }, [user, router]);

    const {
        history,
        stats,
        isLoading,
        error,
        fetchHistory,
        clearHistory
    } = useHistory(token, user?.id, async () => null);

    const handleMatchFound = useCallback((data: any) => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pendingMatch', JSON.stringify(data));
        }
        router.push('/app/voice');
    }, [router]);

    const handleIdentifySuccess = useCallback(() => {
    }, []);

    useSocketEvent(SocketEvents.MATCH_FOUND, handleMatchFound);
    useSocketEvent(SocketEvents.IDENTIFY_SUCCESS, handleIdentifySuccess);

    const handleJoin = async () => {
        await ensureToken();
        router.push('/app/voice');
    };

    // Prevent blink for logged-in users while checking or waiting for redirect
    if (isChecking || user) {
        return null; // A completely empty render to prevent layout flashing, router.push runs in background
    }

    return (
        <main className="min-h-screen bg-white font-sans selection:bg-pink-100 flex flex-col items-center justify-center">
            <Hero onJoin={handleJoin} />
        </main>
    );
}
