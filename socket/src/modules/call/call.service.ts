import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { logger } from '../../core/logger';
import { userService } from '../../shared/services/user.service';
import { activeCalls, reconnectingUsers } from './call.store';

export const callService = {
    handleEndCall: (io: Server, socketId: string, data: { target: string | null }) => {
        const partnerId = data?.target || activeCalls.get(socketId);
        if (partnerId) {
            io.to(partnerId).emit(SocketEvents.CALL_ENDED, { by: socketId });
            activeCalls.delete(partnerId);
            activeCalls.delete(socketId);

            const userId = userService.getUserId(socketId);
            if (userId) reconnectingUsers.delete(userId);
            const partnerUserId = userService.getUserId(partnerId);
            if (partnerUserId) reconnectingUsers.delete(partnerUserId);

            logger.info({ socketId, partnerId }, '[CALL] Call ended');
            return true;
        }
        return false;
    },

    handleDisconnect: (io: Server, socketId: string) => {
        const partnerId = activeCalls.get(socketId);
        const userId = userService.getUserId(socketId);

        if (partnerId && userId) {
            const partnerUserId = userService.getUserId(partnerId);
            reconnectingUsers.set(userId, {
                partnerSocketId: partnerId,
                partnerUserId: partnerUserId || 'unknown',
                roomId: `match-${socketId}-${partnerId}`,
                expiresAt: Date.now() + 30000
            });

            io.to(partnerId).emit(SocketEvents.PARTNER_RECONNECTING, { timeoutMs: 30000 });
            logger.info({ socketId, userId, partnerId }, '[CALL] Partner disconnected, starting grace period');
        } else if (partnerId) {
            io.to(partnerId).emit(SocketEvents.CALL_ENDED, { by: socketId });
            activeCalls.delete(partnerId);
            activeCalls.delete(socketId);
        }
    },

    cleanupExpiredSessions: (io: Server) => {
        const now = Date.now();
        reconnectingUsers.forEach((info, userId) => {
            if (now > info.expiresAt) {
                reconnectingUsers.delete(userId);
                const partnerSocket = io.sockets.sockets.get(info.partnerSocketId);
                if (partnerSocket) {
                    partnerSocket.emit(SocketEvents.CALL_ENDED, { reason: 'partner-timeout' });
                    activeCalls.delete(info.partnerSocketId);
                }
                logger.info({ userId }, '[CALL] Reconnection grace period expired');
            }
        });
    }
};
