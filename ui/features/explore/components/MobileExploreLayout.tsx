'use client';

import React from 'react';
import { MobileNavbar } from './MobileNavbar';
import { MobileTabbar } from './MobileTabbar';
import { Stories } from './Stories';
import { PostCard } from './PostCard';

export const MobileExploreLayout = () => {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Top Navbar */}
            <MobileNavbar />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-[50px]">
                {/* Stories Bar */}
                <div>
                    <Stories />
                </div>

                {/* Feed */}
                <div className="divide-y divide-zinc-900">
                    <PostCard />
                    {/* Add more PostCards as needed */}
                </div>
            </main>

            {/* Bottom Tabbar */}
            <MobileTabbar />
        </div>
    );
};
