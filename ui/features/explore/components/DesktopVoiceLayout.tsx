'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RightSidebar } from './RightSidebar';
import { FloatingMessages } from './FloatingMessages';
import { VoiceGameRoom } from './VoiceGameRoom';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export const DesktopVoiceLayout = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Fixed Sidebar */}
            <Sidebar />

            {/* Main Feed Container */}
            <main className="flex-1 ml-[72px] flex justify-center">
                <div className="w-full max-w-[935px] flex">
                    {/* Content Column */}
                    <div className="flex-1 max-w-[630px] pt-8 px-8">
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
