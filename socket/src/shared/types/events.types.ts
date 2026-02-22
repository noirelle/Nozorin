/** Cross-module event payload interfaces */

export interface SendMessagePayload {
    target: string;
    message: string;
}

export interface ReceiveMessagePayload {
    senderId: string;
    message: string;
    timestamp: string;
}

export interface OfferPayload { target: string; sdp: unknown; }
export interface AnswerPayload { target: string; sdp: unknown; }
export interface IceCandidatePayload { target: string; candidate: unknown; }
export interface SignalStrengthPayload { target: string; strength: 'good' | 'fair' | 'poor' | 'reconnecting'; }

export interface ToggleMutePayload { target: string; isMuted: boolean; }
export interface UpdateMediaStatePayload { isMuted?: boolean; }

export interface GetHistoryPayload { token: string; limit?: number; }
export interface GetHistoryStatsPayload { token: string; }
export interface ClearHistoryPayload { token: string; }

export interface UserIdentifyPayload { token: string; }
export interface UpdateTokenPayload { token: string; }
export interface ForceReconnectPayload { token: string; }

export interface MatchEstablishedPayload {
    token: string;
    partnerId: string;
    mode: 'chat' | 'voice';
}

export interface SessionEndPayload {
    token: string;
    reason?: 'user-action' | 'partner-disconnect' | 'error' | 'skip' | 'network' | 'answered-another';
}

export interface WatchUserStatusPayload { userIds: string[]; }
export interface UnwatchUserStatusPayload { userIds: string[]; }

export interface InitiateDirectCallPayload { targetUserId: string; mode: 'voice'; }
export interface RespondToCallPayload { callerSocketId: string; accepted: boolean; mode: 'voice'; }
export interface CancelCallPayload { targetUserId: string; }

export interface MatchFoundPayload {
    role: 'offerer' | 'answerer';
    partnerId: string;
    partnerUsername: string;
    partnerAvatar: string;
    partnerGender: string;
    partnerCountry?: string;
    partnerCountryCode?: string;
    partnerIsMuted: boolean;
    roomId: string;
    mode: 'voice';
}
