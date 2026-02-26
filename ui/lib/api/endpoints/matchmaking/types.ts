export interface MatchmakingPreferences {
    language?: string;
    selected_country?: string;
    min_rating?: number;
}

export interface MatchmakingSession {
    peer_id?: string;
    connection_id?: string;
}

export interface JoinQueueRequest {
    user_id: string;
    mode: 'voice';
    preferences?: MatchmakingPreferences;
    session?: MatchmakingSession;
    request_id?: string;
}
