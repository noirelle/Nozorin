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
        }
    }, []);

    const handleCopyLink = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    if (!shouldShow) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#1c1e21]/90 backdrop-blur-xl p-6 overflow-y-auto">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500 py-10">
                <div className="bg-white rounded-[40px] p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4)] relative overflow-hidden border-2 border-[#fce7f3]">
                    {/* Background Decorative Element */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ec4899]/10 blur-[80px] rounded-full" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#ec4899]/10 blur-[80px] rounded-full" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-[#fdf2f8] rounded-2xl flex items-center justify-center mb-6 ring-4 ring-[#fdf2f8]/50">
                            <AlertTriangle className="w-8 h-8 text-[#ec4899]" />
                        </div>

                        <h2 className="text-2xl font-black text-[#1c1e21] uppercase tracking-tight mb-4">
                            Oops, you're using the {browserName} browser
                        </h2>

                        <p className="text-[#1c1e21]/60 font-medium leading-relaxed mb-8">
                            Our application requires microphone and other advanced permissions that are restricted in this environment. Please open this site in <span className="text-[#ec4899] font-bold">Chrome</span> or another default browser to continue.
                        </p>

                        <div className="w-full space-y-4">
                            {/* Copy Link Section */}
                            <button
                                onClick={handleCopyLink}
                                className={`w-full h-[48px] rounded-full flex items-center justify-center gap-2 font-extrabold text-[15px] transition-all active:scale-[0.98] ${
                                    copied 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'border-2 border-[#ec4899] text-[#ec4899] hover:bg-[#fdf2f8]'
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        URL COPIED!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        COPY SITE LINK
                                    </>
                                )}
                            </button>

                            <div className="bg-[#fdf2f8]/30 rounded-3xl p-6 border-2 border-[#fce7f3]">
                                <h3 className="text-xs font-black text-[#1c1e21]/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Compass className="w-3.5 h-3.5" />
                                    How to switch manually
                                </h3>
                                
                                <ul className="text-left space-y-4">
                                    <li className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-white border-2 border-[#fce7f3] flex items-center justify-center text-[10px] font-black text-[#ec4899] shrink-0 mt-0.5">1</div>
                                        <p className="text-sm text-[#1c1e21]/70 font-medium">
                                            Tap the <span className="inline-flex items-center px-1.5 py-0.5 bg-white border border-[#fce7f3] rounded-md mx-0.5"><MoreVertical className="w-3 h-3 text-[#1c1e21]/40" /></span> menu icon in the top right.
                                        </p>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-white border-2 border-[#fce7f3] flex items-center justify-center text-[10px] font-black text-[#ec4899] shrink-0 mt-0.5">2</div>
                                        <p className="text-sm text-[#1c1e21]/70 font-medium">
                                            Select <span className="text-[#1c1e21] font-bold uppercase tracking-tight italic">"Open in Browser"</span> or <span className="text-[#1c1e21] font-bold uppercase tracking-tight italic">"Open in Exterior Browser"</span>.
                                        </p>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-[#1c1e21]/30 uppercase tracking-[0.2em] pt-2">
                                <ExternalLink className="w-3 h-3" />
                                Seamless switching is highly recommended
                            </div>
                        </div>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-[#1c1e21]/40 text-xs font-medium px-8">
                    By switching, you'll get full access to voice chat and all the features of Nozorin.
                </p>
            </div>
        </div>
    );
};
