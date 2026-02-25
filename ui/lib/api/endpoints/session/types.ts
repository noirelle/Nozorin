export interface SessionRecord {
    session_id: string;
    partner_id: string;
    partner_username?: string;
    partner_country?: string;
    partner_country_code?: string;
    partner_avatar?: string;
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
