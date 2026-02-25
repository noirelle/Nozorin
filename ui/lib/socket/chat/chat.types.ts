// ── Chat ──────────────────────────────────────────────────────────────────────

export interface SendMessagePayload {
    target: string;
    message: string;
}

export interface ReceiveMessagePayload {
    sender_id: string;
    message: string;
    timestamp: string;
}
