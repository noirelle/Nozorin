// ── Chat ──────────────────────────────────────────────────────────────────────

export interface SendMessagePayload {
    target: string;
    message: string;
}

export interface ReceiveMessagePayload {
    senderId: string;
    message: string;
    timestamp: string;
}
