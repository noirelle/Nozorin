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
import { HistoryDrawer } from '../features/call-room/components/HistoryDrawer';
import { useHistory, useUser, useDirectCall } from '../hooks';
import { useSocketEvent, SocketEvents } from '../lib/socket';
import { getSocketClient } from '../lib/socket/core/socketClient';
import { IncomingCallOverlay } from '../features/direct-call/components/IncomingCallOverlay';
import { OutgoingCallOverlay } from '../features/direct-call/components/OutgoingCallOverlay';


export default function Home() {
    const router = useRouter();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const handleCloseHistory = useCallback(() => {
        setIsHistoryOpen(false);
    }, []);

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
    } = useDirectCall(handleCloseHistory);

    const handleMatchFound = useCallback((data: any) => {
        setIsHistoryOpen(false);
        clearCallState();
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pendingMatch', JSON.stringify(data));
        }
        router.push('/app');
    }, [router, clearCallState]);

    const handleIdentifySuccess = useCallback(() => {
        console.log('[Home] Identification successful');
    }, []);

    useSocketEvent(SocketEvents.MATCH_FOUND, handleMatchFound);
    useSocketEvent(SocketEvents.IDENTIFY_SUCCESS, handleIdentifySuccess);

    const handleJoin = async () => {
        await ensureToken();
        router.push('/app');
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

            <HistoryDrawer
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                stats={stats}
                isLoading={isLoading}
                error={error}
                onClearHistory={clearHistory}
                onRefresh={fetchHistory}
                onCall={(targetId: string) => initiateCall(targetId, 'voice')}
                onAddFriend={() => { }}
                friends={[]}
                pendingRequests={[]}
                sentRequests={[]}
                isConnected={false}
            />

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
