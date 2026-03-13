'   use client';

import React, { useEffect } from 'react';
import HeroVisual from './HeroVisual';

export default function HeroMobileLayout({ onJoin }: { onJoin: (mode: 'chat' | 'voice') => void }) {
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        const originalTouchAction = window.getComputedStyle(document.body).touchAction;

        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';

        return () => {
            document.body.style.overflow = originalStyle;
            document.body.style.touchAction = originalTouchAction;
        };
    }, []);

    return (
        <section className="w-full min-h-[100dvh] flex xl:hidden flex-col font-sans text-[#1c1e21] overflow-hidden overscroll-none bg-white">

            {/* ── LEFT PANEL (White) ── */}
            <div className="w-full flex-1 relative flex flex-col justify-center items-center bg-white border-b border-[#fce7f3] py-4 min-h-[35vh] lg:min-h-[40vh] z-10 shrink-0">

                {/* Brand Logo */}
                <div className="absolute top-[clamp(12px,2vh,20px)] left-[clamp(16px,4vw,24px)] z-30">
                    <img src="/nozorin_logo.svg" alt="Nozorin Logo" className="w-[clamp(32px,8vw,48px)] h-[clamp(32px,8vw,48px)]" />
                </div>

                {/* Content Container */}
                <div className="flex flex-col-reverse items-center justify-center w-full px-[clamp(16px,5vw,32px)] z-10 pt-[clamp(24px,4vh,48px)] mt-4">

                    {/* Headline */}
                    <div className="shrink-0 text-center z-20">
                        <h1 className="text-[clamp(1.4rem,5vw,2rem)] font-bold text-[#1c1e21] leading-[1.05] tracking-tight">
                            Make connections<br />
                            that <span className="text-[#ec4899]">matter.</span>
                        </h1>
                    </div>

                    {/* Media Collage */}
                    {/* <div className="shrink-0 flex items-center justify-center pointer-events-none origin-center transform scale-[0.24] min-[390px]:scale-[0.27] min-[420px]:scale-[0.30] sm:scale-[0.55] -mt-[clamp(195px,38vh,250px)] -mb-[clamp(175px,34vh,220px)] sm:-my-[120px]">
                        <HeroVisual />
                    </div> */}
                </div>
            </div>

            {/* ── RIGHT PANEL (Interactive) ── */}
            <div className="w-full flex-1 flex flex-col items-center justify-center bg-white relative pt-4 pb-6 sm:pt-8 sm:pb-12 z-20 shrink-0">

                {/* Login Form Container - Boxed vertically to prevent extreme stretching */}
                <div className="flex flex-col items-start justify-center w-full max-w-[380px] px-6 sm:px-10 h-auto min-h-[360px] max-h-[500px] md:max-h-[600px]">

                    <h2 className="text-[clamp(18px,4.5vw,22px)] sm:text-[22px] font-semibold text-[#1c1e21] mb-3 sm:mb-4 w-full text-left shrink-0">Login into Nozorin</h2>

                    {/* Form Fields Stack */}
                    <div className="w-full flex flex-col flex-1">
                        <div className="w-full flex flex-col gap-2 sm:gap-3 shrink-0">
                            <input
                                type="text"
                                disabled
                                placeholder="Email or mobile number"
                                className="w-full h-[44px] sm:h-[48px] px-4 rounded-xl border-2 border-[#fce7f3] bg-gray-50/50 cursor-not-allowed opacity-60 text-[14px] sm:text-[15px] font-medium outline-none"
                            />
                            <input
                                type="password"
                                disabled
                                placeholder="Password"
                                className="w-full h-[44px] sm:h-[48px] px-4 rounded-xl border-2 border-[#fce7f3] bg-gray-50/50 cursor-not-allowed opacity-60 text-[14px] sm:text-[15px] font-medium outline-none"
                            />

                            <div className="mt-1 sm:mt-2">
                                <button
                                    disabled
                                    className="w-full h-[42px] sm:h-[46px] bg-[#ec4899] opacity-40 cursor-not-allowed text-white rounded-[10px] sm:rounded-full font-extrabold text-[15px] sm:text-[16px]"
                                >
                                    Log in
                                </button>
                            </div>

                            <div className="flex justify-center w-full mt-1.5 sm:mt-2">
                                <button disabled className="text-[#ec4899] opacity-40 cursor-not-allowed text-[13px] sm:text-[14px] font-bold transition-all">
                                    Forgot password?
                                </button>
                            </div>
                        </div>

                        <div className="h-[2px] border-b-2 border-[#fce7f3] my-3 sm:my-5 w-full opacity-50 shrink-0"></div>

                        {/* Guest Access Button (Pink Theme) */}
                        <div className="w-full mt-auto mb-2">
                            <button
                                onClick={() => onJoin('voice')}
                                className="w-full h-[44px] sm:h-[48px] border-2 border-[#ec4899] bg-white hover:bg-[#fdf2f8] text-[#ec4899] rounded-[10px] sm:rounded-full font-extrabold text-[15px] sm:text-[16px] transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-[#ec4899]/10"
                            >
                                Continue as Guest
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
