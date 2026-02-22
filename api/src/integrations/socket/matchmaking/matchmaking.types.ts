
export interface JoinQueueDto {
    userId: string;
    mode: string;
    preferences?: any;
    peerId?: string;
    requestId?: string;
}

export interface LeaveQueueDto {
    userId: string;
}

export interface JoinQueueResponse {
    success: boolean;
    error?: string;
    [key: string]: any;
}
