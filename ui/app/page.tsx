
'use client';

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
import { MultiSessionOverlay } from '../features/auth/components/MultiSessionOverlay';

export default function Home() {
  const router = useRouter();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sessionError, setSessionError] = useState<'conflict' | 'kicked' | null>(null);

  const handleCloseHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  // History hooks
  const { token, ensureToken } = useUser();

  const handleForceReconnect = useCallback(() => {
    const s = socket();
    if (s && token) {
      console.log('[Home] Forcing reconnect...');

      // Ensure socket is connected.
      if (!s.connected) {
        s.connect();
      }

      s.emit('force-reconnect', { token });

      // Fallback: If after 3 seconds we are still in an error state, just reload
      setTimeout(() => {
        if (sessionError) {
          console.log('[Home] Reconnect timeout, reloading page...');
          window.location.reload();
        }
      }, 3000);

      setSessionError(null);
    }
  }, [token, sessionError]);

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

    const handleMultiSession = () => {
      console.warn('[Home] Multi-session detected (kicked), blocking UI...');
      setSessionError('kicked');
    };

    const handleSessionConflict = () => {
      console.warn('[Home] Session conflict detected (new tab), blocking UI...');
      setSessionError('conflict');
    };

    const handleIdentifySuccess = () => {
      console.log('[Home] Identification successful');
      setSessionError(null);
    };

    s.on('match-found', handleMatchFound);
    s.on('multi-session', handleMultiSession);
    s.on('session-conflict', handleSessionConflict);
    s.on('identify-success', handleIdentifySuccess);

    return () => {
      s.off('match-found', handleMatchFound);
      s.off('multi-session', handleMultiSession);
      s.off('session-conflict', handleSessionConflict);
      s.off('identify-success', handleIdentifySuccess);
    };
  }, [router, clearCallState]);

  // Identify user to socket when token is available or socket reconnects
  useEffect(() => {
    const s = socket();
    if (!s) return;

    const identify = () => {
      if (token) {
        console.log('[Home] Identifying socket...', s.id);
        s.emit('user-identify', { token });
      }
    };

    // Run once on load/token change
    identify();

    // Re-verify on focus (robustness against background tab throttling)
    const onFocus = () => {
      console.log('[Home] Re-verifying session on focus...');
      identify();
    };

    // Periodic check (every 10s) to catch overlaps missed by events
    const interval = setInterval(() => {
      if (s.connected && !sessionError) {
        identify();
      }
    }, 10000);

    // Watch for localStorage changes from other tabs
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === 'nz_token') {
        console.log('[Home] Token changed in another tab, re-identifying...');
        window.location.reload(); // Hard reset is safest if identity changes
      }
    };

    s.on('connect', identify);
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorageChange);

    return () => {
      s.off('connect', identify);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorageChange);
      clearInterval(interval);
    };
  }, [token, sessionError]);

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

      {sessionError && (
        <MultiSessionOverlay
          onReconnect={handleForceReconnect}
          reason={sessionError}
        />
      )}
    </main>
  );
}
