// ── Stats ─────────────────────────────────────────────────────────────────────

export interface StatsUpdatePayload {
    peopleOnline: number;
    matchesToday: number;
    totalConnections: number;
}

// ── Matchmaking ───────────────────────────────────────────────────────────────

export interface WaitingForMatchPayload {
    position: number;
}

export interface PrepareMatchPayload {
    roomId?: string;
    [key: string]: unknown;
}

export interface MatchFoundPayload {
    role: 'offerer' | 'answerer';
    partnerId: string;
    partnerUserId: string;
    partnerUsername: string;
    partnerAvatar: string;
    partnerGender: string;
    partnerCountry: string;
    partnerCountryCode: string;
    partnerIsMuted?: boolean;
    roomId?: string;
}

export interface MatchCancelledPayload {
    reason: string;
}

export interface EndCallPayload {
    target: string | null;
}

export interface RejoinCallPayload {
    roomId?: string;
}

export interface RejoinSuccessPayload {
    partnerId: string;
    partnerCountry?: string;
    partnerCountryCode?: string;
    [key: string]: unknown;
}

export interface RejoinFailedPayload {
    reason: string;
}

export interface PartnerReconnectingPayload {
    timeoutMs: number;
}

export interface PartnerReconnectedPayload {
    newSocketId: string;
}

// ── WebRTC Signaling ──────────────────────────────────────────────────────────

export interface OfferPayload {
    target: string;
    sdp: RTCSessionDescriptionInit;
}

export interface OfferReceivedPayload {
    sdp: RTCSessionDescriptionInit;
    callerId: string;
}

export interface AnswerPayload {
    target: string;
    sdp: RTCSessionDescriptionInit;
}

export interface AnswerReceivedPayload {
    sdp: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
    target: string;
    candidate: RTCIceCandidateInit;
}

export interface IceCandidateReceivedPayload {
    candidate: RTCIceCandidateInit;
}

export interface SignalStrengthPayload {
    target: string;
    strength: 'good' | 'fair' | 'poor' | 'reconnecting';
}

export interface PartnerSignalStrengthPayload {
    strength: 'good' | 'fair' | 'poor' | 'reconnecting';
}
