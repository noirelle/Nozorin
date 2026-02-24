export interface RejoinInfo {
    partnerSocketId: string;
    partnerUserId: string;
    roomId: string;
    startTime: number;
    expiresAt: number;
}

/** socketId → { partnerId, startTime } */
export const activeCalls = new Map<string, { partnerId: string, startTime: number }>();

/** userId → reconnection info */
export const reconnectingUsers = new Map<string, RejoinInfo>();
