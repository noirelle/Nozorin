'use client';

import { Sidebar } from '@/components/Sidebar';

const suggestions = [
    { id: 1, username: 'Tephanieeeeeeeeeee', subtitle: 'Followed by lyraiei21', avatar: 'https://i.pravatar.cc/150?u=8' },
    { id: 2, username: 'Jim Villacorza', subtitle: 'Followed by lyraiei21', avatar: 'https://i.pravatar.cc/150?u=9' },
    { id: 3, username: 'Ven', subtitle: 'Suggested for you', avatar: 'https://i.pravatar.cc/150?u=10' },
    { id: 4, username: 'khate', subtitle: 'Suggested for you', avatar: 'https://i.pravatar.cc/150?u=11' },
    { id: 5, username: 'Kylie', subtitle: 'Followed by ddzarjane', avatar: 'https://i.pravatar.cc/150?u=12' },
];

export const RightSidebar = () => {
    return (
        <aside className="w-[320px] pt-10 pl-8 hidden lg:block">
            {/* Current User */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <img
                        src="/social/arisu.png"
                        alt="Arisu"
                        className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                        <p className="text-sm font-semibold text-white">a1r4su</p>
                        <p className="text-sm text-zinc-400">Arisu</p>
                    </div>
                </div>
                <button className="text-xs font-semibold text-blue-500 hover:text-white">Switch</button>
            </div>

            {/* Suggestions Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-zinc-400">Suggested for you</span>
                <button className="text-xs font-semibold text-white">See All</button>
            </div>

            {/* Suggestions List */}
            <div className="space-y-4 mb-8">
                {suggestions.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-8 h-8 rounded-full"
                            />
                            <div className="max-w-[150px]">
                                <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                                <p className="text-xs text-zinc-400 truncate">{user.subtitle}</p>
                            </div>
                        </div>
                        <button className="text-xs font-semibold text-blue-500 hover:text-white">Follow</button>
                    </div>
                ))}
            </div>

            {/* Footer Links */}
            <footer className="text-[12px] text-zinc-500 leading-normal">
                <div className="flex flex-wrap gap-x-2 gap-y-1 mb-4">
                    {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language', 'Meta Verified'].map((link) => (
                        <span key={link} className="cursor-pointer hover:underline">{link}</span>
                    ))}
                </div>
                <p>© 2026 INSTAGRAM FROM META</p>
            </footer>
        </aside>
    );
};
