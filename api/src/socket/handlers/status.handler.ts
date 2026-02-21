import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../socket.events';
import { userService } from '../../modules/user/user.service';
import { statsService } from '../../modules/stats/stats.service';
import { addActiveUser, removeActiveUser, getActiveUserCount } from '../store/socket.store';

/**
 * Handle user status-related events (watching, broadcasting)
 */
export const handleStatusEvents = (io: Server, socket: Socket) => {
    /**
     * Watch multiple users for status changes
     */
    socket.on(SocketEvents.WATCH_USER_STATUS, (data: { userIds: string[] }) => {
        const { userIds } = data;
        if (!userIds || !Array.isArray(userIds)) return;

        userIds.forEach(userId => {
            if (userId && userId !== 'unknown') {
                socket.join(`status:${userId}`);
            }
        });
    });

    /**
     * Stop watching multiple users
     */
    socket.on(SocketEvents.UNWATCH_USER_STATUS, (data: { userIds: string[] }) => {
        const { userIds } = data;
        if (!userIds || !Array.isArray(userIds)) return;

        userIds.forEach(userId => {
            if (userId) socket.leave(`status:${userId}`);
        });
    });
};

/**
 * Broadcast a user's status change to all watching clients
 */
export const broadcastUserStatus = async (io: Server, userId: string) => {
    if (!userId || userId === 'unknown') return;

    try {
        const status = await userService.getUserStatus(userId);
        io.to(`status:${userId}`).emit(SocketEvents.PARTNER_STATUS_CHANGE, { userId, status });
    } catch (error) {
        console.error(`[STATUS] Error broadcasting status for user ${userId}:`, error);
    }
};

/**
 * Handle new user connection (stats, tracking)
 */
export const handleUserConnection = (io: Server, socket: Socket) => {
    addActiveUser(socket.id);
    statsService.setOnlineUsers(getActiveUserCount());
    statsService.incrementTotalConnections();

    const stats = statsService.getStats();
    socket.emit(SocketEvents.STATS_UPDATE, stats);
    io.emit(SocketEvents.STATS_UPDATE, stats);
};

/**
 * Handle user disconnection (stats)
 */
export const handleUserDisconnection = (io: Server, socket: Socket) => {
    removeActiveUser(socket.id);
    statsService.setOnlineUsers(getActiveUserCount());
    io.emit(SocketEvents.STATS_UPDATE, statsService.getStats());
};
