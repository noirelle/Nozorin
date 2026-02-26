export interface CallRequest {
    target_user_id: string;
    mode: 'voice' | 'video';
}

export interface CallResponse {
    target_user_id: string;
    accepted: boolean;
    mode: 'voice' | 'video';
}

export interface CallActionResult {
    success: boolean;
    message?: string;
    accepted?: boolean;
}
