export interface RejoinInfo {
    partner_socket_id: string;
    partner_user_id: string;
    room_id: string;
    start_time: number;
    expires_at: number;
    is_offerer: boolean;
}

/** socketId → { partner_id, start_time, last_seen, is_offerer, room_id } */
export const activeCalls = new Map<string, { partner_id: string, start_time: number, last_seen: number, is_offerer: boolean, room_id: string }>();

/** userId → reconnection info */
export const reconnectingUsers = new Map<string, RejoinInfo>();

/**
 * partnerUserId → waiting socketId
 * Tracks a user who arrived for REJOIN_CALL while their partner was not yet
 * identified. When the partner identifies and emits REJOIN_CALL, the server
 * resolves the waiting side immediately instead of relying on client retries.
 */
export const waitingForPartner = new Map<string, string>();
