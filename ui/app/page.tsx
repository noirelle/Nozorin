'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import Navbar from '../components/Navbar';
import Hero from '../sections/Hero';
import AppFeatures from '../sections/AppFeatures';
import SocialProof from '../sections/SocialProof';
import AboutUs from '../sections/AboutUs';
import OurStory from '../sections/OurStory';
import Dedications from '../sections/Dedications';
import Footer from '../sections/Footer';
import { useHistory, useUser, useDirectCall } from '../hooks';
import { useSocketEvent, SocketEvents } from '../lib/socket';
import { getSocketClient } from '../lib/socket/core/socketClient';
import { IncomingCallOverlay } from '../features/direct-call/components/IncomingCallOverlay';
import { OutgoingCallOverlay } from '../features/direct-call/components/OutgoingCallOverlay';


export default function Home() {
    const router = useRouter();

    const { token, ensureToken, user } = useUser({ skipCheck: true });

    const {
        history,
        stats,
        isLoading,
        error,
        fetchHistory,
        clearHistory
    } = useHistory(token, user?.id, async () => null);

    const {
        incomingCall,
        isCalling,
        error: callError,
        initiateCall,
        acceptCall: performAcceptCall,
        declineCall: performDeclineCall,
        cancelCall,
        clearCallState
    } = useDirectCall();

    const handleMatchFound = useCallback((data: any) => {
        clearCallState();
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pendingMatch', JSON.stringify(data));
        }
        router.push('/explore/call');
    }, [router, clearCallState]);

    const handleIdentifySuccess = useCallback(() => {
        console.log('[Home] Identification successful');
    }, []);

    useSocketEvent(SocketEvents.MATCH_FOUND, handleMatchFound);
    useSocketEvent(SocketEvents.IDENTIFY_SUCCESS, handleIdentifySuccess);

    const handleJoin = async () => {
        await ensureToken();
        router.push('/explore/call');
    };

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

            {incomingCall && (
                <IncomingCallOverlay
                    from_username={incomingCall.from_username}
                    from_avatar={incomingCall.from_avatar}
                    from_country_name={incomingCall.from_country_name}
                    from_country={incomingCall.from_country}
                    mode={incomingCall.mode}
                    onAccept={performAcceptCall}
                    onDecline={performDeclineCall}
                    error={callError}
                />
            )}

            {isCalling && (
                <OutgoingCallOverlay
                    onCancel={cancelCall}
                    error={callError}
                />
            )}
        </main>
    );
}
