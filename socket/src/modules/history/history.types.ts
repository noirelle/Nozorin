export interface HistorySession {
    sessionId: string;
    partnerId?: string;
    country?: string;
    countryCode?: string;
    partnerCountry?: string;
    partnerCountryCode?: string;
    mode: 'chat' | 'voice';
}

export interface SessionEnd {
    reason?: string;
}
