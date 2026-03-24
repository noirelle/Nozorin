
import { logger } from '../../core/logger';
import { userService } from '../../shared/services/user.service';
import { AppDataSource } from '../../core/config/database.config';
import { Friend } from '../../modules/friends/friend.entity';
import { activeCalls } from '../call/call.store';

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

    async notifyProfileUpdated(userId: string, updatedProfile: any) {
        if (!_ioInstance) return;

        // 1. Notify the user themselves (to update their own UI)
        _ioInstance.to(`user:${userId}`).emit('profile-updated', {
            profile: updatedProfile
        });

        // 2. Notify all online friends
        try {
            const friends = await AppDataSource.getRepository(Friend).find({
                where: [
                    { user_id: userId },
                    { friend_id: userId }
                ]
            });

            const friendIds = friends.map(f => f.user_id === userId ? f.friend_id : f.user_id);

            for (const friendId of friendIds) {
                const friendSocketId = userService.getSocketId(friendId);
                if (friendSocketId) {
                    _ioInstance.to(friendSocketId).emit('friend-profile-updated', {
                        userId,
                        profile: updatedProfile
                    });
                }
            }
            logger.info({ userId }, '[FRIEND_SERVICE] Profile update broadcast to friends');

            // 3. Notify call partner (if in a call and potentially not friends)
            const sockets = userService.getAllSockets(userId);
            for (const sid of sockets) {
                const callInfo = activeCalls.get(sid);
                if (callInfo?.partner_user_id) {
                    _ioInstance.to(`user:${callInfo.partner_user_id}`).emit('partner-profile-updated', {
                        profile: updatedProfile
                    });
                    logger.info({ userId, partnerUserId: callInfo.partner_user_id }, '[FRIEND_SERVICE] Profile update broadcast to call partner');
                }
            }
        } catch (error) {
            logger.error({ error, userId }, '[FRIEND_SERVICE] Error broadcasting profile update');
        }
    },

    async notifyUserDeleted(userId: string) {
        if (!_ioInstance) return;

        try {
            // Notify all friends that this user is gone
            const friends = await AppDataSource.getRepository(Friend).find({
                where: [
                    { user_id: userId },
                    { friend_id: userId }
                ]
            });

            const friendIds = friends.map(f => f.user_id === userId ? f.friend_id : f.user_id);

            for (const friendId of friendIds) {
                const friendSocketId = userService.getSocketId(friendId);
                if (friendSocketId) {
                    _ioInstance.to(friendSocketId).emit('friend-removed', {
                        friend_id: userId
                    });
                }
            }
            logger.info({ userId }, '[FRIEND_SERVICE] User deletion notified to friends');

            // Notify call partner that the call is ending due to user deletion
            const sockets = userService.getAllSockets(userId);
            for (const sid of sockets) {
                const callInfo = activeCalls.get(sid);
                if (callInfo?.partner_user_id) {
                    _ioInstance.to(`user:${callInfo.partner_user_id}`).emit('call-ended', {
                        reason: 'partner-disconnect'
                    });
                    logger.info({ userId, partnerUserId: callInfo.partner_user_id }, '[FRIEND_SERVICE] Call partner notified of user deletion');
                }
            }
        } catch (error) {
            logger.error({ error, userId }, '[FRIEND_SERVICE] Error notifying friends of user deletion');
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
