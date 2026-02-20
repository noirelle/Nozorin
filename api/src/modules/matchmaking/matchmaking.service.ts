
import { Socket, Server } from 'socket.io';
import { User } from '../../shared/types/socket.types';
import {
    voiceQueue,
    getConnectedUser,
    activeCalls,
    userMediaState
} from '../../socket/users';
import { statsService } from '../stats/stats.service';
import { userService } from '../user/user.service';

import { CONSTANTS } from './matchmaking.constants';
import { QueueManager, notifyQueuePositions, skipLocks, setFallbackTimeout, userPendingMatch } from './matchmaking.queue';
import { setMatchCooldown } from './matchmaking.cooldowns';
import { handleMatchmakingDisconnect, pendingReconnects, cancelPendingReconnect, cleanupPendingReconnectsForPartner } from './matchmaking.reconnect';
import { handleMatchFailure, pendingMatches } from './matchmaking.rooms';
import { scanQueueForMatches } from './matchmaking.matcher';

// --- INITIALIZATION ---

let heartbeatTimeout: NodeJS.Timeout | null = null;

const runHeartbeat = (io: Server) => {
    // Dynamic Interval based on load
    const totalUsers = voiceQueue.length;
    const interval = totalUsers > CONSTANTS.QUEUE_THRESHOLD_FAST_HEARTBEAT
        ? CONSTANTS.HEARTBEAT_FAST_MS
        : CONSTANTS.HEARTBEAT_SLOW_MS;

    if (totalUsers >= 2) {
        scanQueueForMatches(io);
    }

    heartbeatTimeout = setTimeout(() => runHeartbeat(io), interval);
};

export const setupMatchmaking = (io: Server) => {
    if (heartbeatTimeout) return;
    console.log('[MATCH] Matchmaker heartbeat started (Voice Only).');
    runHeartbeat(io);
};

// --- HANDLERS ---

// Re-export disconnect handler to be used by socket connection
export { handleMatchmakingDisconnect } from './matchmaking.reconnect';


