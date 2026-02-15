export interface CreateUserDto {
    gender: string;
    agreed: boolean;
    ip: string;
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
}
