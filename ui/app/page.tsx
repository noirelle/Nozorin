'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Hero from '../sections/Hero';
import { useUser } from '../hooks';


export default function Home() {
    const router = useRouter();
    const { token, ensureToken, user, isChecking } = useUser({ skipCheck: false });

    useEffect(() => {
        if (user) {
            router.push('/app/voice');
        }
    }, [user, router]);

    const handleJoin = async () => {
        await ensureToken();
        router.push('/app/voice');
    };

    // Prevent blink for logged-in users while checking or waiting for redirect
    if (isChecking || user) {
        return null;
    }

    return (
        <main className="min-h-screen bg-white font-sans selection:bg-pink-100 flex flex-col items-center justify-center">
            <Hero onJoin={handleJoin} />
        </main>
    );
}
