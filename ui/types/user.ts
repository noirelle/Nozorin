
export interface UserProfile {
    id: string;
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
