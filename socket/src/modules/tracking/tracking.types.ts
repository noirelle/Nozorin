export interface TrackingSessionData {
    user_id: string;
    session_id: string;
    partner_id: string;
    mode: 'chat' | 'voice';
}
