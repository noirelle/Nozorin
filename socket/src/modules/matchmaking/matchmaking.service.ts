import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { logger } from '../../core/logger';
import { userService } from '../../shared/services/user.service';
import { voiceQueue, voiceBuckets, activeCalls, removeUserFromQueues } from './matchmaking.store';
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

    const alreadyIdx = voiceQueue.findIndex(u => u.id === socketId);
    if (alreadyIdx !== -1) return;

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
        country: country || 'Unknown',
        countryCode: countryCode || 'UN',
        mode: mode || 'voice',
        joinedAt: Date.now(),
        state: 'FINDING',
        preferences,
        preferredCountry: preferences?.region,
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
        for (let i = voiceQueue.length - 1; i >= 0; i--) {
            const user = voiceQueue[i];
            if (now - user.joinedAt > 5 * 60 * 1000) {
                removeUserFromQueues(user.id);
                io.to(user.id).emit(SocketEvents.MATCH_CANCELLED, { reason: 'timeout' });
                logger.info({ socketId: user.id }, '[MATCHMAKING] Queue timeout — removed');
            }
        }
    }, 30_000);
};

// ── Disconnect handler ────────────────────────────────────────────────────────

export const handleMatchmakingDisconnect = (io: Server, socketId: string): void => {
    const partnerId = activeCalls.get(socketId);
    if (partnerId) {
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

    socket.on(SocketEvents.END_CALL, () => {
        const partnerId = activeCalls.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit(SocketEvents.CALL_ENDED, { by: socket.id });
            activeCalls.delete(partnerId);
            activeCalls.delete(socket.id);
            logger.info({ socketId: socket.id, partnerId }, '[MATCHMAKING] Call ended');
        }
    });

    socket.on(SocketEvents.MATCH_CANCELLED, () => {
        removeUserFromQueues(socket.id);
        logger.debug({ socketId: socket.id }, '[MATCHMAKING] User left queue');
    });
};
