import { Server, Socket } from 'socket.io';
import { userService, UserStatus } from '../modules/user/user.service';

/**
 * Handle user status-related events (watching, broadcasting)
 */
export const handleStatusEvents = (io: Server, socket: Socket) => {

    /**
     * Watch multiple users for status changes
     * In Socket.IO, we can handle this by joining rooms named after the userIds
     */
    socket.on('watch-user-status', (data: { userIds: string[] }) => {
        const { userIds } = data;
        if (!userIds || !Array.isArray(userIds)) return;

        // Join rooms for each userId to receive broadcasts
        userIds.forEach(userId => {
            if (userId && userId !== 'unknown') {
                const roomName = `status:${userId}`;
                socket.join(roomName);
            }
        });

        // console.log(`[STATUS] Socket ${socket.id} is now watching status for ${userIds.length} users`);
    });

    /**
     * Stop watching multiple users
     */
    socket.on('unwatch-user-status', (data: { userIds: string[] }) => {
        const { userIds } = data;
        if (!userIds || !Array.isArray(userIds)) return;

        userIds.forEach(userId => {
            if (userId) {
                const roomName = `status:${userId}`;
                socket.leave(roomName);
            }
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
        const roomName = `status:${userId}`;

        io.to(roomName).emit('partner-status-change', {
            userId,
            status
        });
    } catch (error) {
        console.error(`[STATUS] Error broadcasting status for user ${userId}:`, error);
    }
};

/**
 * Handle new user connection (stats, tracking)
 */
import { statsService } from '../modules/stats/stats.service';
import { addActiveUser, removeActiveUser, getActiveUserCount } from './users';

export const handleUserConnection = (io: Server, socket: Socket) => {
    // 1. Track online state
    addActiveUser(socket.id);

    // 2. Update stats
    statsService.setOnlineUsers(getActiveUserCount());
    statsService.incrementTotalConnections();

    // 3. Broadcast stats
    const stats = statsService.getStats();
    socket.emit('stats-update', stats);
    io.emit('stats-update', stats);
};

/**
 * Handle user disconnection (stats, tracking)
 */
export const handleUserDisconnection = (io: Server, socket: Socket) => {
    removeActiveUser(socket.id);
    statsService.setOnlineUsers(getActiveUserCount());
    io.emit('stats-update', statsService.getStats());
};
