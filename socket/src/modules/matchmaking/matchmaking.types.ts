export interface JoinQueuePayload {
    socketId: string;
    userId: string;
    mode: 'voice';
    preferences?: Record<string, unknown>;
    country?: string;
    countryCode?: string;
}
