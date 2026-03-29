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

    /** Calculate the absolute unique number of people online using memory */
    async calculateOnlineCount(): Promise<number> {
        // Unique authenticated users + unique anonymous sockets
        return userService.getActiveUserIds().length + presenceStore.getAll().filter(sid => !userService.getUserId(sid)).length;
    },

    async handleConnection(io: Server, socket: Socket): Promise<void> {
        presenceStore.add(socket.id);
        
        // Immediately track connection load
        statsService.incrementTotalConnections();

        // Broadcast updated stats immediately
        const onlineCount = await this.calculateOnlineCount();
        statsService.setOnlineUsers(onlineCount);
        io.emit(SocketEvents.STATS_UPDATE, statsService.getStats());
    },

    /** Handle user identification and broadcast initial online status */
    async handleUserConnection(io: Server, userId: string, socketId: string): Promise<void> {
        // broadcastUserStatus handles the transition for this userId
        await this.broadcastUserStatus(io, userId, true);
        
        // Update and broadcast stats
        const onlineCount = await this.calculateOnlineCount();
        statsService.setOnlineUsers(onlineCount);
        io.emit(SocketEvents.STATS_UPDATE, statsService.getStats());
    },

    async handleDisconnection(io: Server, socket: Socket): Promise<void> {
        const userId = userService.getUserId(socket.id);

        presenceStore.remove(socket.id);
        const isLastSocket = userService.removeSocket(socket.id);

        // Calculate and broadcast NEW count immediately
        const onlineCount = await this.calculateOnlineCount();
        statsService.setOnlineUsers(onlineCount);
        io.emit(SocketEvents.STATS_UPDATE, statsService.getStats());

        if (userId && isLastSocket) {
            // Last socket for this user disconnected
            logger.info({ userId }, '[PRESENCE] Last socket disconnected, marking user offline');
            await userService.deactivateUser(userId);
            await this.broadcastUserStatus(io, userId, false);
        }
    },

    /** Reconcile presenceStore against actual live Socket.IO connections */
    async reconcilePresenceStore(io: Server): Promise<void> {
        const storedIds = presenceStore.getAll();
        const liveSocketIds = new Set(io.sockets.sockets.keys());
        let orphanCount = 0;

        for (const socketId of storedIds) {
            if (!liveSocketIds.has(socketId)) {
                presenceStore.remove(socketId);
                orphanCount++;
            }
        }

        if (orphanCount > 0) {
            logger.info({ orphanCount }, '[PRESENCE] Reconciliation: removed orphaned socket IDs from presenceStore');
            const onlineCount = await this.calculateOnlineCount();
            statsService.setOnlineUsers(onlineCount);
            io.emit(SocketEvents.STATS_UPDATE, statsService.getStats());
        }
    },
};

export const register = (io: Server, socket: Socket): void => {
    // NOTE: handleConnection is called in initialization.ts — do NOT call it here to avoid double registration

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
    // Guard: only refresh if the socket is still tracked in presenceStore (prevents half-open ghost refreshes)
    socket.conn.on('heartbeat', async () => {
        if (!presenceStore.getAll().includes(socket.id)) return;
        const userId = userService.getUserId(socket.id);
        if (userId) {
            await userService.updateUserStatus(userId, true);
        }
    });
};
