export interface ActiveSession {
    userId: string;
    sessionId: string;
    partnerId: string;
    mode: 'chat' | 'voice';
}

/** socketId → active session */
export const activeSessions = new Map<string, ActiveSession>();
