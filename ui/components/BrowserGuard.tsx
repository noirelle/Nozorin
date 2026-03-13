'use client';

import React, { useEffect, useState } from 'react';
import { Compass, ExternalLink, MoreVertical, AlertTriangle } from 'lucide-react';
import { isInAppBrowser, getInAppBrowserName } from '@/utils/browser';

interface BrowserGuardProps {
    userAgent?: string | null;
}

export const BrowserGuard: React.FC<BrowserGuardProps> = ({ userAgent }) => {
    const browserName = getInAppBrowserName(userAgent) || 'In-App';

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-zinc-950 p-6 overflow-y-auto">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-pink-500/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
                <div className="bg-white/95 backdrop-blur-2xl rounded-[48px] p-8 md:p-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/20">
                    
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-8">
                            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center ring-8 ring-rose-50/50 rotate-3">
                                <AlertTriangle className="w-10 h-10 text-rose-500" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center -rotate-12 border border-zinc-100">
                                <Compass className="w-5 h-5 text-zinc-900" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight leading-none mb-6">
                            Restricted <br />
                            <span className="text-rose-500 italic">Environment</span>
                        </h2>

                        <p className="text-zinc-500 font-semibold leading-relaxed mb-10 text-base">
                            Oops! You're using the <span className="text-zinc-900 underline decoration-rose-500/30 decoration-4 underline-offset-4">{browserName} browser</span>. 
                            Our application requires advanced permissions not supported here.
                        </p>

                        <div className="w-full space-y-6">
                            <div className="bg-zinc-50/50 rounded-[32px] p-8 border border-zinc-100 relative">
                                <div className="absolute top-0 right-10 -translate-y-1/2 px-4 py-1 bg-zinc-900 text-[10px] font-black text-white uppercase tracking-[0.2em] rounded-full">
                                    Solution
                                </div>
                                
                                <div className="space-y-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-zinc-100 flex items-center justify-center text-sm font-black text-rose-500 shrink-0">1</div>
                                        <p className="text-left text-sm text-zinc-600 font-bold leading-tight">
                                            Tap the <span className="inline-flex items-center px-2 py-1 bg-white border border-zinc-200 rounded-lg mx-1 shadow-sm"><MoreVertical className="w-4 h-4 text-zinc-900" /></span> menu in the corner
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-zinc-100 flex items-center justify-center text-sm font-black text-rose-500 shrink-0">2</div>
                                        <p className="text-left text-sm text-zinc-600 font-bold leading-tight">
                                            Select <span className="text-zinc-900 font-black uppercase tracking-tight italic">"Open in Browser"</span> to unlock full access
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full py-5 bg-zinc-900 text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-zinc-900/10 flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Refresh After Switching
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="mt-10 flex flex-col items-center gap-2">
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        Experience Nozorin as intended
                    </p>
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-zinc-900/10 flex items-center justify-center opacity-40">
                           <span className="text-[10px] font-black">CH</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-900/10 flex items-center justify-center opacity-40">
                           <span className="text-[10px] font-black">SF</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
