
'use client';

// Force update

import { useState, useEffect, useCallback } from 'react';
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
import { socket } from '../lib/socket';
import { IncomingCallOverlay } from '../features/direct-call/components/IncomingCallOverlay';
import { OutgoingCallOverlay } from '../features/direct-call/components/OutgoingCallOverlay';


export default function Home() {
  const router = useRouter();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleCloseHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  // History hooks
  const { token, ensureToken, refreshUser } = useUser();

  const {
    history,
    stats,
    isLoading,
    error,
    fetchHistory,
    fetchStats,
    clearHistory
  } = useHistory(socket(), token, async () => null);

  // Direct Call hook
  const {
    incomingCall,
    isCalling,
    error: callError,
    initiateCall,
    acceptCall: performAcceptCall,
    declineCall: performDeclineCall,
    cancelCall,
    clearCallState
  } = useDirectCall(socket(), handleCloseHistory);

  // Handle successful match-found for direct calls
  useEffect(() => {
    const s = socket();
    if (!s) return;

    const handleMatchFound = (data: any) => {
      // 1. Close history modal first for a smooth transition
      setIsHistoryOpen(false);
      // 2. Clear any active "Calling..." overlays immediately
      clearCallState();

      console.log('[Home] Match found via direct call, redirecting to app...');

      // Store match data to pass to the App route
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingMatch', JSON.stringify(data));
      }

      router.push('/app');
    };

    const handleIdentifySuccess = () => {
      console.log('[Home] Identification successful');
    };

    s.on('match-found', handleMatchFound);
    s.on('identify-success', handleIdentifySuccess);

    return () => {
      s.off('match-found', handleMatchFound);
      s.off('identify-success', handleIdentifySuccess);
    };
  }, [router, clearCallState]);

  // Identify user to socket
  useEffect(() => {
    // Force specific public socket initialization
    const s = socket(null);
    if (!s) return;

    // If we were previously authenticated (connected with a token), we should reconnect cleanly as public
    // We can check s.auth or just force a reconnect if we want to be safe
    // For now, let's ensure we update the auth object (done by socket(null)) and if connected, 
    // we might want to stay connected if public stats are allowed, OR strictly disconnect.
    // User said: "switch to the public connection". This implies a state change.

    // We do NOT want to identify.
    // We definitely want to stop media if it was active (handled by Room unmount, but let's be safe?)
    // Mic permission is stopped by Room unmount.

    if (!s.connected) {
      s.connect();
    } else {
      // If connected, we might have old auth? 
      // socket.io doesn't auto-update session on .auth change without reconnect.
      // So we should probably disconnect and reconnect to be truly "public" / anonymous.
      s.disconnect();
      s.connect();
    }

    // No identification logic here.

    const onStorageChange = (e: StorageEvent) => {
      // Just listen for changes, but don't auto-login on Home
    };

    const onFocus = () => {
      // No identification on focus for Home
    };

    // s.on('connect', identify); // Removed
    // s.on('auth-error', handleAuthError); // Removed, we don't expect auth errors on public
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorageChange);

    return () => {
      // s.off(...);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorageChange);
    };
  }, []); // Run once on mount


  const handleJoin = async () => {
    // Always ensure we have a token before joining
    await ensureToken();
    router.push('/app');
  };

  const handleNavigateToHistory = () => {
    setIsHistoryOpen(true);
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

      {/* Global Overlays */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        stats={stats}
        isLoading={isLoading}
        error={error}
        onClearHistory={clearHistory}
        onRefresh={() => {
          fetchHistory();
          fetchStats();
        }}
        onCall={(targetId: string) => initiateCall(targetId, 'voice')}
        onAddFriend={() => { }}
        friends={[]}
        pendingRequests={[]}
        isConnected={false} // Not in room on landing page
      />

      {incomingCall && (
        <IncomingCallOverlay
          fromCountry={incomingCall.fromCountry}
          fromCountryCode={incomingCall.fromCountryCode}
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
