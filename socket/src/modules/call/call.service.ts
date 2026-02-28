import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { logger } from '../../core/logger';
import { userService } from '../../shared/services/user.service';
import { activeCalls, reconnectingUsers, waitingForPartner } from './call.store';
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
                if (redis) {
                    await redis.del(`call:reconnect:${userId}`);
                    await redis.del(`call:room:${userId}`);
                }
            }
            let partnerUserId = userService.getUserId(partnerId);
            // Fallback: if partner's socket mapping is gone (disconnected), resolve via reconnecting entry
            if (!partnerUserId && userId) {
                const reconnectEntry = reconnectingUsers.get(userId);
                if (reconnectEntry && reconnectEntry.partner_user_id !== 'unknown') {
                    partnerUserId = reconnectEntry.partner_user_id;
                }
            }
            // Fallback 2: resolve via persistent room data
            if (!partnerUserId && userId) {
                const redis = getRedisClient();
                if (redis) {
                    const roomDataStr = await redis.get(`call:room:${userId}`);
                    if (roomDataStr) {
                        const roomData = JSON.parse(roomDataStr);
                        if (roomData.partner_user_id !== 'unknown') {
                            partnerUserId = roomData.partner_user_id;
                        }
                    }
                }
            }

            if (partnerUserId) {
                reconnectingUsers.delete(partnerUserId);
                const redis = getRedisClient();
                if (redis) {
                    await redis.del(`call:reconnect:${partnerUserId}`);
                    await redis.del(`call:room:${partnerUserId}`);
                }
            }

            // Notify partner at their CURRENT socket (if they refreshed/reconnected)
            const currentPartnerSocketId = partnerUserId ? userService.getSocketId(partnerUserId) : null;
            const targetSocketId = currentPartnerSocketId || partnerId;
            io.to(targetSocketId).emit(SocketEvents.CALL_ENDED, { by: socketId, reason });
            io.to(targetSocketId).emit(SocketEvents.USER_LEFT, { socketId });

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
            const expiresAt = Date.now() + 30000;
            // Use the stable room_id generated at match time
            const stableRoomId = info.room_id || `match-${socketId}-${partnerId}`;

            const rejoinInfo = {
                partner_socket_id: partnerId,
                partner_user_id: partnerUserId || 'unknown',
                room_id: stableRoomId,
                start_time: info.start_time,
                expires_at: expiresAt,
                is_offerer: info.is_offerer
            };

            // ── Synchronous: set ALL in-memory entries before any await ──
            // This prevents race conditions where a yield during Redis writes
            // allows the partner's handler to interleave and miss/overwrite entries.

            // Own entry: preserve existing valid one if our new data is worse
            const existingEntry = reconnectingUsers.get(userId);
            if (existingEntry && existingEntry.partner_user_id !== 'unknown' && rejoinInfo.partner_user_id === 'unknown') {
                existingEntry.expires_at = expiresAt;
                reconnectingUsers.set(userId, existingEntry);
            } else {
                reconnectingUsers.set(userId, rejoinInfo);
            }

            // Mirror entry: create or overwrite a broken one
            if (partnerUserId && partnerUserId !== 'unknown') {
                const existingPartnerEntry = reconnectingUsers.get(partnerUserId);
                if (!existingPartnerEntry || existingPartnerEntry.partner_user_id === 'unknown') {
                    const partnerRejoinInfo = {
                        partner_socket_id: socketId,
                        partner_user_id: userId,
                        room_id: stableRoomId,
                        start_time: info.start_time,
                        expires_at: expiresAt,
                        is_offerer: !info.is_offerer
                    };
                    reconnectingUsers.set(partnerUserId, partnerRejoinInfo);
                }
            }

            // ── Async: persist to Redis (non-blocking for in-memory correctness) ──
            const redis = getRedisClient();
            if (redis) {
                const finalEntry = reconnectingUsers.get(userId);
                await redis.set(`call:reconnect:${userId}`, JSON.stringify(finalEntry), 'EX', 30);

                if (partnerUserId && partnerUserId !== 'unknown') {
                    const partnerEntry = reconnectingUsers.get(partnerUserId);
                    if (partnerEntry) {
                        await redis.set(`call:reconnect:${partnerUserId}`, JSON.stringify(partnerEntry), 'EX', 30);
                    }
                }
            }

            // Remove the disconnecting user's activeCall entry to prevent heartbeat cleanup
            // from firing handleEndCall and destroying the reconnection data.
            // Keep the partner's entry so they can still send pings during the grace period.
            activeCalls.delete(socketId);

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
            io.to(partnerId).emit(SocketEvents.USER_LEFT, { socketId });

            if (startTime) {
                await callService.reportHistory(socketId, partnerId, duration, 'user-action', 'partner-disconnect');
            }
        }
    },

    cleanupExpiredSessions: async (io: Server) => {
        // 1. Clean up stale call heartbeats
        const now = Date.now();
        for (const [sid, info] of activeCalls.entries()) {
            if (now - info.last_seen > 15000) {
                // Guard: don't terminate if the partner (or this socket's user) is in an active
                // reconnection grace period. The stale partner_id is expected when one side is
                // mid-refresh — killing the call here would destroy the reconnect window.
                const partnerUserId = userService.getUserId(info.partner_id);
                const thisUserId = userService.getUserId(sid);
                const partnerIsReconnecting = partnerUserId ? reconnectingUsers.has(partnerUserId) : false;
                const thisUserIsReconnecting = thisUserId ? reconnectingUsers.has(thisUserId) : false;
                if (partnerIsReconnecting || thisUserIsReconnecting) {
                    logger.debug({ socketId: sid, partnerUserId, thisUserId }, '[CALL] Heartbeat stale but reconnection in progress — skipping timeout');
                    continue;
                }
                logger.warn({ socketId: sid, partnerId: info.partner_id }, '[CALL] Heartbeat timeout — terminating call');
                await callService.handleEndCall(io, sid, { target: info.partner_id, reason: 'partner-disconnect' });
            }
        }

        // 2. Clean up in-memory fallback map for reconnecting users
        for (const [userId, info] of reconnectingUsers.entries()) {
            if (now > info.expires_at) {
                reconnectingUsers.delete(userId);
                // If this user was waiting for their partner, notify them
                const waitingSocketId = waitingForPartner.get(userId);
                if (waitingSocketId) {
                    waitingForPartner.delete(userId);
                    io.to(waitingSocketId).emit(SocketEvents.REJOIN_FAILED, { reason: 'session-expired' });
                    io.to(waitingSocketId).emit(SocketEvents.CALL_ENDED, { reason: 'session-expired' });
                    logger.info({ userId, waitingSocketId }, '[CALL] Expired waiting session — notified waiting user');
                }
            }
        }

        // 3. Prune any orphaned waitingForPartner entries (partner already cleaned up)
        for (const [partnerUserId, waitingSocketId] of waitingForPartner.entries()) {
            if (!reconnectingUsers.has(partnerUserId)) {
                waitingForPartner.delete(partnerUserId);
            }
        }
    },

    handlePing: (socketId: string) => {
        const info = activeCalls.get(socketId);
        if (info) {
            info.last_seen = Date.now();
            activeCalls.set(socketId, info);
            return true;
        }
        return false;
    },

    getActiveCall: async (userId: string) => {
        // Tier 1: in-memory reconnecting map (fastest)
        const inMemory = reconnectingUsers.get(userId);
        if (inMemory) return inMemory;

        const redis = getRedisClient();
        if (!redis) return null;

        // Tier 2: disconnect-time reconnect entry in Redis
        const reconnectData = await redis.get(`call:reconnect:${userId}`);
        if (reconnectData) return JSON.parse(reconnectData);

        // Tier 3: match-time room data in Redis (survives fast refresh)
        const roomData = await redis.get(`call:room:${userId}`);
        if (roomData) {
            logger.info({ userId }, '[CALL] Restored rejoin info from match-time room data (fast refresh fallback)');
            return JSON.parse(roomData);
        }

        return null;
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
