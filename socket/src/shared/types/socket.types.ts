export type MatchState = 'IDLE' | 'FINDING' | 'NEGOTIATING' | 'MATCHED';

export interface User {
    id: string;
    user_id: string;
    username: string;
    avatar: string;
    gender: string;
    country: string;
    country_code: string;
    mode: 'chat' | 'voice';
    preferred_country?: string;
    preferences?: {
        language?: string;
        selected_country?: string;
        min_rating?: number;
    };
    peer_id?: string;
    request_id?: string;
    joined_at: number;
    state: MatchState;
}

export interface Room {
    id: string;
    users: [string, string];
}

export interface MediaState {
    is_muted: boolean;
}

export interface UserConnectionInfo {
    country: string;
    country_code: string;
}

export type CallDisconnectReason = 'user-action' | 'partner-disconnect' | 'partner-skip' | 'error' | 'skip' | 'network' | 'answered-another' | 'timeout';
