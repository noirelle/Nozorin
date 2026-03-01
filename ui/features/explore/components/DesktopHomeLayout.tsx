'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RightSidebar } from './RightSidebar';
import { FloatingMessages } from './FloatingMessages';
import { FeatureCards } from './FeatureCards';
import { HomeUserList } from './HomeUserList';
import { VoiceGameRoom } from './VoiceGameRoom';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export const DesktopHomeLayout = () => {
    const pathname = usePathname();
    const router = useRouter();
    const isVoiceGame = pathname === '/app/voice';

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Fixed Sidebar */}
            <Sidebar />

            {/* Main Feed Container */}
            <main className="flex-1 ml-[72px] flex justify-center">
                <div className="w-full max-w-[935px] flex">
                    {/* Content Column */}
                    <div className="flex-1 max-w-[630px] pt-8 px-8">
                        {isVoiceGame ? (
                            <div className="flex flex-col h-full">
                                <div className="mb-8 flex items-center gap-4">
                                    <button
                                        onClick={() => router.push('/app')}
                                        className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                                    >
                                        <ArrowLeft className="w-6 h-6" />
                                    </button>
                                    <h1 className="text-2xl font-bold">Voice Game</h1>
                                </div>
                                <VoiceGameRoom />
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <RightSidebar />
                </div>
            </main>

            {/* Floating Elements */}
            <FloatingMessages />
        </div>
    );
};
