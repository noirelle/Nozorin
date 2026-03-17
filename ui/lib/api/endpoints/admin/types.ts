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

export interface CallHistoryItem {
    id: string;
    partner_username: string;
    partner_avatar: string;
    partner_country_name: string;
    partner_country: string;
    duration: number;
    mode: 'voice' | 'chat';
    created_at: string;
}

export interface FriendItem {
    id: string;
    friend_id: string;
    friend_username: string;
    friend_avatar: string;
    friend_country: string;
    friend_country_code: string;
    created_at: number;
}

export interface UserDetails extends UserListItem {
    created_at: number;
    history: CallHistoryItem[];
    friends: FriendItem[];
}
