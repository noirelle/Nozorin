'use client';

import React, { useEffect, useState } from 'react';
import { Compass, ExternalLink, MoreVertical, AlertTriangle } from 'lucide-react';
import { isInAppBrowser, getInAppBrowserName } from '@/utils/browser';

export const BrowserGuard: React.FC = () => {
    const [shouldShow, setShouldShow] = useState(false);
    const [browserName, setBrowserName] = useState<string | null>(null);

    useEffect(() => {
        if (isInAppBrowser()) {
            setShouldShow(true);
            setBrowserName(getInAppBrowserName() || 'In-App');
        }
    }, []);

    if (!shouldShow) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl p-6">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="bg-white rounded-[40px] p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4)] relative overflow-hidden">
                    {/* Background Decorative Element */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/10 blur-[80px] rounded-full" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-6 ring-4 ring-pink-50/50">
                            <AlertTriangle className="w-8 h-8 text-pink-500" />
                        </div>

                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4">
                            Oops, you're using the {browserName} browser
                        </h2>

                        <p className="text-zinc-500 font-medium leading-relaxed mb-8">
                            Our application requires microphone and other advanced permissions that are restricted in this environment. Please open this site in <span className="text-zinc-900 font-bold">Chrome</span> or another default browser to continue.
                        </p>

                        <div className="w-full space-y-4">
                            <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
                                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Compass className="w-3.5 h-3.5" />
                                    How to switch
                                </h3>
                                
                                <ul className="text-left space-y-4">
                                    <li className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-400 shrink-0 mt-0.5">1</div>
                                        <p className="text-sm text-zinc-600 font-medium">
                                            Tap the <span className="inline-flex items-center px-1.5 py-0.5 bg-white border border-zinc-200 rounded-md mx-0.5"><MoreVertical className="w-3 h-3 text-zinc-400" /></span> menu icon in the top right.
                                        </p>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-400 shrink-0 mt-0.5">2</div>
                                        <p className="text-sm text-zinc-600 font-medium">
                                            Select <span className="text-zinc-900 font-bold uppercase tracking-tight italic">"Open in Browser"</span> or <span className="text-zinc-900 font-bold uppercase tracking-tight italic">"Open in Exterior Browser"</span>.
                                        </p>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pt-2">
                                <ExternalLink className="w-3 h-3" />
                                Seamless switching is highly recommended
                            </div>
                        </div>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-zinc-400 text-xs font-medium px-8">
                    By switching, you'll get full access to voice chat and all the features of Nozorin.
                </p>
            </div>
        </div>
    );
};
