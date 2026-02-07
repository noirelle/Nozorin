
'use client';

import { useState } from 'react';
import Lobby from '../components/Lobby';
import Room from '../components/Room';

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

  return (
    <main className="min-h-screen bg-gray-900">
      {!isInRoom ? (
        <Lobby onJoin={handleJoin} />
      ) : (
        <Room mode={mode} onLeave={handleLeave} />
      )}
    </main>
  );
}
