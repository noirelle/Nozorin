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

const tryMatch = async (io: Server, queued: User): Promise<void> => {
    const idx = voiceQueue.findIndex(u => u.id !== queued.id);
    if (idx === -1) return;

    const partner = voiceQueue.splice(idx, 1)[0];
    removeUserFromQueues(queued.id);

    // Fetch friendship status if both have user_id
    let friendshipStatus = 'none';
    if (queued.user_id !== 'unknown' && partner.user_id !== 'unknown') {
        friendshipStatus = await userService.getFriendshipStatus(queued.user_id, partner.user_id);
    }

    const room_id = `match-${queued.id}-${partner.id}`;
    const mediaA = userMediaState.get(queued.id) || { is_muted: false };
    const mediaB = userMediaState.get(partner.id) || { is_muted: false };

    const startTime = Date.now();
    activeCalls.set(queued.id, { partner_id: partner.id, start_time: startTime });
    activeCalls.set(partner.id, { partner_id: queued.id, start_time: startTime });

    io.to(queued.id).emit(SocketEvents.MATCH_FOUND, {
        role: 'offerer',
        partner_id: partner.id,
        partner_user_id: partner.user_id,
        partner_username: partner.username,
        partner_avatar: partner.avatar,
        partner_gender: partner.gender,
        partner_country_name: partner.country_name,
        partner_country: partner.country,
        partner_is_muted: mediaB.is_muted,
        room_id,
        mode: queued.mode,
        friendship_status: friendshipStatus,
    });

    // Reverse status for the partner
    let reverseStatus = friendshipStatus;
    if (friendshipStatus === 'pending_sent') reverseStatus = 'pending_received';
    else if (friendshipStatus === 'pending_received') reverseStatus = 'pending_sent';

    io.to(partner.id).emit(SocketEvents.MATCH_FOUND, {
        role: 'answerer',
        partner_id: queued.id,
        partner_user_id: queued.user_id,
        partner_username: queued.username,
        partner_avatar: queued.avatar,
        partner_gender: queued.gender,
        partner_country_name: queued.country_name,
        partner_country: queued.country,
        partner_is_muted: mediaA.is_muted,
        room_id,
        mode: partner.mode,
        friendship_status: reverseStatus,
    });

    statsService.incrementMatchesToday();
    logger.info({ room_id, userA: queued.id, userB: partner.id, friendship_status: friendshipStatus }, '[MATCHMAKING] Match found');
};


// ── Join / leave queue helpers (used by internal controller too) ──────────────

export const joinQueue = async (
    io: Server | null,
    params: {
        socketId: string;
        user_id?: string;
        mode: 'voice';
        country_name?: string;
        country?: string;
        preferences?: any;
        peer_id?: string;
        request_id?: string;
    }
): Promise<void> => {
    const serverIo = io || getIo();
    if (!serverIo) {
        logger.error({}, '[MATCHMAKING] Cannot join queue: io instance not available');
        return;
    }

    const {
        socketId,
        user_id: userId,
        mode,
        country_name,
        country,
        preferences,
        peer_id: peerId,
        request_id: requestId,
    } = params;

    // Reliability guard: if user_id is already in queue, remove old entry (likely a stale connection)
    if (userId && userId !== 'unknown') {
        const existingIdx = voiceQueue.findIndex(u => u.user_id === userId);
        if (existingIdx !== -1) {
            const staleUser = voiceQueue[existingIdx];
            if (staleUser.id !== socketId) {
                logger.info({ user_id: userId, old_socket_id: staleUser.id, new_socket_id: socketId }, '[MATCHMAKING] Replacing stale queue entry for user');
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

    // Safety guard: if user is already in a call or in reconnection period, end it before re-queueing
    const existingInfo = activeCalls.get(socketId);
    if (existingInfo) {
        await callService.handleEndCall(serverIo, socketId, { target: existingInfo.partner_id, reason: 'skip' });
        logger.info({ socketId, partner_id: existingInfo.partner_id }, '[MATCHMAKING] Ended active call (skipped) before joining queue');
    }

    // Also check if user has a pending reconnection session (e.g. they refreshed and then skipped)
    if (userId && userId !== 'unknown') {
        const reconnectInfo = reconnectingUsers.get(userId);
        if (reconnectInfo) {
            // End the call for the partner who is waiting
            await callService.handleEndCall(serverIo, socketId, { target: reconnectInfo.partner_socket_id, reason: 'skip' });
            reconnectingUsers.delete(userId);
            logger.info({ userId, partner_id: reconnectInfo.partner_socket_id }, '[MATCHMAKING] Ended pending reconnection session before joining queue');
        }
    }

    // Fetch full profile if we have a userId
    let profile = null;
    if (userId && userId !== 'unknown') {
        profile = await userService.getUserProfile(userId);
    }

    const user: User = {
        id: socketId,
        user_id: userId || 'unknown',
        username: profile?.username || 'Guest',
        avatar: profile?.avatar || '/avatars/avatar1.webp',
        gender: profile?.gender || 'unknown',
        country_name: profile?.country_name || country_name || 'Unknown',
        country: profile?.country || country || 'UN',
        mode: mode || 'voice',
        joined_at: Date.now(),
        state: 'FINDING',
        preferences,
        preferred_country: preferences?.selected_country,
        peer_id: peerId,
        request_id: requestId,
    };

    voiceQueue.push(user);
    if (user.country) {
        const bucket = voiceBuckets.get(user.country) || [];
        bucket.push(user);
        voiceBuckets.set(user.country, bucket);
    }

    serverIo.to(user.id).emit(SocketEvents.WAITING_FOR_MATCH, { position: voiceQueue.length });
    await tryMatch(serverIo, user);
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
            if (now - user.joined_at > 5 * 60 * 1000) {
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
        country_name?: string;
        country?: string;
        preferences?: any;
    }) => {
        const userId = userService.getUserId(socket.id);
        await joinQueue(io, {
            socketId: socket.id,
            user_id: userId || 'unknown',
            mode: data.mode || 'voice',
            country_name: data.country_name,
            country: data.country,
            preferences: data.preferences,
        });
    });

    socket.on(SocketEvents.MATCH_CANCELLED, () => {
        removeUserFromQueues(socket.id);
        logger.debug({ socketId: socket.id }, '[MATCHMAKING] User left queue');
    });
};
