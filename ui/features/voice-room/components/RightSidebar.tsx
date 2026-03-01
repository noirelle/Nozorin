'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import ReactCountryFlag from "react-country-flag";
import { UserPlus, Phone, Clock } from 'lucide-react';

const suggestions = [
    { id: 1, username: 'Tephanieeeeeeeeeee', subtitle: 'Followed by lyraiei21', avatar: 'https://i.pravatar.cc/150?u=8' },
    { id: 2, username: 'Jim Villacorza', subtitle: 'Followed by lyraiei21', avatar: 'https://i.pravatar.cc/150?u=9' },
    { id: 3, username: 'Ven', subtitle: 'Suggested for you', avatar: 'https://i.pravatar.cc/150?u=10' },
    { id: 4, username: 'khate', subtitle: 'Suggested for you', avatar: 'https://i.pravatar.cc/150?u=11' },
    { id: 5, username: 'Kylie', subtitle: 'Followed by ddzarjane', avatar: 'https://i.pravatar.cc/150?u=12' },
];

const mockHistory: any[] = [
    { id: 1, username: 'Noirelle', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', duration: '08:12', country: 'US', isActive: true, isFriend: false },
    { id: 2, username: 'Xenon', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Xenon', duration: '03:45', country: 'CA', isActive: false, isFriend: true },
    { id: 3, username: 'Sakura', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura', duration: '12:20', country: 'JP', isActive: true, isFriend: false },
    { id: 4, username: 'Viper', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viper', duration: '01:15', country: 'DE', isActive: false, isFriend: false },
    { id: 5, username: 'Sakura', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura', duration: '12:20', country: 'JP', isActive: true, isFriend: false },
    { id: 6, username: 'Viper', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viper', duration: '01:15', country: 'DE', isActive: false, isFriend: false },
    { id: 7, username: 'Sakura', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura', duration: '12:20', country: 'JP', isActive: true, isFriend: false },
    { id: 8, username: 'Viper', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viper', duration: '01:15', country: 'DE', isActive: false, isFriend: false },
];

const mockRequests: any[] = [
    { id: 1, username: 'Luna_M', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna', country: 'FR', time: '2m ago' },
];

const mockPending: any[] = [
    { id: 1, username: 'Ghost', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ghost', country: 'BR', status: 'Sent' },
];

const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
};

const formatDate = (timestamp: number | string): string => {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
    }
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

const getReasonLabel = (reason?: string): string => {
    switch (reason) {
        case 'user-action': return 'You ended';
        case 'partner-disconnect': return 'Partner left';
        case 'partner-skip': return 'Partner skipped';
        case 'skip': return 'You skipped';
        case 'network': return 'Network issue';
        case 'error': return 'Error';
        case 'answered-another': return "Answered another";
        case 'timeout': return "Timeout";
        default: return 'Ended';
    }
};

const getReasonColor = (reason?: string): string => {
    switch (reason) {
        case 'user-action': return 'text-zinc-500';
        case 'partner-disconnect':
        case 'partner-skip': return 'text-orange-500/80';
        case 'skip': return 'text-yellow-500/80';
        case 'network':
        case 'error': return 'text-red-500/80';
        case 'timeout': return 'text-zinc-600';
        default: return 'text-zinc-600';
    }
};

const formatLastActive = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return new Date(timestamp).toLocaleDateString();
};

interface RightSidebarProps {
    history?: any[];
    friends?: any[];
    pendingRequests?: any[];
    sentRequests?: any[];
    onAcceptRequest?: (requestId: string) => void;
    onDeclineRequest?: (requestId: string) => void;
    onCall?: (targetId: string) => void;
    onAddFriend?: (targetId: string) => void;
    onRemoveFriend?: (targetId: string) => void;
    variant?: 'home' | 'voice';
    showProfile?: boolean;
}

export const RightSidebar = ({
    history,
    friends,
    pendingRequests,
    sentRequests,
    onAcceptRequest,
    onDeclineRequest,
    onCall,
    onAddFriend,
    onRemoveFriend,
    variant = 'voice',
    showProfile = true
}: RightSidebarProps = {}) => {
    const [activeTab, setActiveTab] = useState<'history' | 'requests' | 'pending'>('history');
    const isVoiceGame = variant === 'voice';

    // Map history to UI format
    const historyDisplay = (history || []).slice(0, 6).map((item: any) => {
        const profile = item.partnerProfile || item.peerProfile || {};
        const callDurationSec = item.duration || item.call_duration || 0;
        const targetUserId = item.partner_id || item.peer_user_id || profile.id;

        return {
            id: item.session_id || item.id || Math.random().toString(),
            userId: targetUserId,
            username: item.partner_username || profile.username || 'Unknown',
            avatar: item.partner_avatar || profile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Str",
            duration: formatDuration(callDurationSec),
            country: item.partner_country || profile.country || 'US',
            isActive: item.partner_status?.is_online || false,
            lastSeen: item.partner_status?.last_seen || 0,
            isFriend: (friends && friends.some(f => f.id === targetUserId)) || item.friendship_status === 'friends',
            disconnectReason: item.disconnect_reason,
            createdAt: item.created_at
        };
    });

    // Map requests to UI format
    const requestsDisplay = (pendingRequests || []).slice(0, 6).map((req: any) => {
        const profile = req.user || {};
        return {
            id: req.id,
            userId: profile.id,
            username: profile.username || 'Unknown',
            avatar: profile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Str",
            country: profile.country || 'US',
            time: req.created_at ? formatDate(req.created_at) : 'New request'
        };
    });

    // Map pending (sent requests) to UI format
    const pendingDisplay = (sentRequests || []).slice(0, 6).map((req: any) => {
        const profile = req.user || {};
        return {
            id: req.id,
            userId: profile.id,
            username: profile.username || 'Unknown',
            avatar: profile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Str",
            country: profile.country || 'US',
            status: req.created_at ? formatDate(req.created_at) : 'Sent'
        };
    });

    return (
        <aside className="w-[320px] pt-8 pl-8 hidden lg:block flex flex-col h-screen overflow-hidden">
            {/* 1. Fixed Header Area */}
            <div className="flex-none">
                {isVoiceGame ? (
                    <div className="flex items-center gap-6 mb-8 border-b border-zinc-900 pb-2">
                        {['history', 'requests', 'pending'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'text-white'
                                    : 'text-zinc-600 hover:text-zinc-400'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="h-0.5 bg-white mt-1.5 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <>
                        {showProfile && variant === 'home' && (
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
                                <button className="text-xs font-semibold text-blue-500 hover:text-white">You</button>
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <span className="text-sm font-semibold text-zinc-400">Suggested for you</span>
                            <button className="text-xs font-semibold text-white">See All</button>
                        </div>
                    </>
                )}
            </div>

            {/* 2. Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
                <div className="space-y-6">
                    {isVoiceGame ? (
                        <>
                            {activeTab === 'history' && historyDisplay.map((user) => (
                                <div key={user.id} className="group flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full border border-white/5 bg-zinc-900 p-0.5 object-cover" />
                                            {user.isActive && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />}
                                        </div>
                                        <div className="max-w-[120px]">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                                {user.disconnectReason && (
                                                    <span className={`text-[9px] font-bold uppercase shrink-0 ${getReasonColor(user.disconnectReason)}`}>
                                                        {getReasonLabel(user.disconnectReason)}
                                                    </span>
                                                )}
                                                {!user.disconnectReason && (
                                                    <ReactCountryFlag countryCode={user.country} svg className="w-3 h-2 opacity-60" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Clock className="w-2.5 h-2.5 text-zinc-600" />
                                                <p className="text-[10px] font-bold text-zinc-500 tracking-tighter tabular-nums">{user.duration}</p>
                                                <span className="text-zinc-600 text-[10px]">•</span>
                                                <p className="text-[9px] font-medium text-zinc-500">
                                                    {user.createdAt ? formatDate(user.createdAt) : (user.lastSeen ? `Seen ${formatLastActive(user.lastSeen)}` : 'Recently')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!user.isFriend && (
                                            <button
                                                onClick={() => user.userId && onAddFriend && onAddFriend(user.userId)}
                                                className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-xl transition-all"
                                                title="Add Friend"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => user.userId && onCall && onCall(user.userId)}
                                            className="p-2 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-xl transition-all"
                                            title="Call"
                                        >
                                            <Phone className="w-3.5 h-3.5 fill-current" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {activeTab === 'requests' && requestsDisplay.map(req => (
                                <div key={req.id} className="group flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={req.avatar} alt={req.username} className="w-10 h-10 rounded-full border border-white/5 bg-zinc-900 p-0.5" />
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
                                        </div>
                                        <div className="max-w-[120px]">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-white truncate">{req.username}</p>
                                                <ReactCountryFlag countryCode={req.country} svg className="w-3 h-2 opacity-60" />
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Clock className="w-2.5 h-2.5 text-zinc-600" />
                                                <p className="text-[10px] font-bold text-zinc-500 tracking-tighter uppercase">{req.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onAcceptRequest && onAcceptRequest(req.id)}
                                        className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-black text-[10px] font-black rounded-xl transition-all shadow-lg active:scale-95"
                                    >
                                        Accept
                                    </button>
                                </div>
                            ))}
                            {activeTab === 'pending' && pendingDisplay.map(p => (
                                <div key={p.id} className="group flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={p.avatar} alt={p.username} className="w-10 h-10 rounded-full border border-white/5 bg-zinc-900 p-0.5 grayscale" />
                                        </div>
                                        <div className="max-w-[120px]">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-zinc-400 truncate">{p.username}</p>
                                                <ReactCountryFlag countryCode={p.country} svg className="w-3 h-2 opacity-30 grayscale" />
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{p.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onDeclineRequest && onDeclineRequest(p.id)}
                                        className="p-2 hover:bg-zinc-900 text-zinc-700 hover:text-red-500 rounded-xl transition-all"
                                    >
                                        <Clock className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </>
                    ) : (
                        suggestions.map((user) => (
                            <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                                    <div className="max-w-[150px]">
                                        <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                                        <p className="text-xs text-zinc-400 truncate">{user.subtitle}</p>
                                    </div>
                                </div>
                                <button className="text-xs font-semibold text-blue-500 hover:text-white">Follow</button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 3. Fixed Footer Area */}
            <footer className="flex-none pt-10 pb-12 mt-auto border-t border-zinc-900/50 bg-black shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-10">
                <div className="flex flex-wrap gap-x-2 gap-y-1 mb-4">
                    {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language', 'Meta Verified'].map((link) => (
                        <span key={link} className="cursor-pointer hover:underline text-[11px] text-zinc-500 font-medium">{link}</span>
                    ))}
                </div>
                <p className="font-black tracking-widest opacity-20 text-[9px] text-zinc-500 uppercase">© 2026 NOZORIN FROM NORELE</p>
            </footer>
        </aside>
    );
};
