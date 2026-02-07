
import React from 'react';

interface LobbyProps {
    onJoin: (mode: 'chat' | 'video') => void;
}

export default function Lobby({ onJoin }: LobbyProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-4xl font-bold mb-8 tracking-wide">Omegle Clone</h1>
            <p className="text-gray-400 mb-12 text-lg">Talk to strangers!</p>

            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
                <button
                    onClick={() => onJoin('chat')}
                    className="flex-1 px-8 py-6 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xl transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                    <span>💬</span>
                    Text Chat
                </button>

                <button
                    onClick={() => onJoin('video')}
                    className="flex-1 px-8 py-6 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-xl transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                    <span>📹</span>
                    Video Chat
                </button>
            </div>

            <div className="mt-12 text-gray-500 text-sm">
                <p>18+ only. Moderated.</p>
            </div>
        </div>
    );
}
