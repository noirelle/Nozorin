
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

export default function Home() {
  const [isInRoom, setIsInRoom] = useState(false);
  const [mode, setMode] = useState<'chat' | 'video'>('chat');
  const [activeView, setActiveView] = useState<'video' | 'chat'>('video'); // Track which UI is active
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [directMatchData, setDirectMatchData] = useState<any>(null);

  const handleCloseHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  // History hooks
  const { visitorToken, ensureToken, regenerateToken } = useVisitorAuth();
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

    s.on('match-found', handleMatchFound);
    return () => { s.off('match-found', handleMatchFound); };
  }, [isInRoom]);

  // Identify user to socket when token is available
  useEffect(() => {
    const s = socket();
    if (visitorToken && s) {
      s.emit('user-identify', { token: visitorToken });

      // Also fetch history periodically to keep status updated? 
      // For now, let's just do it on room entry or modal open
    }
  }, [visitorToken]);

  const handleJoin = async (selectedMode: 'chat' | 'video') => {
    // Always ensure we have a token before joining
    await ensureToken();

    setMode(selectedMode);
    setActiveView(selectedMode === 'video' ? 'video' : 'chat');
    setIsInRoom(true);
  };

  const handleLeave = () => {
    setIsInRoom(false);
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
          />
        ) : (
          <ChatRoom
            onNavigateToVideo={handleSwitchToVideo}
            onNavigateToHistory={handleNavigateToHistory}
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
