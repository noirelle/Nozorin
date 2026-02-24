import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { logger } from '../../core/logger';
import { userService } from '../../shared/services/user.service';
import { voiceQueue, voiceBuckets, removeUserFromQueues } from './matchmaking.store';
import { activeCalls, reconnectingUsers } from '../call/call.store';
import { userMediaState } from '../media/media.store';
import { User } from '../../shared/types/socket.types';
import { statsService } from '../../shared/services/stats.service';
import { getIo } from '../../api/emit.controller';
import { callService } from '../call/call.service';

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
    }, 10_000);
};

// ── Disconnect handler ────────────────────────────────────────────────────────

export const handleMatchmakingDisconnect = (io: Server, socketId: string): void => {
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

    socket.on(SocketEvents.MATCH_CANCELLED, () => {
        removeUserFromQueues(socket.id);
        logger.debug({ socketId: socket.id }, '[MATCHMAKING] User left queue');
    });
};
