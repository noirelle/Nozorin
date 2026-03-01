'use client';

import React from 'react';
import ReactCountryFlag from "react-country-flag";
import { Mars, Venus } from 'lucide-react';

const dummyUsers = [
    {
        id: 1,
        username: 'noirelle_dev',
        status: 'Building Nozorin 🚀',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        gender: 'male',
        country: 'US',
        isNew: true
    },
    {
        id: 2,
        username: 'serena_vibe',
        status: 'Looking for a voice match! 🎙️',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        gender: 'female',
        country: 'PH',
        isNew: false
    },
    {
        id: 3,
        username: 'mark_the_player',
        status: 'Anyone for Soul Game?',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark',
        gender: 'male',
        country: 'CA',
        isNew: false
    }
];

export const HomeUserList = () => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {dummyUsers.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className={`p-[2px] rounded-full ${user.isNew ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' : 'bg-zinc-800'}`}>
                                    <div className="p-[2px] bg-black rounded-full">
                                        <img
                                            src={user.avatar}
                                            alt={user.username}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-black p-1 rounded-full border border-zinc-800 shadow-xl">
                                    <ReactCountryFlag
                                        countryCode={user.country}
                                        svg
                                        className="w-3.5 h-2.5 rounded-[1px]"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-bold text-[15px]">{user.username}</span>
                                    {user.gender === 'male' ? (
                                        <Mars className="w-3.5 h-3.5 text-blue-400 opacity-80" strokeWidth={3} />
                                    ) : (
                                        <Venus className="w-3.5 h-3.5 text-pink-400 opacity-80" strokeWidth={3} />
                                    )}
                                </div>
                                <span className="text-zinc-500 text-sm font-medium">{user.status}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                disabled
                className="w-full py-4 text-zinc-600 text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
            >
                View More Suggestions
                <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded-full">Coming Soon</span>
            </button>
        </div>
    );
};
