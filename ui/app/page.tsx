
'use client';

import { useState } from 'react';

import Room from '../features/video-room/components/Room';
import ChatRoom from '../features/chat/components/ChatRoom';
import Navbar from '../components/Navbar';
import Hero from '../sections/Hero';
import AppFeatures from '../sections/AppFeatures';
import SocialProof from '../sections/SocialProof';
import AboutUs from '../sections/AboutUs';
import OurStory from '../sections/OurStory';

import Footer from '../sections/Footer';

export default function Home() {
  const [isInRoom, setIsInRoom] = useState(false);
  const [mode, setMode] = useState<'chat' | 'video'>('chat');
  const [activeView, setActiveView] = useState<'video' | 'chat'>('video'); // Track which UI is active

  const handleJoin = (selectedMode: 'chat' | 'video') => {
    setMode(selectedMode);
    setActiveView(selectedMode === 'video' ? 'video' : 'chat');
    setIsInRoom(true);
  };

  const handleLeave = () => {
    setIsInRoom(false);
    // Ideally disconnect socket here or in Room's unmount
  };

  const handleSwitchToChat = () => {
    setActiveView('chat');
  };

  const handleSwitchToVideo = () => {
    setActiveView('video');
  };

  const handleNavigateToHistory = () => {
    // TODO: Implement history view
    console.log('Navigate to history');
  };

  if (isInRoom) {
    return (
      <main className="min-h-screen bg-white">
        {activeView === 'video' ? (
          <Room
            mode={mode}
            onLeave={handleLeave}
            onNavigateToChat={handleSwitchToChat}
            onNavigateToHistory={handleNavigateToHistory}
          />
        ) : (
          <ChatRoom
            onNavigateToVideo={handleSwitchToVideo}
            onNavigateToHistory={handleNavigateToHistory}
          />
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white font-sans selection:bg-pink-100">
      <Navbar />
      <Hero onJoin={handleJoin} />
      <AppFeatures />
      <SocialProof />
      <AboutUs />
      <OurStory />
      <Footer />
    </main>
  );
}
