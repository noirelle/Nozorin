'use client';

import React from 'react';
import { getAvatarUrl } from '@/utils/avatar';
import ReactCountryFlag from "react-country-flag";
import { Mars, Venus } from 'lucide-react';

const dummyUsers = [
    {
        id: 1,
        username: 'noirelle_dev',
        age: 24,
        status: 'Building Nozorin 🚀',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        gender: 'male',
        country: 'US',
        isNew: true,
        isOnline: true
    },
    {
        id: 2,
        username: 'serena_vibe',
        age: 22,
        status: 'Looking for a voice match! 🎙️',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        gender: 'female',
        country: 'PH',
        isNew: false,
        isOnline: true
    },
    {
        id: 3,
        username: 'mark_the_player',
        age: 26,
        status: 'Anyone for Soul Game?',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark',
        gender: 'male',
        country: 'CA',
        isNew: false,
        isOnline: false
    }
];

export const HomeUserList = () => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {dummyUsers.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-pink-50 transition-colors group cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className={`p-[2px] rounded-full ${user.isNew ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' : 'bg-zinc-200'}`}>
                                    <div className="p-[2px] bg-white rounded-full relative">
                                        <img
                                            src={getAvatarUrl(user.avatar || user.username)}
                                            alt={user.username}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        {user.isOnline && (
                                            <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full z-10 shadow-sm" />
                                        )}
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-pink-50 shadow-sm">
                                    <ReactCountryFlag
                                        countryCode={user.country}
                                        svg
                                        className="w-3.5 h-2.5 rounded-[1px]"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-900 font-bold text-[15px]">{user.username}</span>
                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${user.gender === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'} uppercase tracking-tight`}>
                                        {user.gender === 'male' ? (
                                            <Mars className="w-2.5 h-2.5" strokeWidth={3} />
                                        ) : (
                                            <Venus className="w-2.5 h-2.5" strokeWidth={3} />
                                        )}
                                        {user.age}
                                    </div>
                                </div>
                                <span className="text-zinc-500 text-sm font-medium">{user.status}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};
