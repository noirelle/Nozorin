
import { SocketHttpClient } from '../socket.http';
import {
    FriendRequestNotifDto,
    FriendAcceptNotifDto,
    FriendDeclineNotifDto,
    FriendRemoveNotifDto,
    FriendStatusDto,
    FriendStatusResponse
} from './friends.types';
import { SocketResponse } from '../socket.types';

class FriendsClient extends SocketHttpClient {
    async notifyRequest(dto: FriendRequestNotifDto): Promise<SocketResponse<void>> {
        return this.post<void>('/friends/request', dto);
    }

    async notifyAccept(dto: FriendAcceptNotifDto): Promise<SocketResponse<void>> {
        return this.post<void>('/friends/accept', dto);
    }

    async notifyDecline(dto: FriendDeclineNotifDto): Promise<SocketResponse<void>> {
        return this.post<void>('/friends/decline', dto);
    }

    async notifyRemove(dto: FriendRemoveNotifDto): Promise<SocketResponse<void>> {
        return this.post<void>('/friends/remove', dto);
    }

    // granular status check for friend list
    async getFriendStatus(dto: FriendStatusDto): Promise<SocketResponse<FriendStatusResponse>> {
        return this.post<FriendStatusResponse>('/friends/status', dto);
    }
}

export const friendsClient = new FriendsClient();
