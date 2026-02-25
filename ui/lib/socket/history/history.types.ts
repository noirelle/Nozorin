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
    session_id: string;
    partner_id: string;
    partner_username?: string;
    partner_country?: string;
    partner_country_code?: string;
    created_at: number;
    disconnection_time?: number;
    duration?: number;
    disconnect_reason?: 'user-action' | 'partner-disconnect' | 'partner-skip' | 'error' | 'skip' | 'network' | 'answered-another' | 'timeout';
    mode: 'chat' | 'voice';
    partner_status?: {
        is_online: boolean;
        last_seen: number;
    };
}

export interface HistoryStats {
    total_sessions: number;
    total_duration: number;
    average_duration: number;
    countries_connected: string[];
}

export interface HistoryErrorPayload {
    message: string;
}

// ── Presence / Session ────────────────────────────────────────────────────────

export interface MatchEstablishedPayload {
    token: string;
    partner_id: string;
    mode: 'chat' | 'voice';
}

export interface SessionEndPayload {
    token: string;
    reason?: 'user-action' | 'partner-disconnect' | 'partner-skip' | 'error' | 'skip' | 'network' | 'answered-another' | 'timeout';
}

export interface WatchUserStatusPayload {
    user_ids: string[];
}

export interface PartnerStatusChangePayload {
    user_id: string;
    status: {
        is_online: boolean;
        last_seen: number;
    };
}
