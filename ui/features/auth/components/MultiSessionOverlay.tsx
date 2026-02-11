'use client';

import React, { useState } from 'react';

interface MultiSessionOverlayProps {
    onReconnect: () => void;
    reason?: 'conflict' | 'kicked';
}

export const MultiSessionOverlay: React.FC<MultiSessionOverlayProps> = ({ onReconnect, reason = 'kicked' }) => {
    const [isReconnecting, setIsReconnecting] = useState(false);

    const handleReconnect = () => {
        setIsReconnecting(true);
        onReconnect();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#18181b] p-8 rounded-3xl border border-white/10 shadow-2xl w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 text-amber-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                    {reason === 'conflict' ? 'Active Session Found' : 'Connection Lost'}
                </h2>
                <p className="text-zinc-400 mb-8 text-center leading-relaxed">
                    {reason === 'conflict'
                        ? 'You are already connected in another tab or device. Would you like to reconnect here?'
                        : 'You have been disconnected because a new session was started in another tab or device.'}
                </p>

                <button
                    onClick={handleReconnect}
                    disabled={isReconnecting}
                    className="w-full py-4 bg-[#FF8ba7] hover:bg-[#ff7a99] disabled:bg-zinc-700 disabled:opacity-50 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-pink-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                    {isReconnecting ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>Connecting...</span>
                        </>
                    ) : 'Reconnect Here'}
                </button>

                <p className="mt-4 text-xs text-zinc-500 uppercase tracking-widest font-medium">
                    Single Session Only
                </p>
            </div>
        </div>
    );
};
