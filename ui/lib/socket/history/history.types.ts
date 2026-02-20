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
    country: string;
    countryCode: string;
    partnerCountry?: string;
    partnerCountryCode?: string;
    connectionTime: number;
    disconnectionTime?: number;
    duration?: number;
    disconnectReason?: 'user-action' | 'partner-disconnect' | 'error' | 'skip' | 'network' | 'answered-another';
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
    reason?: 'user-action' | 'partner-disconnect' | 'error' | 'skip' | 'network' | 'answered-another';
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
