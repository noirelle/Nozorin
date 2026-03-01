'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import ReactCountryFlag from "react-country-flag";
import { UserPlus, Phone, Clock } from 'lucide-react';

const suggestions = [
    { id: 1, username: 'elara_sky', subtitle: 'Followed by lyraiei21', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elara' },
    { id: 2, username: 'zeno_pulse', subtitle: 'Followed by lyraiei21', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zeno' },
    { id: 3, username: 'kai_zenith', subtitle: 'Suggested for you', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai' },
    { id: 4, username: 'mira_vibe', subtitle: 'Suggested for you', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mira' },
    { id: 5, username: 'nova_flow', subtitle: 'Followed by ddzarjane', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova' },
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
    const historyDisplay = (history || []).map((item: any) => {
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
    const requestsDisplay = (pendingRequests || []).map((req: any) => {
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
    const pendingDisplay = (sentRequests || []).map((req: any) => {
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
                    <div className="flex items-center gap-6 mb-8 pb-2">
                        {['history', 'requests', 'pending'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'text-pink-600'
                                    : 'text-zinc-500 hover:text-zinc-700'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="h-0.5 bg-pink-600 mt-1.5 rounded-full" />
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
                                        <p className="text-sm font-semibold text-zinc-900">a1r4su</p>
                                        <p className="text-sm text-zinc-500">Arisu</p>
                                    </div>
                                </div>
                                <button className="text-xs font-semibold text-blue-500 hover:text-white">You</button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mb-4 mt-2">
                            <span className="text-sm font-semibold text-zinc-600">Suggested for you</span>
                            <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm border border-pink-100">Upcoming</span>
                        </div>
                    </>
                )}
            </div>

            {/* 2. Scrollable Content Area */}
            <div className="flex-1 max-h-[420px] overflow-y-auto scrollbar-hide pr-2">
                <div className="space-y-6">
                    {isVoiceGame ? (
                        <>
                            {activeTab === 'history' && historyDisplay.map((user) => (
                                <div key={user.id} className="group flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full border border-pink-50 bg-white shadow-sm p-0.5 object-cover" />
                                            {user.isActive && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}
                                        </div>
                                        <div className="max-w-[120px]">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-zinc-900 truncate">{user.username}</p>
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
                                                className="p-2 hover:bg-pink-50 text-zinc-500 hover:text-pink-600 rounded-xl transition-all"
                                                title="Add Friend"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => user.userId && onCall && onCall(user.userId)}
                                            className="p-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl transition-all"
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
                                            <img src={req.avatar} alt={req.username} className="w-10 h-10 rounded-full border border-pink-50 bg-white shadow-sm p-0.5" />
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                                        </div>
                                        <div className="max-w-[120px]">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-zinc-900 truncate">{req.username}</p>
                                                <ReactCountryFlag countryCode={req.country} svg className="w-3 h-2 opacity-60" />
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Clock className="w-2.5 h-2.5 text-zinc-400" />
                                                <p className="text-[10px] font-bold text-zinc-500 tracking-tighter uppercase">{req.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onAcceptRequest && onAcceptRequest(req.id)}
                                        className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 text-[10px] font-black rounded-xl transition-all shadow-sm active:scale-95"
                                    >
                                        Accept
                                    </button>
                                </div>
                            ))}
                            {activeTab === 'pending' && pendingDisplay.map(p => (
                                <div key={p.id} className="group flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={p.avatar} alt={p.username} className="w-10 h-10 rounded-full border border-zinc-200 bg-white shadow-sm p-0.5 grayscale" />
                                        </div>
                                        <div className="max-w-[120px]">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-zinc-500 truncate">{p.username}</p>
                                                <ReactCountryFlag countryCode={p.country} svg className="w-3 h-2 opacity-30" />
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{p.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onDeclineRequest && onDeclineRequest(p.id)}
                                        className="p-2 hover:bg-red-50 text-red-500/50 hover:text-red-500 rounded-xl transition-all"
                                    >
                                        <Clock className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </>
                    ) : (
                        suggestions.map((user) => (
                            <div key={user.id} className="flex items-center justify-between opacity-30 grayscale pointer-events-none select-none filter blur-[0.2px] hover:blur-0 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img
                                            src={user.avatar}
                                            alt={user.username}
                                            className="w-8 h-8 rounded-full border border-zinc-200 shadow-sm"
                                        />
                                        <div className="absolute inset-0 rounded-full shadow-inner bg-white/20 pointer-events-none" />
                                    </div>
                                    <div className="max-w-[150px]">
                                        <p className="text-sm font-semibold text-zinc-900 truncate">{user.username}</p>
                                        <p className="text-xs text-zinc-500 truncate">{user.subtitle}</p>
                                    </div>
                                </div>
                                <button className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">Add</button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 3. Fixed Footer Area */}
            <footer className="flex-none pt-6 pb-8 mt-auto z-10 px-2">
                <div className="flex flex-wrap gap-x-2 gap-y-1 mb-4">
                    {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language', 'Meta Verified'].map((link) => (
                        <span key={link} className="cursor-pointer hover:underline text-[11px] text-zinc-400 font-medium">{link}</span>
                    ))}
                </div>
                <p className="font-black tracking-widest text-[9px] text-zinc-400 uppercase">© 2026 NOZORIN</p>
            </footer>
        </aside>
    );
};
