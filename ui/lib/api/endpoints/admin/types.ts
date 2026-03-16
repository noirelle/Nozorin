export interface AdminLoginResponse {
    token: string;
    expiresIn: string;
}

export interface AdminStats {
    totalUsers: number;
    totalFemales: number;
    totalMales: number;
    totalClaimed: number;
}

export interface UserListItem {
    id: string;
    username: string;
    avatar: string;
    gender: 'male' | 'female' | 'other';
    is_claimed: boolean;
    country?: string;
    country_name?: string;
    last_active_at: number;
    is_online: boolean;
    friendCount: number;
    historyCount: number;
}

export interface UsersListResponse {
    users: UserListItem[];
    total: number;
    page: number;
    limit: number;
}
