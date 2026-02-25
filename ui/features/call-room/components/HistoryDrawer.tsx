import React, { useEffect, useRef } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { SessionRecord, HistoryStats } from '../../../hooks';

const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
};

const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
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

const getReasonLabel = (reason?: SessionRecord['disconnectReason']): string => {
    switch (reason) {
        case 'user-action': return 'You ended';
        case 'partner-disconnect': return 'Partner left';
        case 'skip': return 'Skipped';
        case 'network': return 'Network issue';
        case 'error': return 'Error';
        case 'answered-another': return "Answered another user's call";
        default: return 'Ended';
    }
};

const getReasonColor = (reason?: SessionRecord['disconnectReason']): string => {
    switch (reason) {
        case 'user-action': return 'text-blue-500';
        case 'partner-disconnect': return 'text-orange-500';
        case 'skip': return 'text-yellow-500';
        case 'network':
        case 'error': return 'text-red-500';
        default: return 'text-slate-400';
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

interface HistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    history: SessionRecord[];
    stats: HistoryStats | null;
    isLoading: boolean;
    error: string | null;
    onClearHistory: () => void;
    onRefresh: () => void;
    onCall: (targetUserId: string) => void;
    onAddFriend: (targetUserId: string) => void;
    friends: any[];
    pendingRequests: any[];
    isConnected: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
    isOpen,
    onClose,
    history,
    stats,
    isLoading,
    error,
    onClearHistory,
    onRefresh,
    onCall,
    onAddFriend,
    friends,
    pendingRequests,
    isConnected,
}) => {
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        if (isOpen && !hasLoadedRef.current) {
            hasLoadedRef.current = true;
            onRefresh();
        } else if (!isOpen) {
            hasLoadedRef.current = false;
        }
    }, [isOpen, onRefresh]);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full z-[100] flex justify-center pointer-events-none">
            {/* Drawer Content - Same height as FilterDrawer */}
            <div className="relative w-full bg-white rounded-t-[2rem] shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.1)] border-t border-slate-100 p-6 animate-in slide-in-from-bottom duration-300 pointer-events-auto pb-8 flex flex-col max-h-[60vh]">

                {/* Drag Handle */}
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />

                <div className="flex justify-between items-center mb-6 px-2 shrink-0">
                    <div>
                        <h2 className="text-2xl font-display font-bold tracking-tight text-slate-800">History</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onRefresh}
                            className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF0055]"></div>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-4">
                            <div className="text-red-500 mb-2 font-bold">⚠️ Error loading history</div>
                            <p className="text-slate-400 text-xs mb-4">{error}</p>
                            <button onClick={onRefresh} className="text-xs font-bold text-[#FF0055] hover:underline">Try again</button>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center opacity-40">
                            <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-slate-500 font-bold">No history yet</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 px-2">
                            {history.map((session) => (
                                <div
                                    key={session.sessionId}
                                    className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 shadow-sm"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                {session.partnerAvatar ? (
                                                    <img src={session.partnerAvatar} alt={session.partnerUsername} className="w-full h-full object-cover" />
                                                ) : session.partnerCountryCode ? (
                                                    <ReactCountryFlag countryCode={session.partnerCountryCode} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span className="text-xs text-slate-400">?</span>
                                                )}
                                            </div>
                                            {/* Online Status Dot */}
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${session.partnerStatus?.isOnline ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-800 truncate">
                                                    {session.partnerUsername ? `@${session.partnerUsername}` : (session.partnerCountry || 'Unknown')}
                                                </span>
                                                <span className={`text-[9px] font-bold uppercase shrink-0 ${getReasonColor(session.disconnectReason)}`}>
                                                    {getReasonLabel(session.disconnectReason)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                                    <span>{formatDuration(session.duration)}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(session.createdAt)}</span>
                                                </div>
                                                <div className="text-[9px] font-bold mt-0.5">
                                                    {session.partnerStatus?.isOnline ? (
                                                        <span className="text-green-500 flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                                            Active now
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">Last seen: {formatLastActive(session.partnerStatus?.lastSeen || 0)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {session.partnerId &&
                                            !friends.some(f => f.id === session.partnerId) &&
                                            !pendingRequests.some(r => r.senderId === session.partnerId || r.receiverId === session.partnerId) && (
                                                <button
                                                    onClick={() => session.partnerId && onAddFriend(session.partnerId)}
                                                    title="Add Friend"
                                                    className="w-9 h-9 rounded-full border border-slate-100 bg-slate-50 text-slate-400 hover:bg-pink-50 hover:text-[#FF0055] hover:border-pink-100 flex items-center justify-center transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            )}

                                        {session.partnerStatus?.isOnline && (
                                            <button
                                                onClick={() => session.partnerId && onCall(session.partnerId)}
                                                disabled={isConnected}
                                                title={isConnected ? 'Already in a call' : 'Call user'}
                                                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shrink-0 ${isConnected
                                                    ? 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed'
                                                    : 'bg-[#FF0055]/10 text-[#FF0055] border-[#FF0055]/10 hover:bg-[#FF0055] hover:text-white shadow-sm'
                                                    }`}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Clear Button */}
                {history.length > 0 && (
                    <div className="mt-4 px-2 shrink-0 flex justify-between items-center">
                        {stats && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {stats.totalSessions} Sessions
                            </span>
                        )}
                        <button
                            onClick={() => {
                                if (confirm('Clear all history?')) onClearHistory();
                            }}
                            className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest pl-4"
                        >
                            Clear History
                        </button>
                    </div>
                )}

                <div className="mt-4 flex justify-center w-full shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full max-w-sm bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg"
                    >
                        Close History
                    </button>
                </div>
            </div>
        </div>
    );
};
