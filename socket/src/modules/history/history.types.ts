export interface HistorySession {
    session_id: string;
    partner_id?: string;
    country?: string;
    country_code?: string;
    partner_country?: string;
    partner_country_code?: string;
    mode: 'chat' | 'voice';
}

export interface SessionEnd {
    reason?: string;
}
