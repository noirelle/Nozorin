'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Stories } from './Stories';
import { PostCard } from './PostCard';
import { RightSidebar } from '@/features/voice-room/components/RightSidebar';
import { FloatingMessages } from '@/features/voice-room/components/FloatingMessages';

export const DesktopExploreLayout = () => {
    return (
        <>
            {/* Main Feed Container */}
            <main className="flex-1 ml-[72px] flex justify-center">
                <div className="w-full max-w-[935px] flex">
                    {/* Feed Column */}
                    <div className="flex-1 max-w-[630px] pt-8 px-8">
                        <Stories />
                        <div className="mt-8">
                            <PostCard />
                            {/* Could add more post cards here */}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <RightSidebar variant="home" showProfile={true} />
                </div>
            </main>

            {/* Floating Elements */}
            <FloatingMessages />
        </>
    );
};
