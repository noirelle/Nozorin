import { SocketHttpClient } from '../socket.http';
import { SocketResponse } from '../socket.types';

class AdminClient extends SocketHttpClient {
    /**
     * Notify the socket service to disconnect a user.
     */
    async disconnectUser(userId: string): Promise<SocketResponse> {
        return this.post('/disconnect', { userId });
    }

    /**
     * Broadcast profile changes to the user and their friends.
     */
    async updateUserProfile(userId: string, profile: any): Promise<SocketResponse> {
        return this.post('/friends/profile-update', { userId, profile });
    }

    /**
     * Notify friends that a user has been deleted.
     */
    async notifyUserDeleted(userId: string): Promise<SocketResponse> {
        return this.post('/friends/user-deleted', { userId });
    }

    /**
     * Notify a user that a friend was removed.
     */
    async notifyFriendRemoved(userId: string, friendId: string): Promise<SocketResponse> {
        return this.post('/friends/remove', { userId, friendId });
    }
}

export const adminClient = new AdminClient();
