// ── Friends ───────────────────────────────────────────────────────────────────

export interface FriendRequestReceivedPayload {
    id: string;
    [key: string]: unknown;
}

export interface FriendRequestAcceptedPayload {
    requestId: string;
    friend: {
        id: string;
        [key: string]: unknown;
    };
}
