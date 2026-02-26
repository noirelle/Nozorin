/** Cross-module event payload interfaces */

export interface SendMessagePayload {
    target: string;
    message: string;
}

export interface ReceiveMessagePayload {
    sender_id: string;
    message: string;
    timestamp: string;
}

export interface OfferPayload { target: string; sdp: unknown; }
export interface AnswerPayload { target: string; sdp: unknown; }
export interface IceCandidatePayload { target: string; candidate: unknown; }
export interface SignalStrengthPayload { target: string; strength: 'good' | 'fair' | 'poor' | 'reconnecting'; }

export interface ToggleMutePayload { target: string; is_muted: boolean; }
export interface UpdateMediaStatePayload { is_muted?: boolean; }

export interface GetHistoryPayload { token: string; limit?: number; }
export interface GetHistoryStatsPayload { token: string; }
export interface ClearHistoryPayload { token: string; }

export interface UserIdentifyPayload { token: string; }
export interface UpdateTokenPayload { token: string; }
export interface ForceReconnectPayload { token: string; }

export interface MatchEstablishedPayload {
    token: string;
    partner_id: string;
    mode: 'chat' | 'voice';
}

export interface SessionEndPayload {
    token: string;
    reason?: 'user-action' | 'partner-disconnect' | 'error' | 'skip' | 'network' | 'answered-another';
}

export interface WatchUserStatusPayload { user_ids: string[]; }
export interface UnwatchUserStatusPayload { user_ids: string[]; }

export interface InitiateDirectCallPayload { target_user_id: string; mode: 'voice'; }
export interface RespondToCallPayload { caller_socket_id: string; accepted: boolean; mode: 'voice'; }
export interface CancelCallPayload { target_user_id: string; }

export interface MatchFoundPayload {
    role: 'offerer' | 'answerer';
    partner_id: string;
    partner_username: string;
    partner_avatar: string;
    partner_gender: string;
    partner_country_name?: string;
    partner_country?: string;
    partner_is_muted: boolean;
    room_id: string;
    mode: 'voice';
}
