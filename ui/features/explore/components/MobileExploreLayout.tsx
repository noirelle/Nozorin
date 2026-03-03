'use client';

import React from 'react';
import { Stories } from '@/features/home/components/Stories';
import { PostCard } from '@/features/home/components/PostCard';

export const MobileExploreLayout = () => {
    return (
        <div className="animate-in fade-in duration-500 pt-2">
            {/* Stories Bar */}
            <Stories />

            {/* Feed */}
            <div className="divide-y divide-zinc-200">
                <PostCard />
                {/* Add more PostCards as needed */}
            </div>
        </div>
    );
};
