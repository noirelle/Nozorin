
'use client';

import { useState, useEffect, useCallback } from 'react';

import Room from '../features/video-room/components/Room';
import ChatRoom from '../features/chat/components/ChatRoom';
import Navbar from '../components/Navbar';
import Hero from '../sections/Hero';
import AppFeatures from '../sections/AppFeatures';
import SocialProof from '../sections/SocialProof';
import AboutUs from '../sections/AboutUs';
import OurStory from '../sections/OurStory';
import Dedications from '../sections/Dedications';
import Footer from '../sections/Footer';
import { HistoryModal } from '../features/video-room/components/HistoryModal';
import { useHistory, useVisitorAuth, useDirectCall } from '../hooks';
import { socket } from '../lib/socket';
import { IncomingCallOverlay } from '../features/direct-call/components/IncomingCallOverlay';
import { OutgoingCallOverlay } from '../features/direct-call/components/OutgoingCallOverlay';
import { MultiSessionOverlay } from '../features/auth/components/MultiSessionOverlay';

export default function Home() {
  const [isInRoom, setIsInRoom] = useState(false);
  const [mode, setMode] = useState<'chat' | 'video'>('chat');
  const [activeView, setActiveView] = useState<'video' | 'chat'>('video'); // Track which UI is active
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [directMatchData, setDirectMatchData] = useState<any>(null);
  const [sessionError, setSessionError] = useState<'conflict' | 'kicked' | null>(null);
  const [isConnected, setIsConnected] = useState(false); // Track connection state from Room/ChatRoom

  const handleCloseHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  // History hooks
  const { visitorToken, ensureToken, regenerateToken } = useVisitorAuth();

  const handleForceReconnect = useCallback(() => {
    const s = socket();
    if (s && visitorToken) {
      console.log('[Home] Forcing reconnect...');
      s.emit('force-reconnect', { token: visitorToken });
      setSessionError(null);
    }
  }, [visitorToken]);

  const {
    history,
    stats,
    isLoading,
    error,
    fetchHistory,
    fetchStats,
    clearHistory
  } = useHistory(socket(), visitorToken, regenerateToken);

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

      if (!isInRoom) {
        console.log('[Home] Match found via direct call, entering room...');
        // Store data to pass to Room component
        setDirectMatchData(data);
        // Set mode and view
        setMode(data.mode);
        setActiveView(data.mode === 'video' ? 'video' : 'chat');
        // Transition to room
        setIsInRoom(true);
      }
    };

    const handleMultiSession = () => {
      console.warn('[Home] Multi-session detected (kicked), blocking UI...');
      setSessionError('kicked');
      setIsInRoom(false); // Force exit room if inside
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
  }, [isInRoom]);

  // Identify user to socket when token is available or socket reconnects
  useEffect(() => {
    const s = socket();
    if (!s) return;

    const identify = () => {
      if (visitorToken) {
        console.log('[Home] Identifying socket...', s.id);
        s.emit('user-identify', { token: visitorToken });
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
      if (e.key === 'nozorin_visitor_token') {
        console.log('[Home] Visitor token changed in another tab, re-identifying...');
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
  }, [visitorToken, sessionError]);

  const handleJoin = async (selectedMode: 'chat' | 'video') => {
    // Always ensure we have a token before joining
    await ensureToken();

    setMode(selectedMode);
    setActiveView(selectedMode === 'video' ? 'video' : 'chat');
    setIsInRoom(true);
  };

  const handleLeave = () => {
    setIsInRoom(false);
    setIsConnected(false);
    setDirectMatchData(null);
    // Ideally disconnect socket here or in Room's unmount
  };

  const handleSwitchToChat = () => {
    setActiveView('chat');
  };

  const handleSwitchToVideo = () => {
    setActiveView('video');
  };

  const handleNavigateToHistory = () => {
    setIsHistoryOpen(true);
  };

  return (
    <main className="min-h-screen bg-white font-sans selection:bg-pink-100">
      {isInRoom ? (
        activeView === 'video' ? (
          <Room
            mode={mode}
            onLeave={handleLeave}
            onNavigateToChat={handleSwitchToChat}
            onNavigateToHistory={handleNavigateToHistory}
            initialMatchData={directMatchData}
            onConnectionChange={setIsConnected}
          />
        ) : (
          <ChatRoom
            onNavigateToVideo={handleSwitchToVideo}
            onNavigateToHistory={handleNavigateToHistory}
            onConnectionChange={setIsConnected}
          />
        )
      ) : (
        <>
          <Navbar />
          <Hero onJoin={handleJoin} />
          <AppFeatures />
          <SocialProof />
          <AboutUs />
          <Dedications />
          <OurStory />
          <Footer />
        </>
      )}

      {/* Global Overlays (Available in both Landing and Room views) */}
      <HistoryModal
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
        onCall={(targetId, m) => initiateCall(targetId, m)}
        isConnected={isConnected}
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
