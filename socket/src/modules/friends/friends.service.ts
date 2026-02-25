
import { logger } from '../../core/logger';
import { userService } from '../../shared/services/user.service';

/** This module is resolved at runtime via the IoContainer singleton */
let _ioInstance: import('socket.io').Server | null = null;

export const setIo = (io: import('socket.io').Server): void => {
    _ioInstance = io;
};

export const friendsService = {
    async notifyFriendRequest(user_id: string, sender_profile: any) {
        if (!_ioInstance) return;
        const socket_id = userService.getSocketId(user_id);
        if (socket_id) {
            _ioInstance.to(socket_id).emit('friend-request-received', {
                profile: sender_profile,
                type: 'received'
            });
            logger.info({ user_id, event: 'friend-request-received' }, '[FRIEND_SERVICE] Notification sent');
        }
    },

    async notifyRequestAccepted(user_id: string, request_id: string, friend_profile: any) {
        if (!_ioInstance) return;
        const socket_id = userService.getSocketId(user_id);
        if (socket_id) {
            _ioInstance.to(socket_id).emit('friend-request-accepted', {
                request_id,
                friend: friend_profile
            });
            logger.info({ user_id, event: 'friend-request-accepted' }, '[FRIEND_SERVICE] Notification sent');
        }
    },

    async notifyRequestDeclined(user_id: string, request_id: string) {
        if (!_ioInstance) return;
        const socket_id = userService.getSocketId(user_id);
        if (socket_id) {
            _ioInstance.to(socket_id).emit('friend-request-declined', {
                request_id
            });
            logger.info({ user_id, event: 'friend-request-declined' }, '[FRIEND_SERVICE] Notification sent');
        }
    },

    async notifyFriendRemoved(user_id: string, friend_id: string) {
        if (!_ioInstance) return;
        const socket_id = userService.getSocketId(user_id);
        if (socket_id) {
            _ioInstance.to(socket_id).emit('friend-removed', {
                friend_id
            });
            logger.info({ user_id, event: 'friend-removed' }, '[FRIEND_SERVICE] Notification sent');
        }
    },

    isUserOnline(user_id: string): boolean {
        const socket_id = userService.getSocketId(user_id);
        return !!socket_id;
    }
};

export const register = (io: import('socket.io').Server, _socket: import('socket.io').Socket): void => {
    setIo(io);
};
