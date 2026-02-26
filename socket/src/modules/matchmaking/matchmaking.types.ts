export interface JoinQueuePayload {
    socket_id: string;
    user_id: string;
    mode: 'voice';
    preferences?: Record<string, unknown>;
    country_name?: string;
    country?: string;
}
