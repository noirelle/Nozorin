
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
    const s = socket(token);
    if (!s) return;

    // Ensure we connect (auth is optional for home page stats)
    if (!s.connected) {
      s.connect();
    }

    const identify = () => {
      if (token) {
        s.emit('user-identify', { token });
      }
    };

    const handleAuthError = async (err: any) => {
      if (err?.message === 'Authentication error: Invalid token' || err?.message === 'jwt expired') {
        console.log('[Home] Token invalid/expired, attempting refresh...');
        const newToken = await refreshUser();
        if (newToken) {
          socket(newToken);
          s.emit('update-token', { token: newToken });
        } else {
          s.disconnect();
        }
      }
    };

    if (s.connected && token) {
      identify();
    }

    const interval = setInterval(() => {
      if (s.connected && token) {
        identify();
      }
    }, 10000);

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === 'nz_token') {
        console.log('[Home] Token changed in another tab, re-identifying...');
        window.location.reload();
      }
    };

    const onFocus = () => {
      console.log('[Home] Re-verifying session on focus...');
      if (s.connected && token) identify();
    };

    s.on('connect', identify);
    s.on('auth-error', handleAuthError);
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorageChange);

    return () => {
      s.off('connect', identify);
      s.off('auth-error', handleAuthError);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorageChange);
      clearInterval(interval);
    };
  }, [token, refreshUser]);

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
