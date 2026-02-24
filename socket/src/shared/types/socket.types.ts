export type MatchState = 'IDLE' | 'FINDING' | 'NEGOTIATING' | 'MATCHED';

export interface User {
    id: string;
    userId: string;
    username: string;
    avatar: string;
    gender: string;
    country: string;
    countryCode: string;
    mode: 'chat' | 'voice';
    preferredCountry?: string;
    preferences?: {
        language?: string;
        selectedCountry?: string;
        minRating?: number;
    };
    peerId?: string;
    requestId?: string;
    joinedAt: number;
    state: MatchState;
}

export interface Room {
    id: string;
    users: [string, string];
}

export interface MediaState {
    isMuted: boolean;
}

export interface UserConnectionInfo {
    country: string;
    countryCode: string;
}

export type CallDisconnectReason = 'partner-disconnect' | 'error' | 'skip' | 'network' | 'answered-another';
