import React, { useState } from 'react';
import ReactCountryFlag from 'react-country-flag';

interface FriendsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    friends: any[];
    pendingRequests: any[];
    sentRequests: any[];
    onAcceptRequest: (requestId: string) => void;
    onDeclineRequest: (requestId: string) => void;
    onRemoveFriend: (friendId: string) => void;
    onCall: (targetUserId: string) => void;
    isConnected: boolean;
    isLoading: boolean;
}

const formatDate = (timestamp: number | string): string => {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
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

export const FriendsDrawer: React.FC<FriendsDrawerProps> = ({
    isOpen,
    onClose,
    friends,
    pendingRequests,
    sentRequests,
    onAcceptRequest,
    onDeclineRequest,
    onRemoveFriend,
    onCall,
    isConnected,
    isLoading
}) => {
    const [activeTab, setActiveTab] = useState<'friends' | 'received' | 'sent'>('friends');

    if (!isOpen) return null;

    const receivedRequests = pendingRequests;

    return (
        <div className="fixed bottom-0 left-0 w-full z-[100] flex justify-center pointer-events-none">
            {/* Drawer Content */}
            <div className="relative w-full bg-white rounded-t-[2rem] shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.1)] border-t border-slate-100 p-6 animate-in slide-in-from-bottom duration-300 pointer-events-auto pb-8 flex flex-col max-h-[70vh]">

                {/* Drag Handle */}
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />

                <div className="flex justify-between items-center mb-6 px-2 shrink-0 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-6 min-w-max pb-1">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`text-xl font-display font-bold tracking-tight transition-colors ${activeTab === 'friends' ? 'text-slate-800' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                            Friends
                        </button>
                        <button
                            onClick={() => setActiveTab('received')}
                            className={`text-xl font-display font-bold tracking-tight transition-colors relative ${activeTab === 'received' ? 'text-slate-800' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                            Requests
                            {receivedRequests.length > 0 && (
                                <span className="absolute -top-1 -right-4 w-4 h-4 bg-[#FF0055] text-white text-[9px] flex items-center justify-center rounded-full border border-white font-bold">
                                    {receivedRequests.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`text-xl font-display font-bold tracking-tight transition-colors relative ${activeTab === 'sent' ? 'text-slate-800' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                            Sent
                            {sentRequests.length > 0 && (
                                <span className="absolute -top-1 -right-4 w-4 h-4 bg-slate-400 text-white text-[9px] flex items-center justify-center rounded-full border border-white font-bold">
                                    {sentRequests.length}
                                </span>
                            )}
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600 shrink-0 ml-4 mb-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF0055]"></div>
                        </div>
                    ) : activeTab === 'friends' ? (
                        friends.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center opacity-40">
                                <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <p className="text-slate-500 font-bold">No friends yet</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 px-2">
                                {friends.map((friend) => (
                                    <div
                                        key={friend.id}
                                        className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                    {friend.avatar ? (
                                                        <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ReactCountryFlag countryCode={friend.country || 'US'} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    )}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${friend.is_online ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800 truncate">{friend.username ? `@${friend.username}` : (friend.country_name || 'Friend')}</span>
                                                    {friend.country && (
                                                        <ReactCountryFlag countryCode={friend.country} svg className="w-3 h-2" />
                                                    )}
                                                </div>
                                                <div className="text-[10px] font-bold">
                                                    {friend.is_online ? (
                                                        <span className="text-green-500 flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                                            Online
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">Offline</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    if (confirm('Remove friend?')) onRemoveFriend(friend.id);
                                                }}
                                                className="w-9 h-9 rounded-full border border-slate-100 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onCall(friend.id)}
                                                disabled={isConnected || !friend.is_online}
                                                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shrink-0 ${(isConnected || !friend.is_online)
                                                    ? 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed'
                                                    : 'bg-[#FF0055]/10 text-[#FF0055] border-[#FF0055]/10 hover:bg-[#FF0055] hover:text-white shadow-sm'
                                                    }`}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        (activeTab === 'received' ? receivedRequests : sentRequests).length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center opacity-40">
                                <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                <p className="text-slate-500 font-bold">No {activeTab} requests</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 px-2">
                                {(activeTab === 'received' ? receivedRequests : sentRequests).map((request) => (
                                    <div
                                        key={request.id}
                                        className="p-3 rounded-xl border border-slate-100 bg-white flex items-center justify-between gap-3 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                {request.user?.avatar ? (
                                                    <img src={request.user?.avatar} alt={request.user?.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ReactCountryFlag countryCode={request.user?.country || 'US'} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800 truncate">
                                                        {request.user?.username ? `@${request.user.username}` : (request.user?.country_name || 'User')}
                                                    </span>
                                                    {request.user?.country && (
                                                        <ReactCountryFlag countryCode={request.user.country} svg className="w-3 h-2" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 font-medium leading-none">
                                                    <span className={`text-[9px] uppercase font-bold ${request.type === 'sent' ? 'text-slate-400' : 'text-[#FF0055]'}`}>
                                                        {request.type === 'sent' ? 'Sent' : 'New Request'}
                                                    </span>
                                                    <span className="text-[9px] text-slate-300">•</span>
                                                    <span className="text-[9px] text-slate-400">{formatDate(request.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {request.type === 'received' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onDeclineRequest(request.id)}
                                                    className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-bold hover:bg-slate-100 transition-colors"
                                                >
                                                    Decline
                                                </button>
                                                <button
                                                    onClick={() => onAcceptRequest(request.id)}
                                                    className="px-3 py-1.5 rounded-xl bg-[#FF0055] text-white text-[10px] font-bold hover:bg-[#E6004D] transition-colors shadow-sm"
                                                >
                                                    Accept
                                                </button>
                                            </div>
                                        )}
                                        {request.type === 'sent' && (
                                            <div className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                                Pending
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                <div className="mt-6 flex justify-center w-full shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full max-w-sm bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
