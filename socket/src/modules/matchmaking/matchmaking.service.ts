import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { logger } from '../../core/logger';
import { userService } from '../../shared/services/user.service';
import { voiceQueue, voiceBuckets, activeCalls, removeUserFromQueues, reconnectingUsers, RejoinInfo } from './matchmaking.store';
import { userMediaState } from '../media/media.store';
import { User } from '../../shared/types/socket.types';
import { statsService } from '../../shared/services/stats.service';
import { getIo } from '../../internal/emit.controller';

let heartbeatSetup = false;

// ── Matching logic ────────────────────────────────────────────────────────────

const tryMatch = (io: Server, queued: User): void => {
    const idx = voiceQueue.findIndex(u => u.id !== queued.id);
    if (idx === -1) return;

    const partner = voiceQueue.splice(idx, 1)[0];
    removeUserFromQueues(queued.id);

    const roomId = `match-${queued.id}-${partner.id}`;
    const mediaA = userMediaState.get(queued.id) || { isMuted: false };
    const mediaB = userMediaState.get(partner.id) || { isMuted: false };

    activeCalls.set(queued.id, partner.id);
    activeCalls.set(partner.id, queued.id);

    io.to(queued.id).emit(SocketEvents.MATCH_FOUND, {
        role: 'offerer',
        partnerId: partner.id,
        partnerUserId: partner.userId,
        partnerUsername: partner.username,
        partnerAvatar: partner.avatar,
        partnerGender: partner.gender,
        partnerCountry: partner.country,
        partnerCountryCode: partner.countryCode,
        partnerIsMuted: mediaB.isMuted,
        roomId,
        mode: queued.mode,
    });

    io.to(partner.id).emit(SocketEvents.MATCH_FOUND, {
        role: 'answerer',
        partnerId: queued.id,
        partnerUserId: queued.userId,
        partnerUsername: queued.username,
        partnerAvatar: queued.avatar,
        partnerGender: queued.gender,
        partnerCountry: queued.country,
        partnerCountryCode: queued.countryCode,
        partnerIsMuted: mediaA.isMuted,
        roomId,
        mode: partner.mode,
    });

    statsService.incrementMatchesToday();
    logger.info({ roomId, userA: queued.id, userB: partner.id }, '[MATCHMAKING] Match found');
};


// ── Join / leave queue helpers (used by internal controller too) ──────────────

export const joinQueue = async (
    io: Server | null,
    params: {
        socketId: string;
        userId?: string;
        mode: 'voice';
        country?: string;
        countryCode?: string;
        preferences?: any;
        peerId?: string;
        requestId?: string;
    }
): Promise<void> => {
    const serverIo = io || getIo();
    if (!serverIo) {
        logger.error({}, '[MATCHMAKING] Cannot join queue: io instance not available');
        return;
    }

    const {
        socketId,
        userId,
        mode,
        country,
        countryCode,
        preferences,
        peerId,
        requestId,
    } = params;

    // Reliability guard: if userId is already in queue, remove old entry (likely a stale connection)
    if (userId && userId !== 'unknown') {
        const existingIdx = voiceQueue.findIndex(u => u.userId === userId);
        if (existingIdx !== -1) {
            const staleUser = voiceQueue[existingIdx];
            if (staleUser.id !== socketId) {
                logger.info({ userId, oldSocketId: staleUser.id, newSocketId: socketId }, '[MATCHMAKING] Replacing stale queue entry for user');
                removeUserFromQueues(staleUser.id);
            } else {
                // Same socket, same user, already in queue. Just return.
                return;
            }
        }
    } else {
        // Fallback to socketId check if userId is missing
        const alreadyIdx = voiceQueue.findIndex(u => u.id === socketId);
        if (alreadyIdx !== -1) return;
    }

    // Safety guard: if user is already in a call, end it before re-queueing
    const existingPartnerId = activeCalls.get(socketId);
    if (existingPartnerId) {
        serverIo.to(existingPartnerId).emit(SocketEvents.CALL_ENDED, { by: socketId });
        activeCalls.delete(existingPartnerId);
        activeCalls.delete(socketId);

        const uId = userService.getUserId(socketId);
        if (uId) reconnectingUsers.delete(uId);
        const pId = userService.getUserId(existingPartnerId);
        if (pId) reconnectingUsers.delete(pId);

        logger.info({ socketId, partnerId: existingPartnerId }, '[MATCHMAKING] Ended orphaned call before joining queue');
    }

    // Fetch full profile if we have a userId
    let profile = null;
    if (userId && userId !== 'unknown') {
        profile = await userService.getUserProfile(userId);
    }

    const user: User = {
        id: socketId,
        userId: userId || 'unknown',
        username: profile?.username || 'Guest',
        avatar: profile?.avatar || '/avatars/avatar1.webp',
        gender: profile?.gender || 'unknown',
        country: profile?.country || country || 'Unknown',
        countryCode: profile?.countryCode || countryCode || 'UN',
        mode: mode || 'voice',
        joinedAt: Date.now(),
        state: 'FINDING',
        preferences,
        preferredCountry: preferences?.selectedCountry,
        peerId,
        requestId,
    };

    voiceQueue.push(user);
    if (user.countryCode) {
        const bucket = voiceBuckets.get(user.countryCode) || [];
        bucket.push(user);
        voiceBuckets.set(user.countryCode, bucket);
    }

    serverIo.to(user.id).emit(SocketEvents.WAITING_FOR_MATCH, { position: voiceQueue.length });
    tryMatch(serverIo, user);
};

