'use client';

import React from 'react';
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

export const PostCard = () => {
    return (
        <div className="max-w-[470px] mx-auto mb-6">
            <div className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                    <div className="p-[1px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                        <div className="p-[1.5px] bg-black rounded-full">
                            <img
                                src="https://i.pravatar.cc/150?u=jason"
                                alt="avatar"
                                className="w-8 h-8 rounded-full"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-white">jasonrewired_</span>
                        <span className="text-sm text-zinc-400">· 4d</span>
                    </div>
                </div>
                <MoreHorizontal className="text-white w-5 h-5 cursor-pointer" />
            </div>

            <div className="rounded-sm overflow-hidden border border-zinc-800 bg-[#F5F5F0]">
                <img
                    src="/social/stubborn_doctor.png"
                    alt="The stubborn doctor theory"
                    className="w-full h-auto"
                />
            </div>

            <div className="py-4 px-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Heart className="text-white w-6 h-6 cursor-pointer" />
                        <MessageCircle className="text-white w-6 h-6 cursor-pointer" />
                        <Send className="text-white w-6 h-6 cursor-pointer" />
                    </div>
                    <Bookmark className="text-white w-6 h-6 cursor-pointer" />
                </div>

                <div className="text-white">
                    <span className="font-semibold text-sm">jasonrewired_</span>
                    <span className="text-sm ml-2">The stubborn doctor theory - a thread.</span>
                </div>
            </div>
        </div>
    );
};
