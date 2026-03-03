'use client';

import React from 'react';
import { useUser } from '@/hooks';
import {
    Grid,
    Bookmark,
    User,
    Settings,
    Plus
} from 'lucide-react';

const ProfilePage = () => {
    const { user } = useUser();

    if (!user) return null;

    return (
        <main className="flex-1 ml-[72px] flex justify-center bg-[#fdfbfc] min-h-screen text-zinc-900 transition-all duration-300">
            <div className="w-full max-w-[935px] pt-12 px-4 md:px-20 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex items-start gap-2 md:gap-4 mb-12">
                    {/* Avatar Container */}
                    <div className="relative shrink-0">
                        <div className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] rounded-full overflow-hidden border border-zinc-200 p-1 relative group bg-zinc-50">
                            <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-full h-full object-cover rounded-full"
                            />
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex-1 pt-2 md:pt-4">
                        <div className="flex flex-col gap-0.5 mb-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-xl font-normal tracking-wide text-zinc-900">{user.username}</h1>
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4 cursor-pointer text-zinc-500 hover:text-zinc-900 transition-colors" />
                                </div>
                            </div>
                            <h2 className="text-sm font-semibold text-zinc-500">@{user.id}</h2>
                        </div>

                        <div className="flex gap-4 md:gap-8 text-sm">
                            <div className="flex items-center gap-1.5 group relative cursor-help">
                                <span className="text-zinc-500">Posts</span>
                                <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest ml-1">Upcoming</span>
                            </div>
                            <div className="flex items-center gap-1.5 group relative cursor-help">
                                <span className="text-zinc-500">followers</span>
                                <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest ml-1">Upcoming</span>
                            </div>
                            <div className="flex items-center gap-1.5 group relative cursor-help">
                                <span className="text-zinc-500">following</span>
                                <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest ml-1">Upcoming</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-6">
                    <button className="w-full max-w-[340px] flex items-center justify-center bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-900 h-11 py-1 rounded-lg text-sm font-semibold transition-all cursor-not-allowed group relative px-8">
                        Edit profile
                        <span className="absolute top-1.5 right-2 text-zinc-400 text-[7px] font-bold uppercase tracking-tighter bg-zinc-200/40 px-1 py-0.5 rounded-sm group-hover:bg-zinc-200/60 transition-colors">Upcoming</span>
                    </button>
                    <button className="w-full max-w-[340px] flex items-center justify-center bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-900 h-11 py-1 rounded-lg text-sm font-semibold transition-all cursor-not-allowed group relative px-8">
                        View archive
                        <span className="absolute top-1.5 right-2 text-zinc-400 text-[7px] font-bold uppercase tracking-tighter bg-zinc-200/40 px-1 py-0.5 rounded-sm group-hover:bg-zinc-200/60 transition-colors">Upcoming</span>
                    </button>
                </div>

                {/* Highlights / Stories */}
                <div className="flex gap-8 mb-4 overflow-x-auto scrollbar-hide">
                    <div className="flex flex-col items-center gap-3 shrink-0 group cursor-not-allowed">
                        <div className="w-16 h-16 md:w-[70px] md:h-[70px] rounded-full border border-zinc-100 flex items-center justify-center bg-zinc-50/50 relative">
                            <Plus className="w-5 h-5 text-zinc-300" strokeWidth={1.5} />
                        </div>
                        <span className="text-[11px] text-zinc-400 font-medium">New</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-t border-zinc-200 mt-12">
                    <div className="flex justify-center gap-16">
                        <button className="flex items-center gap-1.5 py-4 border-t border-zinc-900 -mt-[1px] text-[11px] font-bold tracking-widest uppercase text-zinc-900 transition-all px-16">
                            <Grid className="w-3 h-3" />
                            Posts
                            <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest ml-1.5">Upcoming</span>
                        </button>
                        <button className="flex items-center gap-1.5 py-4 text-zinc-400 text-[11px] font-bold tracking-widest uppercase">
                            <Bookmark className="w-3 h-3" />
                            Saved
                            <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest ml-1.5">Upcoming</span>
                        </button>
                        <button className="flex items-center gap-1.5 py-4 text-zinc-400 text-[11px] font-bold tracking-widest uppercase">
                            <User className="w-3 h-3" />
                            Tagged
                            <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest ml-1.5">Upcoming</span>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ProfilePage;
