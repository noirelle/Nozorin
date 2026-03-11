'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import ReactCountryFlag from "react-country-flag";
import { UserPlus, UserCheck, UserMinus, Phone, Clock, Trash2, Users, Activity, History as HistoryIcon } from 'lucide-react';
import { useUser } from '@/hooks';
import { getAvatarUrl } from '@/utils/avatar';

const mockUsernames = [
    'nova_storm',
    'crimson_fox',
    'lunar_shadow',
    'echo_wave',
    'iron_claw',
    'sky_blade',
    'vortex_ray',
    'silent_hawk',
    'blaze_ryu',
    'neon_fang'
];
const getRandomUsername = () => mockUsernames[Math.floor(Math.random() * mockUsernames.length)];

const suggestions = [
    { id: 1, username: 'elara_sky', subtitle: `Followed by ${getRandomUsername()}`, avatar: 'Elara' },
    { id: 2, username: 'zeno_pulse', subtitle: `Followed by ${getRandomUsername()}`, avatar: 'Zeno' },
    { id: 3, username: 'kai_zenith', subtitle: 'Suggested for you', avatar: 'Kai' },
    { id: 4, username: 'mira_vibe', subtitle: 'Suggested for you', avatar: 'Mira' },
    { id: 5, username: 'nova_flow', subtitle: `Followed by ${getRandomUsername()}`, avatar: 'Nova' },
];

const mockHistory: any[] = [
    { id: 1, username: 'Noirelle', avatar: 'Felix', duration: '08:12', country: 'US', isActive: true, isFriend: false },
    { id: 2, username: 'Xenon', avatar: 'Xenon', duration: '03:45', country: 'CA', isActive: false, isFriend: true },
    { id: 3, username: 'Sakura', avatar: 'Sakura', duration: '12:20', country: 'JP', isActive: true, isFriend: false },
    { id: 4, username: 'Viper', avatar: 'Viper', duration: '01:15', country: 'DE', isActive: false, isFriend: false },
    { id: 5, username: 'Sakura', avatar: 'Sakura', duration: '12:20', country: 'JP', isActive: true, isFriend: false },
    { id: 6, username: 'Viper', avatar: 'Viper', duration: '01:15', country: 'DE', isActive: false, isFriend: false },
    { id: 7, username: 'Sakura', avatar: 'Sakura', duration: '12:20', country: 'JP', isActive: true, isFriend: false },
    { id: 8, username: 'Viper', avatar: 'Viper', duration: '01:15', country: 'DE', isActive: false, isFriend: false },
];

const mockRequests: any[] = [
    { id: 1, username: 'Luna_M', avatar: 'Luna', country: 'FR', time: '2m ago' },
];

const mockPending: any[] = [
    { id: 1, username: 'Ghost', avatar: 'Ghost', country: 'BR', status: 'Sent' },
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
    const timeMs = ts < 1e12 ? ts * 1000 : ts;
    const date = new Date(timeMs);
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
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
    // Ensure timestamp is in milliseconds (if it's in seconds, it'll be a small number like 171xxx)
    const timeMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;
    const diffMs = Date.now() - timeMs;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    // If more than a day, show the actual date without time
    return new Date(timeMs).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
    });
};

interface RightSidebarProps {
    history?: any[];
    friends?: any[];
    pendingRequests?: any[];
    sentRequests?: any[];
    onAcceptRequest?: (requestId: string) => void;
    onDeclineRequest?: (requestId: string) => void;
    onCancelRequest?: (requestId: string) => void;
    onCall?: (targetId: string) => void;
    onAddFriend?: (targetId: string) => void;
    onRemoveFriend?: (targetId: string) => void;
    variant?: 'home' | 'voice';
    showProfile?: boolean;
    isBusy?: boolean;
}

const ProfileSection = () => {
    const { user } = useUser();
    if (!user) return null;
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <img
                    src={getAvatarUrl(user.avatar || user.username)}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover border border-zinc-100"
                />
                <div>
                    <p className="text-sm font-semibold text-zinc-900">{user.username}</p>
                    <p className="text-xs text-zinc-500 font-medium tracking-tight">#{user.id}</p>
                </div>
            </div>
            <button className="text-xs font-semibold text-blue-500 hover:text-blue-600">You</button>
        </div>
    );
};

