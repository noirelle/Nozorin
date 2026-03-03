'use client';

import React, { useState, useEffect } from 'react';
import { useSocketEvent, SocketEvents } from '@/lib/socket';
import { LogOut, RefreshCw } from 'lucide-react';

export const MultiSessionGuard = () => {
    const [isDisconnected, setIsDisconnected] = useState(false);
    const [message, setMessage] = useState('');

    useSocketEvent(SocketEvents.MULTI_SESSION, (data: any) => {
        console.warn('[SessionGuard] Multi-session detected, disconnecting...');
        setMessage(data?.message || 'You have been disconnected because a new session was started elsewhere.');
        setIsDisconnected(true);
    });

    if (!isDisconnected) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="max-w-md w-full mx-4 p-8 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(236,72,153,0.15)] border border-pink-50 text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-6">
                    <LogOut className="w-8 h-8 text-pink-500" />
                </div>

                <h2 className="text-2xl font-black text-zinc-900 mb-2">Session Ended</h2>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
                    {message}
                </p>

                <div className="grid grid-cols-1 w-full gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-pink-200"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reconnect Here
                    </button>

                    <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mt-2">
                        Only one active tab is allowed
                    </p>
                </div>
            </div>
        </div>
    );
};
