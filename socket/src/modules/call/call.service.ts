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
            const startTime = info?.start_time || partnerInfo?.start_time;
            const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

            // Resolve IDs before deleting anything
            const userId = userService.getUserId(socketId);
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
                        try {
                            const roomData = JSON.parse(roomDataStr);
                            if (roomData.partner_user_id !== 'unknown') {
                                partnerUserId = roomData.partner_user_id;
                            }
                        } catch (e) {
                            logger.error({ userId }, '[CALL] Failed to parse room data for ID recovery');
                        }
                    }
                }
            }

            // Delete state immediately to prevent re-entry
            activeCalls.delete(partnerId);
            activeCalls.delete(socketId);

            // ── Cleanup ALL traces of reconnection for both users ──
            const cleanupSession = async (uid: string) => {
                reconnectingUsers.delete(uid);
                waitingForPartner.delete(uid);
                const redis = getRedisClient();
                if (redis) {
                    await redis.del(`call:reconnect:${uid}`);
                    await redis.del(`call:room:${uid}`);
                }
            };

            if (userId) await cleanupSession(userId);
            if (partnerUserId) await cleanupSession(partnerUserId);

            // Notify partner via their user room to ensure all tabs/refreshed sockets receive it
            if (partnerUserId) {
                io.to(`user:${partnerUserId}`).emit(SocketEvents.CALL_ENDED, { by: socketId, reason });
                io.to(`user:${partnerUserId}`).emit(SocketEvents.USER_LEFT, { socketId });
            } else {
                io.to(partnerId).emit(SocketEvents.CALL_ENDED, { by: socketId, reason });
                io.to(partnerId).emit(SocketEvents.USER_LEFT, { socketId });
            }

            // Record history if we have start time
            if (startTime) {
                const reason1 = reason;
                const reason2: CallDisconnectReason = reason === 'skip' ? 'partner-skip' : 'partner-disconnect';
                await callService.reportHistory(io, socketId, partnerId, duration, reason1, reason2, userId || undefined, partnerUserId || undefined);
            }

            logger.info({ socketId, partnerId, reason, userId, partnerUserId }, '[CALL] Call ended and history recorded');
            return true;
        }

        // Failsafe: even if no partner context was found, we MUST ensure this socketId
        // is removed from any waiting/active registry to prevent memory drift.
        activeCalls.delete(socketId);
        waitingForPartner.delete(socketId);
        logger.debug({ socketId, target: data?.target }, '[CALL] End call requested but no active partner found — forced local cleanup complete');
        return true;
    },

    handleDisconnect: async (io: Server, socketId: string) => {
        const info = activeCalls.get(socketId);
        const partnerId = info?.partner_id;
        const userId = userService.getUserId(socketId);

        if (partnerId && userId) {
            let partnerUserId = userService.getUserId(partnerId);

            // Reconnection Fix 1: Robust partner ID recovery
            // If the partner refreshed just before us, their socket→user mapping might be gone.
            // We check our own reconnect entry (if it exists) or Redis room data to find who we were matched with.
            if (!partnerUserId || partnerUserId === 'unknown') {
                const existingEntry = reconnectingUsers.get(userId);
                if (existingEntry && existingEntry.partner_user_id !== 'unknown') {
                    partnerUserId = existingEntry.partner_user_id;
                } else {
                    const redis = getRedisClient();
                    if (redis) {
                        const roomDataStr = await redis.get(`call:room:${userId}`);
                        if (roomDataStr) {
                            try {
                                const roomData = JSON.parse(roomDataStr);
                                if (roomData.partner_user_id !== 'unknown') {
                                    partnerUserId = roomData.partner_user_id;
                                }
                            } catch (e) {
                                logger.error({ userId }, '[CALL] Failed to recover partner ID from Redis during disconnect');
                            }
                        }
                    }
                }
            }

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
            
            if (partnerUserId) {
                io.to(`user:${partnerUserId}`).emit(SocketEvents.PARTNER_RECONNECTING, { timeout_ms: 30000 });
            } else {
                io.to(partnerId).emit(SocketEvents.PARTNER_RECONNECTING, { timeout_ms: 30000 });
            }

            logger.info({ socketId, userId, partnerId }, '[CALL] Partner disconnected, starting grace period');
        } else if (partnerId) {
            // No chance to reconnect, end it and record
            const startTime = info?.start_time;
            const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

            // Resolve IDs if possible
            const u1 = userService.getUserId(socketId);
            const u2 = userService.getUserId(partnerId);

            // Delete state immediately
            activeCalls.delete(partnerId);
            activeCalls.delete(socketId);

            io.to(partnerId).emit(SocketEvents.CALL_ENDED, { by: socketId, reason: 'partner-disconnect' });
            io.to(partnerId).emit(SocketEvents.USER_LEFT, { socketId });

            if (startTime) {
                await callService.reportHistory(io, socketId, partnerId, duration, 'user-action', 'partner-disconnect', u1 || undefined, u2 || undefined);
            }
        }
    },

    cleanupExpiredSessions: async (io: Server) => {
        // 1. Clean up stale call heartbeats
        const now = Date.now();
        for (const [sid, info] of activeCalls.entries()) {
            if (now - info.last_seen > 30000) {
                // Guard: don't terminate if the partner (or this socket's user) is in an active
                // reconnection grace period. The stale partner_id is expected when one side is
                // mid-refresh — killing the call here would destroy the reconnect window.
                const partnerUserId = userService.getUserId(info.partner_id);
                const thisUserId = userService.getUserId(sid);
                const partnerIsReconnecting = partnerUserId ? reconnectingUsers.has(partnerUserId) : false;
                const thisUserIsReconnecting = thisUserId ? reconnectingUsers.has(thisUserId) : false;

                if (partnerIsReconnecting || thisUserIsReconnecting) {
                    // Check if it's been "reconnecting" for entirely too long (e.g. > 35s since expires_at).
                    // If so, the grace period is definitely over and the reconnection entry is stale/bugged.
                    let isFailsafeExpired = false;
                    const pEntry = partnerUserId ? reconnectingUsers.get(partnerUserId) : null;
                    const tEntry = thisUserId ? reconnectingUsers.get(thisUserId) : null;

                    if (pEntry && now > pEntry.expires_at + 35000) isFailsafeExpired = true;
                    if (tEntry && now > tEntry.expires_at + 35000) isFailsafeExpired = true;

                    if (!isFailsafeExpired) {
                        logger.debug({ socketId: sid, partnerUserId, thisUserId }, '[CALL] Heartbeat stale but reconnection in progress — skipping timeout');
                        continue;
                    } else {
                        logger.warn({ socketId: sid, partnerUserId, thisUserId }, '[CALL] Heartbeat stale AND reconnection grace period heavily expired — forcibly terminating');
                    }
                }
                logger.warn({ socketId: sid, partnerId: info.partner_id }, '[CALL] Heartbeat timeout — terminating call');
                await callService.handleEndCall(io, sid, { target: info.partner_id, reason: 'partner-disconnect' });
            }
        }

        // 2. Clean up in-memory fallback map for reconnecting users
        for (const [userId, info] of reconnectingUsers.entries()) {
            if (now > info.expires_at) {
                reconnectingUsers.delete(userId);

                // Explicitly clean up Redis keys so they don't linger until TTL
                const redis = getRedisClient();
                if (redis) {
                    await redis.del(`call:reconnect:${userId}`);
                    await redis.del(`call:room:${userId}`);
                }

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

    // New method for direct calls / matchmaking to set up active call state
    setupActiveCall: (callerSocketId: string, responderSocketId: string, callerUserId: string, responderUserId: string, roomId: string) => {
        const start_time = Date.now();
        activeCalls.set(responderSocketId, { partner_id: callerSocketId, partner_user_id: callerUserId, start_time, last_seen: start_time, is_offerer: false, room_id: roomId });
        activeCalls.set(callerSocketId, { partner_id: responderSocketId, partner_user_id: responderUserId, start_time, last_seen: start_time, is_offerer: true, room_id: roomId });
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

    reportHistory: async (io: Server, socketIdOne: string, socketIdTwo: string, duration: number, reason1: CallDisconnectReason = 'skip', reason2?: CallDisconnectReason, preResolvedU1?: string, preResolvedU2?: string) => {
        const u1 = preResolvedU1 || userService.getUserId(socketIdOne);
        const u2 = preResolvedU2 || userService.getUserId(socketIdTwo);
        
        if (!u1 || !u2 || u1 === 'unknown' || u2 === 'unknown') {
            logger.warn({ socketIdOne, socketIdTwo, u1, u2 }, '[CALL] History not recorded: could not resolve both user IDs');
            return;
        }

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
            await historyService.broadcastHistoryToUser(io, uid);
        };

        if (p2) await save(u1, { ...p2, id: u2 }, reason1);
        if (p1) await save(u2, { ...p1, id: u1 }, finalReason2);
    }
};
