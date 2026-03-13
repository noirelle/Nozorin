'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Compass, ExternalLink, MoreVertical, AlertTriangle, Copy, Check } from 'lucide-react';
import { isInAppBrowser, getInAppBrowserName } from '@/utils/browser';

export const BrowserGuard: React.FC = () => {
    const [shouldShow, setShouldShow] = useState(false);
    const [browserName, setBrowserName] = useState<string>('In-App');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isInAppBrowser()) {
            setShouldShow(true);
            setBrowserName(getInAppBrowserName() || 'In-App');
            // Prevent scrolling on the main page while the guard is active
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'auto';
            };
        }
    }, []);

    const handleCopyLink = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    if (!shouldShow) return null;

    return (
        <div className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center overflow-hidden overscroll-none select-none">
            {/* ── BRANDING ── */}
            <div className="absolute top-[clamp(12px,2vh,20px)] left-[clamp(16px,4vw,24px)] z-30">
                <img src="/nozorin_logo.svg" alt="Nozorin Logo" className="w-[clamp(32px,8vw,48px)] h-[clamp(32px,8vw,48px)]" />
            </div>

            {/* ── DECORATIVE BACKGROUND ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-[#ec4899]/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-[#ec4899]/5 blur-[120px] rounded-full animate-pulse" />
            </div>

            {/* ── CONTENT CONTAINER ── */}
            <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-20 h-20 bg-[#fdf2f8] rounded-[24px] flex items-center justify-center mb-8 ring-8 ring-[#fdf2f8]/50">
                    <AlertTriangle className="w-10 h-10 text-[#ec4899]" />
                </div>

                <h1 className="text-[clamp(1.8rem,6vw,2.5rem)] font-black text-[#1c1e21] leading-[1.1] tracking-tight mb-6 uppercase">
                    Unsupported<br />
                    <span className="text-[#ec4899]">Browser detected.</span>
                </h1>

                <p className="text-[clamp(16px,4vw,18px)] text-[#1c1e21]/60 font-medium leading-relaxed mb-10 max-w-sm">
                    You're using the <span className="text-[#1c1e21] font-bold italic">{browserName}</span> browser. To use voice chat and advanced features, please open Nozorin in <span className="text-[#1c1e21] font-bold">Chrome or Safari</span>.
                </p>

                <div className="w-full space-y-5">
                    {/* Copy Link Button */}
                    <button
                        onClick={handleCopyLink}
                        className={`w-full h-[56px] rounded-full flex items-center justify-center gap-3 font-black text-[15px] tracking-tight transition-all active:scale-[0.98] shadow-sm ${
                            copied 
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                            : 'border-2 border-[#ec4899] text-[#ec4899] hover:bg-[#fdf2f8] shadow-[#ec4899]/10'
                        }`}
                    >
                        {copied ? (
                            <>
                                <Check className="w-5 h-5" />
                                COPIED TO CLIPBOARD
                            </>
                        ) : (
                            <>
                                <Copy className="w-5 h-5" />
                                COPY SITE ADDRESS
                            </>
                        )}
                    </button>

                    {/* Manual Steps Box */}
                    <div className="w-full bg-[#fdf2f8]/40 border-2 border-[#fce7f3] rounded-[32px] p-7 text-left space-y-6">
                        <h3 className="text-[11px] font-black text-[#1c1e21]/40 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Compass className="w-3.5 h-3.5" />
                            How to switch manually
                        </h3>
                        
                        <div className="space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-white border-2 border-[#fce7f3] flex items-center justify-center text-[11px] font-black text-[#ec4899] shrink-0">1</div>
                                <p className="text-[13px] text-[#1c1e21]/70 font-semibold leading-snug">
                                    Tap the <span className="inline-flex items-center p-1 bg-white border border-[#fce7f3] rounded-lg mx-0.5"><MoreVertical className="w-4 h-4 text-[#1c1e21]/40" /></span> menu icon in the top right corner.
                                </p>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-white border-2 border-[#fce7f3] flex items-center justify-center text-[11px] font-black text-[#ec4899] shrink-0">2</div>
                                <p className="text-[13px] text-[#1c1e21]/70 font-semibold leading-snug">
                                    Select <span className="text-[#1c1e21] font-bold uppercase tracking-tight italic">"Open in Browser"</span> or <span className="text-[#1c1e21] font-bold uppercase tracking-tight italic">"Open in Safari/Chrome"</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-10 text-[#1c1e21]/40 text-[11px] font-bold uppercase tracking-widest px-8">
                    NO LOGIN REQUIRED • FAST & ANONYMOUS
                </p>
            </div>
        </div>
    );
};
