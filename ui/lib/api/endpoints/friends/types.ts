export interface FriendUser {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    isOnline: boolean;
}

export interface FriendRequest {
    id: string;
    fromUser: FriendUser;
    toUser: FriendUser;
    createdAt: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}
