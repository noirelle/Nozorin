// ── Friends ───────────────────────────────────────────────────────────────────

export interface FriendRequestReceivedPayload {
    id: string;
    [key: string]: unknown;
}

export interface FriendRequestAcceptedPayload {
    request_id: string;
    friend: {
        id: string;
        [key: string]: unknown;
    };
}
