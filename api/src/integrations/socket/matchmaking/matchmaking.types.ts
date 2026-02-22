
export interface JoinQueueDto {
    userId: string;
    mode: string;
    preferences?: { selectedCountry?: string; language?: string; minRating?: number };
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
