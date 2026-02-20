// ── Direct Call ───────────────────────────────────────────────────────────────

export interface InitiateDirectCallPayload {
    targetUserId: string;
    mode: 'voice';
}

export interface IncomingCallPayload {
    fromUserId: string;
    fromSocketId: string;
    fromUsername: string;
    fromAvatar: string;
    fromGender: string;
    fromCountry: string;
    fromCountryCode: string;
    mode: 'voice';
}

export interface RespondToCallPayload {
    callerSocketId: string;
    accepted: boolean;
    mode: 'voice';
}

export interface CallErrorPayload {
    message: string;
}

export interface CancelCallPayload {
    targetUserId: string;
}
