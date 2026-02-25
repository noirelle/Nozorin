export interface ActiveSession {
    user_id: string;
    session_id: string;
    partner_id: string;
    mode: 'chat' | 'voice';
}

/** socketId → active session */
export const activeSessions = new Map<string, ActiveSession>();
