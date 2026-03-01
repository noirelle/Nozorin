'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RightSidebar } from './RightSidebar';
import { FloatingMessages } from './FloatingMessages';
import { FeatureCards } from './FeatureCards';
import { HomeUserList } from './HomeUserList';

export const DesktopHomeLayout = () => {
    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Fixed Sidebar */}
            <Sidebar />

            {/* Main Feed Container */}
            <main className="flex-1 ml-[72px] flex justify-center">
                <div className="w-full max-w-[935px] flex">
                    {/* Content Column */}
                    <div className="flex-1 max-w-[630px] pt-8 px-8">
                        {/* Feature Cards Section */}
                        <FeatureCards />

                        {/* Feed Section */}
                        <div className="mt-8">
                            <HomeUserList />
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
