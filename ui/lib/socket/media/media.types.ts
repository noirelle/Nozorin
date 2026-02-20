// ── Media State ───────────────────────────────────────────────────────────────

export interface UpdateMediaStatePayload {
    isMuted: boolean;
}

export interface ToggleMutePayload {
    target: string;
    isMuted: boolean;
}

export interface PartnerMuteStatePayload {
    isMuted: boolean;
}

export interface PartnerSignalStrengthPayload {
    strength: 'good' | 'fair' | 'poor' | 'reconnecting';
}
