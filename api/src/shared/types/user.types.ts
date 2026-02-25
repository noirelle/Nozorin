export interface CreateUserDto {
    gender: 'male' | 'female' | 'other';
    agreed: boolean;
    ip: string;
    deviceId: string;
    sessionId?: string;
    footprint?: any; // The raw footprint data from client (if stored separately)
    fingerprint?: string; // The specific fingerprint hash
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
    countryCode?: string;
    city?: string;
    region?: string;
    lat?: number;
    lon?: number;
    timezone?: string;
    last_ip?: string;
    device_id?: string;
    fingerprint?: string;
    last_active_at?: number;
}
