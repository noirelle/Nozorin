
'use client';

import { useState } from 'react';

import Room from '../components/Room';
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

  const handleJoin = (selectedMode: 'chat' | 'video') => {
    setMode(selectedMode);
    setIsInRoom(true);
  };

  const handleLeave = () => {
    setIsInRoom(false);
    // Ideally disconnect socket here or in Room's unmount
  };

  if (isInRoom) {
    return (
      <main className="min-h-screen bg-white">
        <Room mode={mode} onLeave={handleLeave} />
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
