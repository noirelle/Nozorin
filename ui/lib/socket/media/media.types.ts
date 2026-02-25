// ── Media State ───────────────────────────────────────────────────────────────

export interface UpdateMediaStatePayload {
    is_muted: boolean;
}

export interface ToggleMutePayload {
    target: string;
    is_muted: boolean;
}

export interface PartnerMuteStatePayload {
    is_muted: boolean;
}

export interface PartnerSignalStrengthPayload {
    strength: 'good' | 'fair' | 'poor' | 'reconnecting';
}
