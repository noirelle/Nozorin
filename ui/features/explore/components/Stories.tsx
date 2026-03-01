'use client';

import React from 'react';

const stories = [
    { id: 1, username: 'historyisti...', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: 2, username: 'kairi.art01', avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: 3, username: 'positivityd...', avatar: 'https://i.pravatar.cc/150?u=3' },
    { id: 4, username: 'coding_kn...', avatar: 'https://i.pravatar.cc/150?u=4' },
    { id: 5, username: 'thinkingmi...', avatar: 'https://i.pravatar.cc/150?u=5' },
    { id: 6, username: 'historypho...', avatar: 'https://i.pravatar.cc/150?u=6' },
    { id: 7, username: 'vintage.vib...', avatar: 'https://i.pravatar.cc/150?u=7' },
];

export const Stories = () => {
    return (
        <div className="flex gap-4 overflow-x-auto py-4 no-scrollbar">
            {stories.map((story) => (
                <div key={story.id} className="flex flex-col items-center gap-1 shrink-0">
                    <div className="p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                        <div className="p-[2px] bg-black rounded-full">
                            <img
                                src={story.avatar}
                                alt={story.username}
                                className="w-14 h-14 rounded-full border border-black object-cover"
                            />
                        </div>
                    </div>
                    <span className="text-[11px] text-zinc-400 max-w-[64px] truncate">
                        {story.username}
                    </span>
                </div>
            ))}
        </div>
    );
};
