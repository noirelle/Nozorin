import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { userService } from '../../shared/services/user.service';
import { statsService } from '../../shared/services/stats.service';
import { presenceStore } from './presence.store';
import { logger } from '../../core/logger';

export const presenceService = {
    /** Broadcast a user's status to all watching clients */
    async broadcastUserStatus(io: Server, userId: string, isOnlineOverride?: boolean): Promise<void> {
        if (!userId || userId === 'unknown') return;
        try {
            const status = await userService.getUserStatus(userId);
            const isOnline = isOnlineOverride !== undefined ? isOnlineOverride : !!status?.is_online;

            const broadcastStatus = {
                ...status,
                is_online: isOnline,
                last_seen: status.last_seen || Date.now()
            };

            io.to(`status:${userId}`).emit(SocketEvents.PARTNER_STATUS_CHANGE, {
                user_id: userId,
                status: broadcastStatus
            });

            // Explicit event-driven notification for specific status changes
            const eventName = isOnline ? SocketEvents.USER_ONLINE : SocketEvents.USER_OFFLINE;
            io.to(`status:${userId}`).emit(eventName, { user_id: userId, status: broadcastStatus });

            // Broadcast to admin room for real-time sorting and status display
            const profile = isOnline ? await userService.getUserProfile(userId) : null;

            io.to('admin:users').emit(SocketEvents.ADMIN_USER_ACTIVE, {
                user_id: userId,
                last_active_at: broadcastStatus.last_seen,
                is_online: isOnline,
                profile: profile // Include profile for real-time appending
            });
        } catch (err) {
            logger.error({ err, userId }, '[PRESENCE] Failed to broadcast status');
        }
    },

    /** Calculate the absolute unique number of people online */
    calculateOnlineCount(): number {
        const identifiedUserIds = userService.getActiveUserIds(); // Unique user IDs
        const allSocketIds = presenceStore.getAll();
        
        // Count anonymous sockets (those not mapped to a userId)
        let anonymousCount = 0;
        for (const sid of allSocketIds) {
            if (!userService.getUserId(sid)) {
                anonymousCount++;
            }
        }
        
        const count = identifiedUserIds.length + anonymousCount;
        logger.debug({ identified: identifiedUserIds.length, anonymous: anonymousCount, total: count }, '[PRESENCE] Calculated online count');
        return count;
    },

    handleConnection(io: Server, socket: Socket): void {
        presenceStore.add(socket.id);
        
        const onlineCount = this.calculateOnlineCount();
        statsService.setOnlineUsers(onlineCount);
        statsService.incrementTotalConnections();
        
        const stats = statsService.getStats();
        socket.emit(SocketEvents.STATS_UPDATE, stats);
        io.emit(SocketEvents.STATS_UPDATE, stats);
    },

    /** Handle user identification and broadcast initial online status */
    async handleUserConnection(io: Server, userId: string): Promise<void> {
        await this.broadcastUserStatus(io, userId, true);
        
        // Update and broadcast stats because an anonymous socket just became an identified user
        const onlineCount = this.calculateOnlineCount();
        statsService.setOnlineUsers(onlineCount);
        io.emit(SocketEvents.STATS_UPDATE, statsService.getStats());
    },

    async handleDisconnection(io: Server, socket: Socket): Promise<void> {
        const userId = userService.getUserId(socket.id);

        presenceStore.remove(socket.id);
        const isLastSocket = userService.removeSocket(socket.id);

        const onlineCount = this.calculateOnlineCount();
        statsService.setOnlineUsers(onlineCount);
        io.emit(SocketEvents.STATS_UPDATE, statsService.getStats());

        if (userId && isLastSocket) {
            // Last socket for this user disconnected
            logger.info({ userId }, '[PRESENCE] Last socket disconnected, marking user offline');
            await userService.deactivateUser(userId);
            await this.broadcastUserStatus(io, userId, false);
        }
    },
};

export const register = (io: Server, socket: Socket): void => {
    presenceService.handleConnection(io, socket);

    socket.on(SocketEvents.WATCH_USER_STATUS, async (data: { user_ids: string[] }) => {
        const { user_ids } = data;
        if (!user_ids || !Array.isArray(user_ids)) return;
        
        user_ids.forEach(uid => {
            if (uid && uid !== 'unknown') socket.join(`status:${uid}`);
        });

        // Proactively send current statuses so the UI doesn't have to wait for a change
        const validIds = user_ids.filter(id => id && id !== 'unknown');
        if (validIds.length > 0) {
            const statuses = await userService.getUserStatuses(validIds);
            Object.entries(statuses).forEach(([uid, status]) => {
                socket.emit(SocketEvents.PARTNER_STATUS_CHANGE, {
                    user_id: uid,
                    status
                });
            });
        }
    });

    socket.on(SocketEvents.UNWATCH_USER_STATUS, (data: { user_ids: string[] }) => {
        const { user_ids } = data;
        if (!user_ids || !Array.isArray(user_ids)) return;
        user_ids.forEach(uid => { if (uid) socket.leave(`status:${uid}`); });
    });

    socket.on(SocketEvents.JOIN_ADMIN_ROOM, () => {
        const userData = (socket as any).data?.user;
        if (userData?.user_type === 'admin') {
            socket.join('admin:users');
            logger.info({ socketId: socket.id }, '[PRESENCE] Admin joined admin:users room');
        } else {
            logger.warn({ socketId: socket.id }, '[PRESENCE] Unauthorized JOIN_ADMIN_ROOM attempt');
        }
    });

    // Reactive Heartbeat: listen to engine.io heartbeats to refresh presence
    socket.conn.on('heartbeat', async () => {
        const userId = userService.getUserId(socket.id);
        if (userId) {
            await userService.updateUserStatus(userId, true);
        }
    });
};