export const leaveQueue = (socketId: string): void => {
    removeUserFromQueues(socketId);
};

// ── Heartbeat ─────────────────────────────────────────────────────────────────

export const setupMatchmaking = (io: Server): void => {
    if (heartbeatSetup) return;
    heartbeatSetup = true;

    setInterval(() => {
        const now = Date.now();
        // Queue timeout cleanup
        for (let i = voiceQueue.length - 1; i >= 0; i--) {
            const user = voiceQueue[i];
            if (now - user.joinedAt > 5 * 60 * 1000) {
                removeUserFromQueues(user.id);
                io.to(user.id).emit(SocketEvents.MATCH_CANCELLED, { reason: 'timeout' });
                logger.info({ socketId: user.id }, '[MATCHMAKING] Queue timeout — removed');
            }
        }

        // Reconnection timeout cleanup
        reconnectingUsers.forEach((info, userId) => {
            if (now > info.expiresAt) {
                reconnectingUsers.delete(userId);
                const partnerSocket = io.sockets.sockets.get(info.partnerSocketId);
                if (partnerSocket) {
                    partnerSocket.emit(SocketEvents.CALL_ENDED, { reason: 'partner-timeout' });
                    activeCalls.delete(info.partnerSocketId);
                }
                logger.info({ userId }, '[MATCHMAKING] Reconnection grace period expired');
            }
        });
    }, 10_000);
};

// ── Disconnect handler ────────────────────────────────────────────────────────

export const handleMatchmakingDisconnect = (io: Server, socketId: string): void => {
    const partnerId = activeCalls.get(socketId);
    const userId = userService.getUserId(socketId);

    if (partnerId && userId) {
        const partnerUserId = userService.getUserId(partnerId);
        // Start grace period
        reconnectingUsers.set(userId, {
            partnerSocketId: partnerId,
            partnerUserId: partnerUserId || 'unknown',
            roomId: `match-${socketId}-${partnerId}`,
            expiresAt: Date.now() + 30000 // 30s grace
        });

        io.to(partnerId).emit(SocketEvents.PARTNER_RECONNECTING, { timeoutMs: 30000 });
        logger.info({ socketId, userId, partnerId }, '[MATCHMAKING] Partner disconnected, starting grace period');
    } else if (partnerId) {
        io.to(partnerId).emit(SocketEvents.CALL_ENDED, { by: socketId });
        activeCalls.delete(partnerId);
        activeCalls.delete(socketId);
    }
    removeUserFromQueues(socketId);
};

// ── Socket event registration ─────────────────────────────────────────────────

