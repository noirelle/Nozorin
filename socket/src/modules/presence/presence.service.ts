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
            
            io.to(`status:${userId}`).emit(SocketEvents.PARTNER_STATUS_CHANGE, { 
                user_id: userId, 
                status: { ...status, is_online: isOnline } 
            });
            
            // Broadcast to admin room for real-time sorting and status display
            // We include the full profile so the admin panel can append "new" users in real-time
            const profile = isOnline ? await userService.getUserProfile(userId) : null;

            io.to('admin:users').emit(SocketEvents.ADMIN_USER_ACTIVE, { 
                user_id: userId, 
                last_active_at: Date.now(),
                is_online: isOnline,
                profile: profile // Include profile for real-time appending
            });
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

    /** Handle user identification and broadcast initial online status */
    async handleUserConnection(io: Server, userId: string): Promise<void> {
        await this.broadcastUserStatus(io, userId, true);
    },

    async handleDisconnection(io: Server, socket: Socket): Promise<void> {
        const userId = userService.getUserId(socket.id);

        presenceStore.remove(socket.id);
        const isLastSocket = userService.removeSocket(socket.id);

        statsService.setOnlineUsers(presenceStore.count());
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

    socket.on(SocketEvents.WATCH_USER_STATUS, (data: { user_ids: string[] }) => {
        const { user_ids } = data;
        if (!user_ids || !Array.isArray(user_ids)) return;
        user_ids.forEach(uid => {
            if (uid && uid !== 'unknown') socket.join(`status:${uid}`);
        });
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
