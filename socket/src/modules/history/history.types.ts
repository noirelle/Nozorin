export interface HistorySession {
    session_id: string;
    partner_id?: string;
    country_name?: string;
    country?: string;
    partner_country_name?: string;
    partner_country?: string;
    mode: 'chat' | 'voice';
}

export interface SessionEnd {
    reason?: string;
}
