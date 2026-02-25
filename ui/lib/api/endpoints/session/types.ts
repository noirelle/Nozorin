export interface SessionRecord {
    sessionId: string;
    partnerId: string;
    partnerUsername?: string;
    partnerCountry?: string;
    partnerCountryCode?: string;
    partnerAvatar?: string;
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
