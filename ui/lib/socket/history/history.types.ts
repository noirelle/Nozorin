// ── History ───────────────────────────────────────────────────────────────────

export interface GetHistoryPayload {
    token: string;
    limit?: number;
}

export interface GetHistoryStatsPayload {
    token: string;
}

export interface ClearHistoryPayload {
    token: string;
}

export interface HistoryDataPayload {
    history: SessionRecord[];
}

export interface SessionRecord {
    sessionId: string;
    partnerId: string;
    partnerUsername?: string;
    partnerCountry?: string;
    partnerCountryCode?: string;
    createdAt: number;
    disconnectionTime?: number;
    duration?: number;
    disconnectReason?: 'user-action' | 'partner-disconnect' | 'partner-skip' | 'error' | 'skip' | 'network' | 'answered-another' | 'timeout';
    mode: 'chat' | 'voice';
    partnerStatus?: {
        isOnline: boolean;
        lastSeen: number;
    };
}

export interface HistoryStats {
    totalSessions: number;
    totalDuration: number;
    averageDuration: number;
    countriesConnected: string[];
}

export interface HistoryErrorPayload {
    message: string;
}

// ── Presence / Session ────────────────────────────────────────────────────────

export interface MatchEstablishedPayload {
    token: string;
    partnerId: string;
    mode: 'chat' | 'voice';
}

export interface SessionEndPayload {
    token: string;
    reason?: 'user-action' | 'partner-disconnect' | 'partner-skip' | 'error' | 'skip' | 'network' | 'answered-another' | 'timeout';
}

export interface WatchUserStatusPayload {
    userIds: string[];
}

export interface PartnerStatusChangePayload {
    userId: string;
    status: {
        isOnline: boolean;
        lastSeen: number;
    };
}
