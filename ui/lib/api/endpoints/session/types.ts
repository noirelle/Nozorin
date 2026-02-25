export interface SessionRecord {
    sessionId: string;
    partnerId: string;
    partnerUsername?: string;
    partnerCountry?: string;
    partnerCountryCode?: string;
    createdAt: number;
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