export const matchmakingService = {
    async joinQueue(io: Server, socketId: string, data: {
        mode: 'voice',
        preferredCountry?: string,
        preferences?: any,
        peerId?: string,
        requestId?: string
    }) {
        // SKIP LOCK: Prevent spamming
        if (skipLocks.has(socketId)) return;
        skipLocks.add(socketId);

        try {
            const userId = userService.getUserId(socketId);
            if (!userId) {
                throw new Error('User not identified');
            }

            // Check if user is already taking part in the queue
            if (voiceQueue.some(u => u.userId === userId)) {
                throw new Error('ALREADY_IN_QUEUE');
            }

            // 1. BACKEND-LEVEL SKIP
            const activePartner = activeCalls.get(socketId);
            if (activePartner) {
                // Apply fresh cooldown on skip
                const partnerUserId = userService.getUserId(activePartner);
                if (userId && partnerUserId) {
                    setMatchCooldown(userId, partnerUserId);
                }

                io.to(activePartner).emit('call-ended', { by: socketId });
                activeCalls.delete(activePartner);
                activeCalls.delete(socketId);
            }

            // Clean up any pending reconnect where this user is the waiting partner
            cleanupPendingReconnectsForPartner(io, socketId, scanQueueForMatches);

            const pendingRoomId = userPendingMatch.get(socketId);
            if (pendingRoomId) {
                handleMatchFailure(io, pendingRoomId, 'partner-left', scanQueueForMatches);
            }

            // 2. AUTHORITATIVE CLEANUP
            const { clearFallbackTimeout } = require('./matchmaking.queue');
            clearFallbackTimeout(socketId);


            const resetSeniority = true;
            const joinTime = resetSeniority ? Date.now() : (voiceQueue.find(u => u.userId === userId)?.joinedAt || Date.now());

            const userInfo = getConnectedUser(socketId);
            if (!userInfo) return;

            const userProfile = await userService.getUserProfile(userId);

            const currentUser: User = {
                id: socketId,
                userId,
                username: userProfile?.username || 'Guest',
                avatar: userProfile?.avatar || '/avatars/avatar1.webp',
                gender: userProfile?.gender || 'unknown',
                country: userInfo.country,
                countryCode: userInfo.countryCode,
                mode: 'voice',
                preferredCountry: data.preferredCountry === 'GLOBAL' ? undefined : data.preferredCountry,
                preferences: data.preferences,
                peerId: data.peerId,
                requestId: data.requestId,
                joinedAt: joinTime,
                state: 'FINDING'
            };

            QueueManager.add(currentUser, resetSeniority);
            scanQueueForMatches(io);
            notifyQueuePositions(io);

            // 4. FALLBACK TIMER
            if (currentUser.preferredCountry) {
                const timeout = setTimeout(() => {
                    clearFallbackTimeout(socketId);
                    const u = voiceQueue.find(user => user.id === socketId);
                    if (u && u.state === 'FINDING' && u.preferredCountry) {
                        u.preferredCountry = undefined;
                        scanQueueForMatches(io);
                    }
                }, CONSTANTS.FALLBACK_TIMER_MS);
                setFallbackTimeout(socketId, timeout);
            }

            // Get updated position
            const position = voiceQueue.findIndex(u => u.id === socketId) + 1;

            return {
                queuePosition: position,
                estimatedWait: position * 15, // Approx 15s per person in queue
                timestamp: Date.now()
            };
        } finally {
            skipLocks.delete(socketId);
        }
    },

    async leaveQueue(io: Server, socketId: string) {
        QueueManager.remove(socketId);
        const { clearFallbackTimeout } = require('./matchmaking.queue');
        clearFallbackTimeout(socketId);

        const partnerId = activeCalls.get(socketId);
        if (partnerId) {
            // Apply fresh cooldown on stop
            const userId = userService.getUserId(socketId);
            const partnerUserId = userService.getUserId(partnerId);
            if (userId && partnerUserId) {
                setMatchCooldown(userId, partnerUserId);
            }

            io.to(partnerId).emit('call-ended', { by: socketId });
            activeCalls.delete(partnerId);
        }
        activeCalls.delete(socketId);

        // Clean up any pending reconnect where this user is the waiting partner
        cleanupPendingReconnectsForPartner(io, socketId, scanQueueForMatches);

        notifyQueuePositions(io);
    }
};

