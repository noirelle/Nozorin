'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Navbar from '../components/Navbar';
import Hero from '../sections/Hero';
import AppFeatures from '../sections/AppFeatures';
import SocialProof from '../sections/SocialProof';
import AboutUs from '../sections/AboutUs';
import OurStory from '../sections/OurStory';
import Dedications from '../sections/Dedications';
import Footer from '../sections/Footer';
import { useHistory, useUser } from '../hooks';
import { useSocketEvent, SocketEvents } from '../lib/socket';


export default function Home() {
    const router = useRouter();
    const { token, ensureToken, user, isChecking } = useUser({ skipCheck: false });

    useEffect(() => {
        if (user) {
            router.push('/app');
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
        console.log('[Home] Identification successful');
    }, []);

    useSocketEvent(SocketEvents.MATCH_FOUND, handleMatchFound);
    useSocketEvent(SocketEvents.IDENTIFY_SUCCESS, handleIdentifySuccess);

    const handleJoin = async () => {
        await ensureToken();
        router.push('/app');
    };

    // Prevent blink for logged-in users while checking or waiting for redirect
    if (isChecking || user) {
        return null; // A completely empty render to prevent layout flashing, router.push runs in background
    }

    return (
        <main className="min-h-screen bg-white font-sans selection:bg-pink-100">
            <Navbar />
            <Hero onJoin={handleJoin} />
            <AppFeatures />
            <SocialProof />
            <AboutUs />
            <Dedications />
            <OurStory />
            <Footer />
        </main>
    );
}
