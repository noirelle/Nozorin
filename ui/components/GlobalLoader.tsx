'use client';

import React from 'react';

export const GlobalLoader = () => (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
        <div className="relative flex flex-col items-center">
            {/* Pulsing Logo or Icon */}
            <div className="w-20 h-20 mb-8 relative">
                <div className="absolute inset-0 bg-pink-400 rounded-3xl animate-pulse opacity-15" />
                <img src="/nozorin_logo.svg" alt="Nozorin Logo" className="w-20 h-20 animate-pulse relative z-10" />
            </div>

            {/* Progress/Loading Text */}
            <div className="flex flex-col items-center gap-3">
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 animate-pulse">
                    Initializing Session
                </span>
            </div>
        </div>
    </div>
);
