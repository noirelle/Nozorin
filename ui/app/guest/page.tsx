'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogoIcon } from '../../components/icons';

export default function GuestPage() {
    const [status, setStatus] = useState('Registering guest session...');

    useEffect(() => {
        const timer = setTimeout(() => {
            setStatus('Ready to connect!');
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <main className="h-[100dvh] max-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-pink-50/50 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-50/20 rounded-full blur-3xl opacity-40"></div>
            </div>

            <div className="w-full max-w-xl flex flex-col h-full">
                {/* Logo */}
                <div className="flex justify-center pt-4 mb-2 md:mb-12 shrink-0">
                    <Link href="/">
                        <LogoIcon className="w-10 h-10 md:w-14 md:h-14 shadow-2xl shadow-pink-100 rounded-2xl" />
                    </Link>
                </div>

                <div className="flex-1 flex flex-col justify-center overflow-hidden px-2 text-center">
                    {/* Status Message */}
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full font-bold text-xs uppercase tracking-widest animate-in fade-in zoom-in duration-500">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            {status === 'Ready to connect!' ? 'Identity Verified' : 'Standard Guest'}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight tracking-tighter">
                            {status === 'Ready to connect!' ? "You're all set!" : "Just a moment..."}
                        </h1>
                        <p className="text-gray-400 font-bold text-sm md:text-sm uppercase tracking-[0.2em] px-4 mb-8">
                            {status === 'Ready to connect!'
                                ? "Your connection is now private and ready."
                                : "Setting up a secure session."}
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className={`transition-all duration-700 transform ${status === 'Ready to connect!' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <div className="mt-8">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center px-8 py-5 bg-[#FF8ba7] hover:bg-[#ff7b9c] text-white rounded-[2rem] font-black text-lg md:text-xl shadow-2xl shadow-pink-200 hover:shadow-pink-300 transition-all hover:-translate-y-1 active:scale-95 group"
                            >
                                Start Connecting
                                <svg className="ml-3 w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </Link>
                            <p className="mt-6 text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
                                Return to lobby
                            </p>
                        </div>
                    </div>

                    {/* Subtle loading indicator */}
                    {status !== 'Ready to connect!' && (
                        <div className="flex justify-center gap-1 mt-8">
                            <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce delay-150"></div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
