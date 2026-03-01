'use client';

import React from 'react';
import { RightSidebar } from '@/features/voice-room/components/RightSidebar';
import { FeatureCards } from './FeatureCards';
import { HomeUserList } from './HomeUserList';
import { usePathname } from 'next/navigation';

interface DesktopHomeLayoutProps { }

export const DesktopHomeLayout = () => {
    const pathname = usePathname();

    return (
        <>
            {/* Main Feed Container */}
            <main className="flex-1 ml-[72px] flex justify-center">
                <div className="w-full max-w-[935px] flex">
                    {/* Content Column */}
                    <div className="flex-1 max-w-[630px] pt-8 px-8">
                        {/* Feature Cards Section */}
                        <FeatureCards />
                        {/* Feed Section */}
                        <div className="mt-8">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Discover People</h2>
                                    <span className="text-[10px] font-bold text-zinc-600 bg-zinc-900/50 px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm border border-zinc-800/50">Upcoming</span>
                                </div>
                                <button
                                    disabled
                                    className="text-zinc-700 cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </button>
                            </div>
                            <HomeUserList />
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <RightSidebar variant="home" showProfile={false} />
                </div>
            </main>

        </>
    );
};
