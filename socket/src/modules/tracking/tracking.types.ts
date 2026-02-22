export interface TrackingSessionData {
    userId: string;
    sessionId: string;
    partnerId: string;
    mode: 'chat' | 'voice';
}