export const handleMatchmaking = (io: Server, socket: Socket) => {
    // Legacy socket listeners removed or deprecated, now handled via REST
    // We keep 'match-ready' and other signaling events here as they are part of the active connection flow

    // socket.on('find-match', ...) -> Moved to REST

    socket.on('match-ready', () => {
        const roomId = userPendingMatch.get(socket.id);
        const pending = pendingMatches.get(roomId || '');
        if (!pending) return;

        pending.acks.add(socket.id);
        if (pending.acks.size === 2) {
            const [uA, uB] = pending.pair;
            if (uA.state !== 'NEGOTIATING' || uB.state !== 'NEGOTIATING') {
                handleMatchFailure(io, pending.roomId, 'handshake-interrupted', scanQueueForMatches);
                return;
            }

            clearTimeout(pending.timeout);
            pendingMatches.delete(pending.roomId);

            uA.state = 'MATCHED';
            uB.state = 'MATCHED';
            activeCalls.set(uA.id, uB.id);
            activeCalls.set(uB.id, uA.id);

            const socketA = io.sockets.sockets.get(uA.id);
            const socketB = io.sockets.sockets.get(uB.id);
            if (socketA && socketB) {
                socketA.join(pending.roomId);
                socketB.join(pending.roomId);

                const emitMatch = (to: string, partner: User, role: string) => {
                    const media = userMediaState.get(partner.id) || { isMuted: false };

                    // Cleanup timeouts when matched
                    const { clearFallbackTimeout } = require('./matchmaking.queue');
                    clearFallbackTimeout(to);

                    io.to(to).emit('match-found', {
                        role,
                        partnerId: partner.id,
                        partnerUsername: partner.username,
                        partnerAvatar: partner.avatar,
                        partnerGender: partner.gender,
                        partnerCountry: partner.country,
                        partnerCountryCode: partner.countryCode,
                        partnerIsMuted: media.isMuted,
                        roomId: pending.roomId,
                        mode: pending.mode
                    });
                };
                emitMatch(uB.id, uA, 'offerer');
                emitMatch(uA.id, uB, 'answerer');

                // TRACK STATS
                statsService.incrementMatchesToday();
                io.emit('stats-update', statsService.getStats());
            }
        }
    });

    // socket.on('stop-searching', ...) -> Moved to REST

    socket.on('end-call', () => {
        const partnerId = activeCalls.get(socket.id);
        if (partnerId) {
            // Apply fresh cooldown on end
            const userId = userService.getUserId(socket.id);
            const partnerUserId = userService.getUserId(partnerId);
            if (userId && partnerUserId) {
                setMatchCooldown(userId, partnerUserId);
            }

            io.to(partnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(partnerId);
        }
        activeCalls.delete(socket.id);
        QueueManager.remove(socket.id);

        // Clean up any pending reconnect where this user is the waiting partner
        cleanupPendingReconnectsForPartner(io, socket.id, scanQueueForMatches);
    });

    // --- RECONNECT HANDLERS ---

    socket.on('rejoin-call', (data: { roomId?: string }) => {
        const userId = userService.getUserId(socket.id);
        if (!userId) {
            socket.emit('rejoin-failed', { reason: 'not-identified' });
            return;
        }

        const pending = pendingReconnects.get(userId);
        if (!pending) {
            socket.emit('rejoin-failed', { reason: 'no-pending-reconnect' });
            return;
        }

        // Verify partner is still connected
        const partnerSocket = io.sockets.sockets.get(pending.partnerSocketId);
        if (!partnerSocket) {
            // Partner disconnected while we were reconnecting
            clearTimeout(pending.timeout);
            pendingReconnects.delete(userId);
            socket.emit('rejoin-failed', { reason: 'partner-disconnected' });
            return;
        }

        // SUCCESS: Cancel timeout and restore the call
        clearTimeout(pending.timeout);
        pendingReconnects.delete(userId);

        // Restore activeCalls with the new socket ID
        activeCalls.set(socket.id, pending.partnerSocketId);
        activeCalls.set(pending.partnerSocketId, socket.id);

        // Get partner profile info for the rejoining user
        const partnerInfo = getConnectedUser(pending.partnerSocketId);
        const partnerProfile = {
            partnerId: pending.partnerSocketId,
            partnerUserId: pending.partnerUserId,
            partnerCountry: partnerInfo?.country || 'Unknown',
            partnerCountryCode: partnerInfo?.countryCode || 'XX',
        };

        console.log(`[MATCH] User ${userId.substring(0, 8)}... rejoined call with partner ${pending.partnerUserId.substring(0, 8)}...`);

        // Notify both sides
        socket.emit('rejoin-success', partnerProfile);
        io.to(pending.partnerSocketId).emit('partner-reconnected', { newSocketId: socket.id });
    });

    socket.on('cancel-reconnect', () => {
        const userId = userService.getUserId(socket.id);
        if (!userId) return;

        // Check if this user has a pending reconnect (they are the one who disconnected)
        if (pendingReconnects.has(userId)) {
            cancelPendingReconnect(io, userId, 'user-cancelled', scanQueueForMatches);
            return;
        }

        // Check if this user is the PARTNER waiting for someone to reconnect
        for (const [disconnectedUserId, pending] of pendingReconnects.entries()) {
            if (pending.partnerSocketId === socket.id) {
                cancelPendingReconnect(io, disconnectedUserId, 'partner-cancelled', scanQueueForMatches);
                return;
            }
        }
    });
};
