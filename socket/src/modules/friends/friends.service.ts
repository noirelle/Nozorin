
import { logger } from '../../core/logger';
import { userService } from '../../shared/services/user.service';

/** This module is resolved at runtime via the IoContainer singleton */
let _ioInstance: import('socket.io').Server | null = null;

export const setIo = (io: import('socket.io').Server): void => {
    _ioInstance = io;
};

export const friendsService = {
    async notifyFriendRequest(userId: string, senderProfile: any) {
        if (!_ioInstance) return;
        const socketId = userService.getSocketId(userId);
        if (socketId) {
            _ioInstance.to(socketId).emit('friend-request-received', {
                profile: senderProfile,
                type: 'received'
            });
            logger.info({ userId, event: 'friend-request-received' }, '[FRIEND_SERVICE] Notification sent');
        }
    },

    async notifyRequestAccepted(userId: string, requestId: string, friendProfile: any) {
        if (!_ioInstance) return;
        const socketId = userService.getSocketId(userId);
        if (socketId) {
            _ioInstance.to(socketId).emit('friend-request-accepted', {
                requestId,
                friend: friendProfile
            });
            logger.info({ userId, event: 'friend-request-accepted' }, '[FRIEND_SERVICE] Notification sent');
        }
    },

    async notifyRequestDeclined(userId: string, requestId: string) {
        if (!_ioInstance) return;
        const socketId = userService.getSocketId(userId);
        if (socketId) {
            _ioInstance.to(socketId).emit('friend-request-declined', {
                requestId
            });
            logger.info({ userId, event: 'friend-request-declined' }, '[FRIEND_SERVICE] Notification sent');
        }
    },

    async notifyFriendRemoved(userId: string, friendId: string) {
        if (!_ioInstance) return;
        const socketId = userService.getSocketId(userId);
        if (socketId) {
            _ioInstance.to(socketId).emit('friend-removed', {
                friendId
            });
            logger.info({ userId, event: 'friend-removed' }, '[FRIEND_SERVICE] Notification sent');
        }
    }
};

export const register = (io: import('socket.io').Server, _socket: import('socket.io').Socket): void => {
    setIo(io);
};