export const register = (io: Server, socket: Socket): void => {
    setupMatchmaking(io);

    socket.on(SocketEvents.WAITING_FOR_MATCH, async (data: {
        mode: 'voice';
        country?: string;
        countryCode?: string;
        preferences?: any;
    }) => {
        const userId = userService.getUserId(socket.id);
        await joinQueue(io, {
            socketId: socket.id,
            userId: userId || 'unknown',
            mode: data.mode || 'voice',
            country: data.country,
            countryCode: data.countryCode,
            preferences: data.preferences,
        });
    });

    socket.on(SocketEvents.END_CALL, (data: { target: string | null }, callback?: (ack: any) => void) => {
        const partnerId = data?.target || activeCalls.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit(SocketEvents.CALL_ENDED, { by: socket.id });
            activeCalls.delete(partnerId);
            activeCalls.delete(socket.id);
            // Also cleanup reconnection state if any
            const userId = userService.getUserId(socket.id);
            if (userId) reconnectingUsers.delete(userId);
            const partnerUserId = userService.getUserId(partnerId);
            if (partnerUserId) reconnectingUsers.delete(partnerUserId);

            // If partner was disconnected but in grace period, notify them via their status or just cleanup
            // (When they rejoin, they'll see NO rejoin session)

            logger.info({ socketId: socket.id, partnerId }, '[MATCHMAKING] Call ended');
        }
        if (callback) callback({ success: true });
    });

    socket.on(SocketEvents.REJOIN_CALL, async (data: { roomId?: string }) => {
        const userId = userService.getUserId(socket.id);
        if (!userId) {
            socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'user-not-identified' });
            return;
        }

        const rejoinInfo = reconnectingUsers.get(userId);
        if (!rejoinInfo) {
            socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'no-rejoin-session' });
            return;
        }

        if (Date.now() > rejoinInfo.expiresAt) {
            reconnectingUsers.delete(userId);
            socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'session-expired' });
            return;
        }

        const currentPartnerSocketId = userService.getSocketId(rejoinInfo.partnerUserId) || rejoinInfo.partnerSocketId;

        // Restore active calls
        activeCalls.set(socket.id, currentPartnerSocketId);
        activeCalls.set(currentPartnerSocketId, socket.id);
        reconnectingUsers.delete(userId);

        // Fetch partner profile for success event
        const partnerProfile = await userService.getUserProfile(rejoinInfo.partnerUserId);

        socket.emit(SocketEvents.REJOIN_SUCCESS, {
            partnerId: currentPartnerSocketId,
            partnerUserId: rejoinInfo.partnerUserId,
            partnerUsername: partnerProfile?.username,
            partnerAvatar: partnerProfile?.avatar,
            partnerGender: partnerProfile?.gender,
            partnerCountry: partnerProfile?.country,
            partnerCountryCode: partnerProfile?.countryCode,
            roomId: rejoinInfo.roomId
        });

        // Notify partner that we're back with NEW socketId
        io.to(currentPartnerSocketId).emit(SocketEvents.PARTNER_RECONNECTED, {
            newSocketId: socket.id
        });

        logger.info({ socketId: socket.id, userId, partnerId: rejoinInfo.partnerSocketId }, '[MATCHMAKING] Call rejoined successfully');
    });

    socket.on(SocketEvents.CANCEL_RECONNECT, () => {
        const userId = userService.getUserId(socket.id);
        if (userId) {
            const info = reconnectingUsers.get(userId);
            if (info) {
                io.to(info.partnerSocketId).emit(SocketEvents.CALL_ENDED, { reason: 'partner-cancelled' });
                activeCalls.delete(info.partnerSocketId);
                reconnectingUsers.delete(userId);
            }
            logger.info({ socketId: socket.id, userId }, '[MATCHMAKING] Reconnection cancelled');
        }
    });

    socket.on(SocketEvents.MATCH_CANCELLED, () => {
        removeUserFromQueues(socket.id);
        logger.debug({ socketId: socket.id }, '[MATCHMAKING] User left queue');
    });
};
