'use client';

import React from 'react';
import { useUser } from '@/hooks';
import {
    Grid,
    UserPlus,
    Camera,
    Plus
} from 'lucide-react';
import { UpcomingBadge } from '@/components/UpcomingBadge';

export const MobileProfileLayout = () => {
    const { user } = useUser();

    if (!user) return null;

    return (
        <div className="flex flex-col min-h-screen bg-transparent text-zinc-900 animate-in fade-in duration-500 pb-10">
            {/* 1. Profile Info Section */}
            <div className="px-4 pt-4">
                <div className="flex items-center gap-4 mb-4">
                    {/* Avatar Container */}
                    <div className="relative shrink-0">
                        <div className="w-[86px] h-[86px] rounded-full border border-zinc-200 p-[3px]">
                            <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-full h-full object-cover rounded-full"
                            />
                        </div>
                        {/* Plus Overlay - Instagram Style (Blue/White) */}
                        <div className="absolute bottom-0 right-0 bg-[#0095F6] rounded-full border-2 border-white p-0.5 shadow-sm">
                            <Plus className="w-3.5 h-3.5 text-white" strokeWidth={5} />
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="flex flex-1 justify-around items-center min-w-0">
                        <div className="flex flex-col items-center gap-1">
                            <UpcomingBadge variant="small" />
                            <span className="text-[11px] text-zinc-500 font-medium lowercase">posts</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <UpcomingBadge variant="small" />
                            <span className="text-[11px] text-zinc-500 font-medium lowercase">followers</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <UpcomingBadge variant="small" />
                            <span className="text-[11px] text-zinc-500 font-medium lowercase">following</span>
                        </div>
                    </div>
                </div>

                {/* Name & ID */}
                <div className="flex flex-col mb-6">
                    <h2 className="text-[14px] font-bold text-zinc-900 leading-tight mb-0.5">
                        {user.username}
                    </h2>
                    <p className="text-[13px] text-zinc-400 font-medium">
                        #{user.id}
                    </p>
                </div>

                {/* Main Action Buttons */}
                <div className="flex gap-2 mb-8">
                    <button className="flex-1 bg-zinc-100 border border-zinc-200 rounded-lg h-8 flex items-center justify-center text-[13px] font-bold text-zinc-900 relative cursor-not-allowed">
                        <span className="opacity-40">Edit profile</span>
                        <UpcomingBadge variant="small" className="absolute -top-1.5 -right-1" />
                    </button>
                    <button className="flex-1 bg-zinc-100 border border-zinc-200 rounded-lg h-8 flex items-center justify-center text-[13px] font-bold text-zinc-900 relative cursor-not-allowed">
                        <span className="opacity-40">Share profile</span>
                        <UpcomingBadge variant="small" className="absolute -top-1.5 -right-1" />
                    </button>
                    <button className="w-8 shrink-0 bg-zinc-100 border border-zinc-200 rounded-lg h-8 flex items-center justify-center text-zinc-900 cursor-not-allowed">
                        <UserPlus className="w-4 h-4 opacity-30" />
                    </button>
                </div>
            </div>

            {/* 3. Content Tabs & Posts */}
            <div className="">
                <div className="flex w-full">
                    <button className="flex-1 h-12 flex items-center justify-center border-b-[1.5px] border-zinc-900">
                        <Grid className="w-6 h-6 text-zinc-900" strokeWidth={1.5} />
                    </button>
                    <button className="flex-1 h-12 flex items-center justify-center opacity-40 cursor-not-allowed">
                        <Camera className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Empty State / Upcoming */}
                <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-zinc-100 flex items-center justify-center mb-6">
                        <Camera className="w-8 h-8 text-zinc-200" strokeWidth={1.5} />
                    </div>
                    <UpcomingBadge />
                </div>
            </div>
        </div>
    );
};