export const RightSidebar = ({
    history,
    friends,
    pendingRequests,
    sentRequests,
    onAcceptRequest,
    onDeclineRequest,
    onCancelRequest,
    onCall,
    onAddFriend,
    onRemoveFriend,
    variant = 'voice',
    showProfile = true,
    isBusy = false
}: RightSidebarProps = {}) => {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'history' | 'friends' | 'activity'>('friends');
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
            avatar: getAvatarUrl(item.partner_avatar || profile.avatar || profile.username || 'Str'),
            duration: formatDuration(callDurationSec),
            country: item.partner_country || profile.country || 'US',
            isActive: item.partner_status?.is_online || false,
            lastSeen: item.partner_status?.last_seen || 0,
            isFriend: (friends && friends.some(f => f.id === targetUserId)) || item.friendship_status === 'friends',
            isPendingSent: (sentRequests && sentRequests.some(r => (r.user?.id || r.target_user_id) === targetUserId)) || item.friendship_status === 'pending_sent',
            isPendingReceived: (pendingRequests && pendingRequests.some(r => (r.user?.id || r.from_user_id) === targetUserId)) || item.friendship_status === 'pending_received',
            requestId: (pendingRequests && pendingRequests.find(r => (r.user?.id || r.from_user_id) === targetUserId))?.id,
            sentRequestId: (sentRequests && sentRequests.find(r => (r.user?.id || r.target_user_id) === targetUserId))?.id,
            disconnectReason: item.disconnect_reason,
            createdAt: item.created_at
        };
    });

    // Map friends to UI format
    const friendsDisplay = (friends || []).map((friend: any) => ({
        id: friend.id,
        userId: friend.id,
        username: friend.username || 'Unknown',
        avatar: getAvatarUrl(friend.avatar || friend.username || 'Str'),
        country: friend.country || 'US',
        isActive: friend.is_online || false,
        lastSeen: friend.last_seen || 0,
    }));

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
                    <div className="flex items-center gap-6 mb-6 h-10 border-b border-zinc-50">
                        {['friends', 'activity', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all pb-3 -mb-px ${activeTab === tab
                                    ? 'text-pink-600 border-b-2 border-pink-600'
                                    : 'text-zinc-400 hover:text-zinc-600'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                ) : (
                    <>
                        {showProfile && variant === 'home' && <ProfileSection />}
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
                            {activeTab === 'friends' && (
                                <div className="space-y-4">
                                    {friendsDisplay.length > 0 ? friendsDisplay.map((user) => (
                                        <div key={user.id} className="group flex items-center justify-between transition-all hover:bg-zinc-50/50 p-1.5 -m-1.5 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img src={getAvatarUrl(user.avatar)} alt={user.username} className="w-11 h-11 rounded-2xl border border-zinc-100 bg-white shadow-sm object-cover" />
                                                    {user.isActive && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-[13px] font-bold text-zinc-900">{user.username}</p>
                                                        {user.country && <ReactCountryFlag countryCode={user.country} svg className="w-3.5 h-3.5 rounded-sm shadow-sm" />}
                                                    </div>
                                                    <p className={`text-[10px] font-medium ${user.isActive ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                                        {user.isActive ? 'Active' : (user.lastSeen ? formatLastActive(user.lastSeen) : 'Recent')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 transition-all">
                                                <button
                                                    onClick={() => !isBusy && user.isActive && user.userId && onCall && onCall(user.userId)}
                                                    disabled={isBusy || !user.isActive}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isBusy || !user.isActive ? 'bg-zinc-50 text-zinc-300 opacity-50 cursor-not-allowed' : 'bg-zinc-900 text-white shadow-lg shadow-zinc-200 hover:bg-zinc-800 active:scale-95'}`}
                                                    title={isBusy ? 'Finish current call first' : !user.isActive ? 'User is offline' : 'Call'}
                                                >
                                                    <Phone className="w-4 h-4 fill-current" />
                                                </button>
                                                <button
                                                    onClick={() => user.userId && onRemoveFriend && onRemoveFriend(user.userId)}
                                                    className="w-9 h-9 flex items-center justify-center text-zinc-400 bg-zinc-50 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center">
                                            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Users className="w-6 h-6 text-zinc-200" />
                                            </div>
                                            <p className="text-xs font-bold text-zinc-400">No friends yet</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <div className="space-y-8">
                                    {/* Received Requests */}
                                    {requestsDisplay.length > 0 && (
                                        <div>
                                            <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4 px-1">Received</h4>
                                            <div className="space-y-4">
                                                {requestsDisplay.map(req => (
                                                    <div key={req.id} className="flex items-center justify-between bg-zinc-50/50 p-2 rounded-2xl border border-zinc-100/50 transition-all hover:border-zinc-200">
                                                        <div className="flex items-center gap-3">
                                                            <img src={getAvatarUrl(req.avatar)} alt={req.username} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className="text-[12px] font-bold text-zinc-900">{req.username}</p>
                                                                    {req.country && <ReactCountryFlag countryCode={req.country} svg className="w-3 h-3 rounded-sm shadow-sm" />}
                                                                </div>
                                                                <p className="text-[9px] font-medium text-zinc-400">{req.time}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                onClick={() => onAcceptRequest && onAcceptRequest(req.id)}
                                                                className="w-8 h-8 flex items-center justify-center bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-sm active:scale-90"
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => onDeclineRequest && onDeclineRequest(req.id)}
                                                                className="w-8 h-8 flex items-center justify-center bg-white text-zinc-400 rounded-lg hover:bg-zinc-100 transition-all border border-zinc-200 active:scale-90"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sent Requests */}
                                    {pendingDisplay.length > 0 && (
                                        <div>
                                            <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4 px-1">Sent</h4>
                                            <div className="space-y-3">
                                                {pendingDisplay.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between px-2">
                                                        <div className="flex items-center gap-3 opacity-60">
                                                            <img src={getAvatarUrl(p.avatar)} alt={p.username} className="w-8 h-8 rounded-lg object-cover grayscale" />
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-[11px] font-bold text-zinc-600">{p.username}</p>
                                                                {p.country && <ReactCountryFlag countryCode={p.country} svg className="w-3 h-3 rounded-sm grayscale" />}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => onCancelRequest && onCancelRequest(p.id)}
                                                            className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {requestsDisplay.length === 0 && pendingDisplay.length === 0 && (
                                        <div className="py-12 text-center">
                                            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Activity className="w-6 h-6 text-zinc-200" />
                                            </div>
                                            <p className="text-xs font-bold text-zinc-400">No activity</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    {historyDisplay.length > 0 ? historyDisplay.map((user) => (
                                        <div key={user.id} className="group flex items-center justify-between p-1.5 -m-1.5 rounded-2xl hover:bg-zinc-50/50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img src={getAvatarUrl(user.avatar)} alt={user.username} className="w-10 h-10 rounded-xl bg-zinc-50 object-cover shadow-sm" />
                                                    {user.isActive && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-[12px] font-bold text-zinc-900">{user.username}</p>
                                                        {user.country && <ReactCountryFlag countryCode={user.country} svg className="w-3.5 h-3.5 rounded-sm shadow-sm" />}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        <p className="text-[9px] font-medium text-zinc-500">
                                                            <span className="text-zinc-400">Talked for:</span> <span className="text-zinc-700 font-bold">{user.duration}</span>
                                                        </p>
                                                        <p className="text-[9px] font-medium text-zinc-500">
                                                            <span className="text-zinc-400">Matched:</span> <span className="text-zinc-700 font-bold">{user.createdAt ? formatDate(user.createdAt) : 'Recently'}</span>
                                                        </p>
                                                        <p className={`text-[9px] font-bold mt-0.5 ${user.isActive ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                                            {user.isActive ? 'Active Now' : (user.lastSeen ? `Active ${formatLastActive(user.lastSeen)}` : 'Offline')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 transition-all">
                                                {!user.isFriend && !user.isPendingSent && !user.isPendingReceived && (
                                                    <button
                                                        onClick={() => user.userId && onAddFriend && onAddFriend(user.userId)}
                                                        className="w-8 h-8 flex items-center justify-center text-zinc-400 bg-zinc-50 rounded-xl hover:bg-pink-50 hover:text-pink-500 transition-all active:scale-95"
                                                        title="Add Friend"
                                                    >
                                                        <UserPlus className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {user.isFriend && (
                                                    <button
                                                        onClick={() => user.userId && onRemoveFriend && onRemoveFriend(user.userId)}
                                                        className="w-8 h-8 flex items-center justify-center text-zinc-400 bg-zinc-50 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
                                                        title="Remove Friend"
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => !isBusy && user.isActive && user.userId && onCall && onCall(user.userId)}
                                                    disabled={isBusy || !user.isActive}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isBusy || !user.isActive ? 'bg-zinc-50 text-zinc-300 opacity-50 cursor-not-allowed' : 'bg-zinc-900 text-white shadow-sm shadow-zinc-200 hover:bg-zinc-800 active:scale-95'}`}
                                                    title={isBusy ? 'Finish current call first' : !user.isActive ? 'User is offline' : 'Call'}
                                                >
                                                    <Phone className="w-3.5 h-3.5 fill-current" />
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center">
                                            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <HistoryIcon className="w-6 h-6 text-zinc-200" />
                                            </div>
                                            <p className="text-xs font-bold text-zinc-400">No history yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            {suggestions.map((user) => (
                                <div key={user.id} className="flex items-center justify-between opacity-30 grayscale pointer-events-none select-none filter blur-[0.2px] hover:blur-0 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={getAvatarUrl(user.avatar)}
                                                alt={user.username}
                                                className="w-8 h-8 rounded-full border border-zinc-200 shadow-sm"
                                            />
                                            <div className="absolute inset-0 rounded-full shadow-inner bg-white/20 pointer-events-none" />
                                        </div>
                                        <div className="max-w-[150px]">
                                            <p className="text-sm font-semibold text-zinc-900 truncate">{user.username}</p>
                                            <p className="text-[10px] text-zinc-400 truncate tracking-tight">{user.subtitle}</p>
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">Connect</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Footer Links Area */}
            <div className="flex-none pt-4 pb-12 border-t border-zinc-50 mt-4 px-2">
                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                    {['About', 'Help', 'Terms', 'Privacy', 'Safety'].map(link => (
                        <a key={link} href="#" className="text-[10px] font-bold text-zinc-300 hover:text-zinc-500 transition-colors uppercase tracking-widest">{link}</a>
                    ))}
                </div>
                <p className="text-[9px] font-bold text-zinc-200 uppercase tracking-[0.2em]">© 2026 NOZORIN</p>
            </div>
        </aside>
    );
};
