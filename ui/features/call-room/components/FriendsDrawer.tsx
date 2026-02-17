import React, { useState } from 'react';
import ReactCountryFlag from 'react-country-flag';

interface FriendsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    friends: any[];
    pendingRequests: any[];
    onAcceptRequest: (requestId: string) => void;
    onDeclineRequest: (requestId: string) => void;
    onRemoveFriend: (friendId: string) => void;
    onCall: (targetUserId: string) => void;
    isConnected: boolean;
    isLoading: boolean;
}

export const FriendsDrawer: React.FC<FriendsDrawerProps> = ({
    isOpen,
    onClose,
    friends,
    pendingRequests,
    onAcceptRequest,
    onDeclineRequest,
    onRemoveFriend,
    onCall,
    isConnected,
    isLoading
}) => {
    const [activeTab, setActiveTab] = useState<'friends' | 'pending'>('friends');

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full z-[100] flex justify-center pointer-events-none">
            {/* Drawer Content */}
            <div className="relative w-full bg-white rounded-t-[2rem] shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.1)] border-t border-slate-100 p-6 animate-in slide-in-from-bottom duration-300 pointer-events-auto pb-8 flex flex-col max-h-[70vh]">

                {/* Drag Handle */}
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />

                <div className="flex justify-between items-center mb-6 px-2 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`text-2xl font-display font-bold tracking-tight transition-colors ${activeTab === 'friends' ? 'text-slate-800' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                            Friends
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`text-2xl font-display font-bold tracking-tight transition-colors relative ${activeTab === 'pending' ? 'text-slate-800' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                            Requests
                            {pendingRequests.length > 0 && (
                                <span className="absolute -top-1 -right-4 w-5 h-5 bg-[#FF0055] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600"
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
                                                    <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${friend.status?.isOnline ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800 truncate">{friend.username}</span>
                                                    {friend.countryCode && (
                                                        <ReactCountryFlag countryCode={friend.countryCode} svg className="w-3 h-2" />
                                                    )}
                                                </div>
                                                <div className="text-[10px] font-bold">
                                                    {friend.status?.isOnline ? (
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
                                                disabled={isConnected || !friend.status?.isOnline}
                                                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shrink-0 ${(isConnected || !friend.status?.isOnline)
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
                        pendingRequests.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center opacity-40">
                                <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                <p className="text-slate-500 font-bold">No pending requests</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 px-2">
                                {pendingRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="p-3 rounded-xl border border-slate-100 bg-white flex items-center justify-between gap-3 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                <img src={request.profile?.avatar} alt={request.profile?.username} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800 truncate">{request.profile?.username}</span>
                                                    {request.profile?.countryCode && (
                                                        <ReactCountryFlag countryCode={request.profile.countryCode} svg className="w-3 h-2" />
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {request.type === 'sent' ? 'Friend request sent' : 'Wants to be your friend'}
                                                </span>
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
