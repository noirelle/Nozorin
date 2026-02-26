// ── Stats ─────────────────────────────────────────────────────────────────────

export interface StatsUpdatePayload {
    people_online: number;
    matches_today: number;
    total_connections: number;
}

// ── Matchmaking ───────────────────────────────────────────────────────────────

export interface WaitingForMatchPayload {
    position: number;
}

export interface PrepareMatchPayload {
    room_id?: string;
    [key: string]: unknown;
}

export interface MatchFoundPayload {
    role: 'offerer' | 'answerer';
    partner_id: string;
    partner_user_id: string;
    partner_username: string;
    partner_avatar: string;
    partner_gender: string;
    partner_country_name: string;
    partner_country: string;
    partner_is_muted?: boolean;
    room_id?: string;
    friendship_status?: 'none' | 'friends' | 'pending_sent' | 'pending_received';
}

export interface MatchCancelledPayload {
    reason: string;
}

export interface EndCallPayload {
    target: string | null;
}

export interface RejoinCallPayload {
    room_id?: string;
}

export interface RejoinSuccessPayload {
    partner_id: string;
    partner_user_id: string;
    partner_username?: string;
    partner_avatar?: string;
    partner_gender?: string;
    partner_country_name?: string;
    partner_country?: string;
    [key: string]: unknown;
}

export interface RejoinFailedPayload {
    reason: string;
}

export interface PartnerReconnectingPayload {
    timeout_ms: number;
}

export interface PartnerReconnectedPayload {
    new_socket_id: string;
}

// ── WebRTC Signaling ──────────────────────────────────────────────────────────

export interface OfferPayload {
    target: string;
    sdp: RTCSessionDescriptionInit;
}

export interface OfferReceivedPayload {
    sdp: RTCSessionDescriptionInit;
    caller_id: string;
}

export interface AnswerPayload {
    target: string;
    sdp: RTCSessionDescriptionInit;
}

export interface AnswerReceivedPayload {
    sdp: RTCSessionDescriptionInit;
    caller_id: string;
}

export interface IceCandidatePayload {
    target: string;
    candidate: RTCIceCandidateInit;
}

export interface IceCandidateReceivedPayload {
    candidate: RTCIceCandidateInit;
    sender_id: string;
}

export interface SignalStrengthPayload {
    target: string;
    strength: 'good' | 'fair' | 'poor' | 'reconnecting';
}

export interface PartnerSignalStrengthPayload {
    partner_id: string;
    strength: 'good' | 'fair' | 'poor' | 'reconnecting';
}
