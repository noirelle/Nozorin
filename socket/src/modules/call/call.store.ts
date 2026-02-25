export interface RejoinInfo {
    partner_socket_id: string;
    partner_user_id: string;
    room_id: string;
    start_time: number;
    expires_at: number;
}

/** socketId → { partner_id, start_time } */
export const activeCalls = new Map<string, { partner_id: string, start_time: number }>();

/** userId → reconnection info */
export const reconnectingUsers = new Map<string, RejoinInfo>();
