'use client';

import { useUser } from '@/hooks';

const stories = [
    { id: 1, username: 'historyisti...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
    { id: 2, username: 'kairi.art01', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
    { id: 3, username: 'positivityd...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark' },
    { id: 4, username: 'coding_kn...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
    { id: 5, username: 'thinkingmi...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver' },
    { id: 6, username: 'historypho...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe' },
    { id: 7, username: 'vintage.vib...', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
];

export const Stories = () => {
    const { user } = useUser();

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-4 overflow-x-auto pt-6 pb-2 scrollbar-hide">
                {/* 1. Profile Note (Upcoming feature) */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 group cursor-not-allowed">
                    <div className="relative">
                        <div className="p-[2px] rounded-full bg-gradient-to-tr from-pink-400 to-rose-500">
                            <div className="p-[2px] bg-white rounded-full">
                                <img
                                    src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Arisu"}
                                    alt={user?.username || "You"}
                                    className="w-14 h-14 rounded-full border border-zinc-200 object-cover"
                                />
                            </div>
                        </div>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-600">Your Note</span>
                </div>

                {/* 2. Existing Shadowed Stories */}
                {stories.map((story) => (
                    <div key={story.id} className="flex flex-col items-center gap-1.5 shrink-0 opacity-40 filter blur-[0.3px]">
                        <div className="p-[2px] rounded-full bg-zinc-200">
                            <div className="p-[2px] bg-white rounded-full">
                                <img
                                    src={story.avatar}
                                    alt={story.username}
                                    className="w-14 h-14 rounded-full border border-zinc-200 object-cover"
                                />
                            </div>
                        </div>
                        <span className="text-[11px] text-zinc-500 max-w-[60px] truncate font-medium">
                            {story.username}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
