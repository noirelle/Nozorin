import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { logger } from '../../core/logger';
import { userService } from '../../shared/services/user.service';
import { activeCalls, reconnectingUsers } from './call.store';
import { historyService } from '../history/history.service';
import { CallDisconnectReason } from '../../shared/types/socket.types';
import { getRedisClient } from '../../core/config/redis.config';

export const callService = {
    handleEndCall: async (io: Server, socketId: string, data: { target: string | null; reason?: CallDisconnectReason }) => {
        const info = activeCalls.get(socketId);
        const partnerId = data?.target || info?.partner_id;
        const reason: CallDisconnectReason = data?.reason || 'skip';

        if (partnerId) {
            const partnerInfo = activeCalls.get(partnerId);

            // Capture data for history before deleting state
            const startTime = info?.start_time;
            const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

            // Delete state immediately to prevent re-entry
            activeCalls.delete(partnerId);
            activeCalls.delete(socketId);

            const userId = userService.getUserId(socketId);
            if (userId) {
                reconnectingUsers.delete(userId);
                const redis = getRedisClient();
                if (redis) await redis.del(`call:reconnect:${userId}`);
            }
            const partnerUserId = userService.getUserId(partnerId);
            if (partnerUserId) {
                reconnectingUsers.delete(partnerUserId);
                const redis = getRedisClient();
                if (redis) await redis.del(`call:reconnect:${partnerUserId}`);
            }

            // Notify partner
            io.to(partnerId).emit(SocketEvents.CALL_ENDED, { by: socketId, reason });

            // Record history if we have start time
            if (startTime) {
                const reason1 = reason;
                const reason2: CallDisconnectReason = reason === 'skip' ? 'partner-skip' : 'partner-disconnect';
                await callService.reportHistory(socketId, partnerId, duration, reason1, reason2);
            }

            logger.info({ socketId, partnerId, reason }, '[CALL] Call ended');
            return true;
        }

        logger.debug({ socketId, target: data?.target }, '[CALL] End call requested but no active partner found');
        return true;
    },

    handleDisconnect: async (io: Server, socketId: string) => {
        const info = activeCalls.get(socketId);
        const partnerId = info?.partner_id;
        const userId = userService.getUserId(socketId);

        if (partnerId && userId) {
            const partnerUserId = userService.getUserId(partnerId);
            const rejoinInfo = {
                partner_socket_id: partnerId,
                partner_user_id: partnerUserId || 'unknown',
                room_id: `match-${socketId}-${partnerId}`,
                start_time: info.start_time,
                expires_at: Date.now() + 30000
            };

            reconnectingUsers.set(userId, rejoinInfo);

            const redis = getRedisClient();
            if (redis) {
                await redis.set(`call:reconnect:${userId}`, JSON.stringify(rejoinInfo), 'EX', 30);
            }

            io.to(partnerId).emit(SocketEvents.PARTNER_RECONNECTING, { timeout_ms: 30000 });
            logger.info({ socketId, userId, partnerId }, '[CALL] Partner disconnected, starting grace period');
        } else if (partnerId) {
            // No chance to reconnect, end it and record
            const startTime = info?.start_time;
            const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

            // Delete state immediately
            activeCalls.delete(partnerId);
            activeCalls.delete(socketId);

            io.to(partnerId).emit(SocketEvents.CALL_ENDED, { by: socketId, reason: 'partner-disconnect' });

            if (startTime) {
                await callService.reportHistory(socketId, partnerId, duration, 'user-action', 'partner-disconnect');
            }
        }
    },

    cleanupExpiredSessions: async (io: Server) => {
        // Now handled by Redis TTL for persistence, 
        // but we still clean up the in-memory fallback map
        const now = Date.now();
        for (const [userId, info] of reconnectingUsers.entries()) {
            if (now > info.expires_at) {
                reconnectingUsers.delete(userId);
                // ... rest of logic for identifying partner to notify end ...
                // This logic is mostly for UI feedback if someone doesn't come back
            }
        }
    },

    getActiveCall: async (userId: string) => {
        const redis = getRedisClient();
        if (!redis) return reconnectingUsers.get(userId);

        const data = await redis.get(`call:reconnect:${userId}`);
        if (data) return JSON.parse(data);

        return reconnectingUsers.get(userId);
    },

    reportHistory: async (userId1: string, userId2: string, duration: number, reason1: CallDisconnectReason = 'skip', reason2?: CallDisconnectReason) => {
        const u1 = userService.getUserId(userId1);
        const u2 = userService.getUserId(userId2);
        if (!u1 || !u2) return;

        const p1 = await userService.getUserProfile(u1);
        const p2 = await userService.getUserProfile(u2);

        // If reason2 is not provided, we might want to derive it or use reason1 for both
        const finalReason2 = reason2 || (reason1 === 'skip' ? 'partner-skip' : reason1);

        const save = async (uid: string, partner: any, r: CallDisconnectReason) => {
            await historyService.addHistory({
                user_id: uid,
                partner_id: partner.id,
                partner_username: partner.username,
                partner_avatar: partner.avatar,
                partner_country_name: partner.country_name,
                partner_country: partner.country,
                duration,
                mode: 'voice',
                reason: r
            });
        };

        if (u1 && u1 !== 'unknown' && p2) await save(u1, { ...p2, id: u2 }, reason1);
        if (u2 && u2 !== 'unknown' && p1) await save(u2, { ...p1, id: u1 }, finalReason2);
    }
};
