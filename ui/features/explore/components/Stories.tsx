'use client';

import { useUser } from '@/hooks';
import { Plus } from 'lucide-react';

const stories = [
    { id: 1, username: 'historyisti...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
    { id: 2, username: 'kairi.art01', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
    { id: 3, username: 'positivityd...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark' },
    { id: 4, username: 'coding_kn...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
    { id: 5, username: 'thinkingmi...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver' },
    { id: 6, username: 'historypho...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe' },
    { id: 7, username: 'vintage.vib...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
    { id: 8, username: 'nature.lover', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nature' },
];

export const Stories = () => {
    const { user } = useUser();

    return (
        <div className="flex flex-col w-full">
            <div className="flex gap-4 overflow-x-auto pt-4 pb-3 px-4 scrollbar-hide scroll-smooth">
                {/* 1. Profile Note (Upcoming feature) */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 group cursor-not-allowed">
                    <div className="relative">
                        <div className="p-[2.5px] rounded-full bg-zinc-100">
                            <div className="p-[2px] bg-white rounded-full">
                                <img
                                    src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Arisu"}
                                    alt={user?.username || "You"}
                                    className="w-[72px] h-[72px] rounded-full border border-zinc-100 object-cover"
                                />
                            </div>
                        </div>
                        {/* Plus Icon Overlay */}
                        <div className="absolute bottom-0 right-0 bg-pink-500 rounded-full border-2 border-white p-0.5 shadow-sm">
                            <Plus className="w-3.5 h-3.5 text-white" strokeWidth={5} />
                        </div>
                    </div>
                    <span className="text-[11.5px] font-medium text-zinc-500">Your Story</span>
                </div>

                {/* 2. Existing Shadowed Stories */}
                {stories.map((story) => (
                    <div key={story.id} className="flex flex-col items-center gap-1.5 shrink-0 opacity-40">
                        <div className="p-[2.5px] rounded-full bg-zinc-100">
                            <div className="p-[2px] bg-white rounded-full">
                                <img
                                    src={story.avatar}
                                    alt={story.username}
                                    className="w-[72px] h-[72px] rounded-full border border-zinc-100 object-cover"
                                />
                            </div>
                        </div>
                        <span className="text-[11.5px] text-zinc-400 max-w-[72px] truncate font-normal text-center">
                            {story.username}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
