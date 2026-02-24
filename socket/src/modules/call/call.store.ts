export interface RejoinInfo {
    partnerSocketId: string;
    partnerUserId: string;
    roomId: string;
    expiresAt: number;
}

/** socketId → partner socketId */
export const activeCalls = new Map<string, string>();

/** userId → reconnection info */
export const reconnectingUsers = new Map<string, RejoinInfo>();
