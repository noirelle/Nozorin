'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Stories } from './Stories';
import { PostCard } from './PostCard';
import { RightSidebar } from './RightSidebar';
import { FloatingMessages } from './FloatingMessages';

export const DesktopExploreLayout = () => {
    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Fixed Sidebar */}
            <Sidebar />

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
                    <RightSidebar />
                </div>
            </main>

            {/* Floating Elements */}
            <FloatingMessages />
        </div>
    );
};
