
export interface FriendRequestNotifDto {
    userId: string;
    senderProfile: any;
}

export interface FriendAcceptNotifDto {
    userId: string;
    requestId: string;
    friendProfile: any;
}

export interface FriendDeclineNotifDto {
    userId: string;
    requestId: string;
}

export interface FriendRemoveNotifDto {
    userId: string;
    friendId: string;
}

export interface FriendStatusDto {
    friendIds: string[];
}

export interface FriendStatusResponse {
    onlineUsers: string[];
}
