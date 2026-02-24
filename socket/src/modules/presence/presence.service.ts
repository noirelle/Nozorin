import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { userService } from '../../shared/services/user.service';
import { statsService } from '../../shared/services/stats.service';
import { presenceStore } from './presence.store';
import { logger } from '../../core/logger';

export const presenceService = {
    /** Broadcast a user's status to all watching clients */
    async broadcastUserStatus(io: Server, userId: string): Promise<void> {
        if (!userId || userId === 'unknown') return;
        try {
            const status = await userService.getUserStatus(userId);
            io.to(`status:${userId}`).emit(SocketEvents.PARTNER_STATUS_CHANGE, { userId, status });
        } catch (err) {
            logger.error({ err, userId }, '[PRESENCE] Failed to broadcast status');
        }
    },

    handleConnection(io: Server, socket: Socket): void {
        presenceStore.add(socket.id);
        statsService.setOnlineUsers(presenceStore.count());
        statsService.incrementTotalConnections();
        const stats = statsService.getStats();
        socket.emit(SocketEvents.STATS_UPDATE, stats);
        io.emit(SocketEvents.STATS_UPDATE, stats);
    },

    handleDisconnection(io: Server, socket: Socket): void {
        presenceStore.remove(socket.id);
        statsService.setOnlineUsers(presenceStore.count());
        io.emit(SocketEvents.STATS_UPDATE, statsService.getStats());
    },
};

export const register = (io: Server, socket: Socket): void => {
    socket.on(SocketEvents.WATCH_USER_STATUS, (data: { userIds: string[] }) => {
        const { userIds } = data;
        if (!userIds || !Array.isArray(userIds)) return;
        userIds.forEach(uid => {
            if (uid && uid !== 'unknown') socket.join(`status:${uid}`);
        });
    });

    socket.on(SocketEvents.UNWATCH_USER_STATUS, (data: { userIds: string[] }) => {
        const { userIds } = data;
        if (!userIds || !Array.isArray(userIds)) return;
        userIds.forEach(uid => { if (uid) socket.leave(`status:${uid}`); });
    });
};
