export interface CreateUserDto {
    gender: string;
    agreed: boolean;
    ip: string;
    deviceId?: string;
    sessionId?: string;
    footprint?: any;
}

export interface UserProfile {
    id: string; // UUID
    username: string;
    avatar: string;
    gender: string;
    profile_completed: boolean;
    is_claimed: boolean;
    created_at: number;
    country?: string;
    city?: string;
    region?: string;
    lat?: number;
    lon?: number;
    timezone?: string;
    last_ip?: string;
    device_id?: string;
    last_active_at?: number;
}
