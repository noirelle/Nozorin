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
                <div className="flex items-start gap-8 md:gap-20 mb-12">
                    {/* Avatar Container */}
                    <div className="relative shrink-0">
                        <div className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] rounded-full overflow-hidden border border-zinc-200 p-1 relative group bg-zinc-50">
                            <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-full h-full object-cover rounded-full"
                            />
                            {/* Note Bubble Placeholder */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-[10px] px-2 py-0.5 rounded-lg border border-zinc-200 shadow-sm opacity-90 pointer-events-none transition-transform group-hover:scale-105 text-zinc-600 font-medium">
                                Note...
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-zinc-200"></div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex-1 pt-2">
                        <div className="flex flex-col gap-0.5 mb-6">
                            <div className="flex items-center gap-4 flex-wrap">
                                <h1 className="text-xl font-normal tracking-wide text-zinc-900">{user.username}</h1>
                                <div className="flex items-center gap-2">
                                    <Settings className="w-5 h-5 cursor-pointer text-zinc-600 hover:text-zinc-900 transition-colors" />
                                </div>
                            </div>
                            <h2 className="text-sm font-semibold text-zinc-500">@{user.id}</h2>
                        </div>

                        <div className="flex gap-6 md:gap-10 mb-6 text-sm">
                            <div className="flex items-center gap-1.5 group relative cursor-help">
                                <span className="font-semibold text-zinc-900">0</span>
                                <span className="text-zinc-500">posts</span>
                                <span className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Upcoming</span>
                            </div>
                            <div className="flex items-center gap-1.5 group relative cursor-help">
                                <span className="font-semibold text-zinc-900">17</span>
                                <span className="text-zinc-500">followers</span>
                                <span className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Upcoming</span>
                            </div>
                            <div className="flex items-center gap-1.5 group relative cursor-help">
                                <span className="font-semibold text-zinc-900">23</span>
                                <span className="text-zinc-500">following</span>
                                <span className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Upcoming</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-12">
                    <button className="flex-1 flex items-center justify-center bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-900 h-10 py-1 rounded-lg text-sm font-semibold transition-all cursor-not-allowed group relative">
                        Edit profile
                        <span className="absolute right-3 text-zinc-500 text-[9px] font-bold uppercase tracking-widest bg-zinc-200/50 px-1.5 py-0.5 rounded group-hover:bg-zinc-300/50 transition-colors">Upcoming</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-900 h-10 py-1 rounded-lg text-sm font-semibold transition-all cursor-not-allowed group relative">
                        View archive
                        <span className="absolute right-3 text-zinc-500 text-[9px] font-bold uppercase tracking-widest bg-zinc-200/50 px-1.5 py-0.5 rounded group-hover:bg-zinc-300/50 transition-colors">Upcoming</span>
                    </button>
                </div>

                {/* Highlights / Stories */}
                <div className="flex gap-8 mb-16 border-b border-zinc-100 pb-16 overflow-x-auto scrollbar-hide">
                    <div className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer">
                        <div className="w-16 h-16 md:w-[77px] md:h-[77px] rounded-full border border-zinc-200 flex items-center justify-center bg-zinc-50 shadow-sm group-hover:bg-zinc-100 transition-all duration-300">
                            <Plus className="w-7 h-7 text-zinc-400 transition-transform group-hover:rotate-90 group-hover:text-zinc-600" />
                        </div>
                        <span className="text-[12px] text-zinc-500 font-medium">New</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-t border-zinc-200">
                    <div className="flex justify-center gap-16">
                        <button className="flex items-center gap-1.5 py-4 border-t border-zinc-900 -mt-[1px] text-[11px] font-bold tracking-widest uppercase text-zinc-900 transition-all">
                            <Grid className="w-3 h-3" />
                            Posts
                            <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest ml-1.5">Upcoming</span>
                        </button>
                        <button className="flex items-center gap-1.5 py-4 text-zinc-400 text-[11px] font-bold tracking-widest uppercase relative group hover:text-zinc-600 transition-colors">
                            <Bookmark className="w-3 h-3" />
                            Saved
                            <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Upcoming</span>
                        </button>
                        <button className="flex items-center gap-1.5 py-4 text-zinc-400 text-[11px] font-bold tracking-widest uppercase relative group hover:text-zinc-600 transition-colors">
                            <User className="w-3 h-3" />
                            Tagged
                            <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Upcoming</span>
                        </button>
                    </div>
                </div>

                {/* Empty State */}
                <div className="mt-24 flex flex-col items-center text-center animate-in zoom-in-95 duration-1000">
                    <div className="w-16 h-16 rounded-full border border-zinc-200 flex items-center justify-center mb-6 bg-zinc-50">
                        <Grid className="w-8 h-8 text-zinc-300" />
                    </div>
                    <h2 className="text-3xl font-black text-zinc-900 mb-3 tracking-tight">No Posts Yet</h2>
                    <p className="text-zinc-500 text-[13px] max-w-[280px] font-medium">When you share photos or videos, they will appear here on your profile.</p>
                    <button className="mt-8 text-blue-500 hover:text-blue-600 text-sm font-bold transition-all relative group">
                        Share your first photo
                        <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-widest absolute -top-4 -right-8">Upcoming</span>
                    </button>
                </div>
            </div>
        </main>
    );
};

export default ProfilePage;
