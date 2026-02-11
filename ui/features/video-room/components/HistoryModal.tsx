import React, { useEffect, useRef } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { SessionRecord, HistoryStats } from '@/hooks/useHistory';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: SessionRecord[];
    stats: HistoryStats | null;
    isLoading: boolean;
    error: string | null;
    onClearHistory: () => void;
    onRefresh: () => void;
    onCall: (targetUserId: string) => void;
    isConnected: boolean;
}

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

const getReasonLabel = (reason?: SessionRecord['disconnectReason']): string => {
    switch (reason) {
        case 'user-action': return 'You ended';
        case 'partner-disconnect': return 'Partner left';
        case 'skip': return 'Skipped';
        case 'network': return 'Network issue';
        case 'error': return 'Error';
        case 'answered-another': return 'Answered another user\'s call';
        default: return 'Ended';
    }
};

const getReasonColor = (reason?: SessionRecord['disconnectReason']): string => {
    switch (reason) {
        case 'user-action': return 'text-blue-400';
        case 'partner-disconnect': return 'text-orange-400';
        case 'skip': return 'text-yellow-400';
        case 'network':
        case 'error': return 'text-red-400';
        default: return 'text-zinc-400';
    }
};

export const HistoryModal: React.FC<HistoryModalProps> = ({
    isOpen,
    onClose,
    history,
    stats,
    isLoading,
    error,
    onClearHistory,
    onRefresh,
    onCall,
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative z-10 w-full max-w-2xl bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden mx-4">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FF8ba7]/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#FF8ba7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Session History</h3>
                            {stats && (
                                <p className="text-sm text-zinc-400">
                                    {stats.totalSessions} sessions · {formatDuration(stats.totalDuration)} total
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onRefresh} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Refresh">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stats Section */}
                {stats && !isLoading && (
                    <div className="p-4 bg-zinc-900/30 border-b border-white/5">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
                                <div className="text-xs text-zinc-500 mt-1">Total Chats</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                    {Math.round(stats.averageDuration / 60) || 0}<span className="text-sm">m</span>
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">Avg Duration</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{stats.countriesConnected.length}</div>
                                <div className="text-xs text-zinc-500 mt-1">Countries</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8ba7]"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="text-red-400 mb-2">⚠️ {error}</div>
                            <button onClick={onRefresh} className="text-sm text-zinc-400 hover:text-white transition-colors">Try again</button>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-white/30 text-lg">No chat history yet</p>
                            <p className="text-white/20 text-sm mt-2">Start chatting to build your history</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((session) => (
                                <div
                                    key={session.sessionId}
                                    className="group flex flex-col gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Flag & Status */}
                                        <div className="relative flex-shrink-0">
                                            {session.partnerCountryCode && (
                                                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-white/5 shadow-inner">
                                                    <ReactCountryFlag
                                                        countryCode={session.partnerCountryCode}
                                                        svg
                                                        style={{
                                                            width: '2.5em',
                                                            height: '2.5em',
                                                            scale: '1.5',
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {/* Online indicator */}
                                            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-zinc-900 ${session.partnerStatus?.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-600'}`} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-white text-base truncate">
                                                    {session.partnerCountry || 'Unknown'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${session.mode === 'video' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {session.mode}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {formatDuration(session.duration)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{formatDate(session.connectionTime)}</span>
                                                </div>
                                                <div className="text-[11px] font-medium">
                                                    {session.partnerStatus?.isOnline ? (
                                                        <span className="text-green-400/80 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                            Active now
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-500">Last seen: {formatLastActive(session.partnerStatus?.lastSeen || 0)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status/Reason */}
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${getReasonColor(session.disconnectReason)}`}>
                                                {getReasonLabel(session.disconnectReason)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                        <button
                                            onClick={() => session.partnerId && onCall(session.partnerId)}
                                            disabled={!session.partnerStatus?.isOnline || isConnected}
                                            title={isConnected ? 'You are currently in a call' : !session.partnerStatus?.isOnline ? 'User is offline' : 'Call this user'}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border border-transparent active:scale-[0.98] ${session.partnerStatus?.isOnline && !isConnected
                                                ? 'bg-white/5 hover:bg-[#FF8ba7]/10 text-zinc-300 hover:text-[#FF8ba7] hover:border-[#FF8ba7]/20'
                                                : 'bg-zinc-800/20 text-zinc-600 cursor-not-allowed opacity-50'
                                                }`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {isConnected ? 'Already in Call' : 'Call'}
                                        </button>
                                        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-blue-500/10 text-zinc-300 hover:text-blue-400 text-xs font-bold transition-all border border-transparent hover:border-blue-500/20 active:scale-[0.98]">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                            Add Friend
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {history.length > 0 && !isLoading && (
                    <div className="p-4 border-t border-white/5 bg-zinc-900/50">
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to clear all your chat history? This cannot be undone.')) {
                                    onClearHistory();
                                }
                            }}
                            className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-medium transition-colors text-sm border border-red-500/20"
                        >
                            Clear All History
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
