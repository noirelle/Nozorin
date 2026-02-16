
import { Socket, Server } from 'socket.io';
import { User } from '../types';
import {
    voiceQueue,
    voiceBuckets,
    activeCalls,
    activeUsers,
    connectedUsers,
    userMediaState,
    removeUserFromQueues
} from './users';
import { statsService } from '../services/statsService';
import { userService } from '../services/userService';

// --- CONFIGURATION ---

const CONSTANTS = {
    COOLDOWN_MS: 5000,
    HANDSHAKE_TIMEOUT_MS: 5000,
    HEARTBEAT_FAST_MS: 1000,
    HEARTBEAT_SLOW_MS: 4000,
    FALLBACK_TIMER_MS: 5000,
    RECONNECT_TIMEOUT_MS: 30000,
    QUEUE_THRESHOLD_FAST_HEARTBEAT: 50
};

// --- STATE MANAGEMENT ---

const lastPartnerMap = new Map<string, string>(); // userId -> partnerUserId
const lastPartnerTimeouts = new Map<string, NodeJS.Timeout>(); // userId -> timeout
const pendingMatches = new Map<string, PendingMatch>(); // roomId -> PendingMatch
const userPendingMatch = new Map<string, string>(); // socketId -> roomId
const fallbackTimeouts = new Map<string, NodeJS.Timeout>(); // socketId -> timeout
const skipLocks = new Set<string>(); // socketId -> boolean (Prevents rapid skip spam)

// --- RECONNECT STATE ---

interface PendingReconnect {
    partnerSocketId: string;
    partnerUserId: string;
    disconnectedUserId: string;
    timeout: NodeJS.Timeout;
}

const pendingReconnects = new Map<string, PendingReconnect>(); // disconnectedUserId -> PendingReconnect

interface PendingMatch {
    pair: [User, User];
    mode: 'voice';
    startTime: number;
    acks: Set<string>;
    timeout: NodeJS.Timeout;
    roomId: string;
}

// --- CONCURRENCY CONTROL ---

let isScanning = false;
let needsRescan = false;

// --- UTILITIES ---

const areUsersCompatible = (userA: User, userB: User) => {
    // Only users in FINDING state can be matched
    if (userA.state !== 'FINDING' || userB.state !== 'FINDING') return false;
    // Cannot match with self
    if (userA.id === userB.id) return false;
    // Cannot match if same person
    if (userA.userId === userB.userId) return false;

    // Last Partner Cooldown (userId based)
    const lastA = lastPartnerMap.get(userA.userId);
    const lastB = lastPartnerMap.get(userB.userId);
    if (lastA === userB.userId || lastB === userA.userId) return false;

    // Country Preferences
    const aSatisfied = !userA.preferredCountry || userA.preferredCountry === userB.countryCode;
    const bSatisfied = !userB.preferredCountry || userB.preferredCountry === userA.countryCode;

    return aSatisfied && bSatisfied;
};

const notifyQueuePositions = (io: Server) => {
    voiceQueue.forEach((user, index) => {
        const socket = io.sockets.sockets.get(user.id);
        if (socket) socket.emit('waiting-for-match', { position: index + 1 });
    });
};

const clearCooldown = (userId: string) => {
    lastPartnerMap.delete(userId);
    const timeout = lastPartnerTimeouts.get(userId);
    if (timeout) {
        clearTimeout(timeout);
        lastPartnerTimeouts.delete(userId);
    }
};

const initiateHandshake = (io: Server, userA: User, userB: User) => {
    // ATOMIC STATE CHANGE
    userA.state = 'NEGOTIATING';
    userB.state = 'NEGOTIATING';

    const sortedIds = [userA.id, userB.id].sort();
    const roomId = `room-${sortedIds[0]}-${sortedIds[1]}-${Date.now()}`;

    // Set temporary "matched" state, but actual cooldown is set when they finish.
    lastPartnerMap.set(userA.userId, userB.userId);
    lastPartnerMap.set(userB.userId, userA.userId);

    const timeout = setTimeout(() => handleMatchFailure(io, roomId, 'timeout'), CONSTANTS.HANDSHAKE_TIMEOUT_MS);

    pendingMatches.set(roomId, {
        pair: [userA, userB],
        mode: 'voice',
        startTime: Date.now(),
        acks: new Set(),
        timeout,
        roomId
    });

    userPendingMatch.set(userA.id, roomId);
    userPendingMatch.set(userB.id, roomId);

    io.to(userB.id).emit('prepare-match', {
        partnerCountry: userA.country,
        partnerCountryCode: userA.countryCode,
        partnerUsername: userA.username,
        partnerAvatar: userA.avatar
    });
    io.to(userA.id).emit('prepare-match', {
        partnerCountry: userB.country,
        partnerCountryCode: userB.countryCode,
        partnerUsername: userB.username,
        partnerAvatar: userB.avatar
    });
};

const handleMatchFailure = (io: Server, rid: string, reason: string) => {
    const pending = pendingMatches.get(rid);
    if (!pending) return;

    // 1. ATOMIC STATE UPDATE
    pending.pair.forEach(u => {
        u.state = 'FINDING';
    });

    // 2. EXHAUSTIVE PURGE
    pending.pair.forEach(u => {
        userPendingMatch.delete(u.id);
        const s = io.sockets.sockets.get(u.id);
        if (s) {
            s.emit('match-cancelled', { reason });
            // SENIORITY PRESERVATION
            QueueManager.add(u);
        }
    });

    clearTimeout(pending.timeout);
    pending.acks.clear();
    pendingMatches.delete(rid);

    scanQueueForMatches(io);
    notifyQueuePositions(io);
};

// --- CORE LOGIC ---

export const scanQueueForMatches = (io: Server) => {
    if (isScanning) {
        needsRescan = true;
        return;
    }

    isScanning = true;

    try {
        if (voiceQueue.length < 2) return;

        const matchedInThisPass = new Set<string>();

        // 1. COLLECT AND VALIDATE ELIGIBLE USERS
        const eligibleUsers = voiceQueue.filter(u =>
            u.state === 'FINDING' &&
            io.sockets.sockets.has(u.id) &&
            userService.getSocketId(u.userId) === u.id
        );

        // 2. ITERATE BY JOIN ORDER (FIFO)
        for (let i = 0; i < eligibleUsers.length; i++) {
            const userA = eligibleUsers[i];
            if (matchedInThisPass.has(userA.id)) continue;

            let partner: User | undefined;

            // TRY PREFERENCE MATCH FIRST
            if (userA.preferredCountry) {
                const targetBucket = voiceBuckets.get(userA.preferredCountry);
                if (targetBucket) {
                    partner = targetBucket.find(userB =>
                        !matchedInThisPass.has(userB.id) &&
                        userB.id !== userA.id &&
                        userB.state === 'FINDING' &&
                        userService.getSocketId(userB.userId) === userB.id &&
                        areUsersCompatible(userA, userB)
                    );
                }
            }

            // TRY GENERAL MATCH
            if (!partner) {
                for (let j = 0; j < eligibleUsers.length; j++) {
                    const userB = eligibleUsers[j];
                    if (userB.id === userA.id || matchedInThisPass.has(userB.id)) continue;

                    if (areUsersCompatible(userA, userB)) {
                        partner = userB;
                        break;
                    }
                }
            }

            if (partner) {
                matchedInThisPass.add(userA.id);
                matchedInThisPass.add(partner.id);

                QueueManager.remove(userA.id);
                QueueManager.remove(partner.id);

                initiateHandshake(io, userA, partner);
            }
        }

        if (matchedInThisPass.size > 0) {
            notifyQueuePositions(io);
        }
    } finally {
        isScanning = false;
        if (needsRescan) {
            needsRescan = false;
            setTimeout(() => scanQueueForMatches(io), 100);
        }
    }
};

const QueueManager = {
    add: (user: User, resetSeniority: boolean = false) => {
        // Cleanup existing by userId (Singleton in queue)
        const qIndex = voiceQueue.findIndex(u => u.userId === user.userId);
        if (qIndex !== -1) voiceQueue.splice(qIndex, 1);

        const bucket = voiceBuckets.get(user.countryCode);
        if (bucket) {
            const bIndex = bucket.findIndex(u => u.userId === user.userId);
            if (bIndex !== -1) bucket.splice(bIndex, 1);
        }

        userPendingMatch.delete(user.id);

        // SENIORITY RESET
        if (resetSeniority) {
            user.joinedAt = Date.now();
        }

        const insertSorted = (arr: User[], newUser: User) => {
            let low = 0, high = arr.length;
            while (low < high) {
                let mid = (low + high) >>> 1;
                if (arr[mid].joinedAt < newUser.joinedAt) low = mid + 1;
                else high = mid;
            }
            arr.splice(low, 0, newUser);
        };

        insertSorted(voiceQueue, user);
        if (!voiceBuckets.has(user.countryCode)) voiceBuckets.set(user.countryCode, []);
        insertSorted(voiceBuckets.get(user.countryCode)!, user);
    },
    remove: (socketId: string) => {
        skipLocks.delete(socketId);
        const userInfo = connectedUsers.get(socketId);
        removeUserFromQueues(socketId, userInfo?.countryCode);
    }
};

// --- HELPER: COOLDOWN ---
const setMatchCooldown = (userAId: string, userBId: string) => {
    lastPartnerMap.set(userAId, userBId);
    lastPartnerMap.set(userBId, userAId);

    // Clear existing timeouts
    [userAId, userBId].forEach(uid => {
        if (lastPartnerTimeouts.has(uid)) {
            clearTimeout(lastPartnerTimeouts.get(uid)!);
            lastPartnerTimeouts.delete(uid);
        }
    });

    // Set new timeout
    const timeout = setTimeout(() => {
        if (lastPartnerMap.get(userAId) === userBId) clearCooldown(userAId);
        if (lastPartnerMap.get(userBId) === userAId) clearCooldown(userBId);
    }, CONSTANTS.COOLDOWN_MS);

    lastPartnerTimeouts.set(userAId, timeout);
    lastPartnerTimeouts.set(userBId, timeout);
};

// --- HANDLERS ---

export const handleMatchmakingDisconnect = (io: Server, socketId: string, explicitUserId?: string) => {
    QueueManager.remove(socketId);

    const roomId = userPendingMatch.get(socketId);
    if (roomId) handleMatchFailure(io, roomId, 'partner-disconnected');

    const timeout = fallbackTimeouts.get(socketId);
    if (timeout) clearTimeout(timeout);
    fallbackTimeouts.delete(socketId);

    // Handle Active Call Disconnect
    const partnerId = activeCalls.get(socketId);
    if (partnerId) {
        const userId = explicitUserId || userService.getUserId(socketId);
        const partnerUserId = userService.getUserId(partnerId);

        if (userId && partnerUserId) {
            // RECONNECT WINDOW: Instead of immediately ending the partner's call,
            // give the disconnected user 30 seconds to reconnect.
            console.log(`[MATCH] User ${userId.substring(0, 8)}... disconnected mid-call. Starting 30s reconnect window.`);

            // Notify partner that their partner is reconnecting
            io.to(partnerId).emit('partner-reconnecting', { timeoutMs: CONSTANTS.RECONNECT_TIMEOUT_MS });

            const reconnectTimeout = setTimeout(() => {
                // Time expired — fully end the call
                console.log(`[MATCH] Reconnect timeout expired for user ${userId.substring(0, 8)}...`);
                pendingReconnects.delete(userId);

                // Now apply cooldown and end the partner's call
                setMatchCooldown(userId, partnerUserId);
                io.to(partnerId).emit('call-ended', { by: socketId, reason: 'reconnect-timeout' });
                activeCalls.delete(partnerId);

                scanQueueForMatches(io);
            }, CONSTANTS.RECONNECT_TIMEOUT_MS);

            pendingReconnects.set(userId, {
                partnerSocketId: partnerId,
                partnerUserId,
                disconnectedUserId: userId,
                timeout: reconnectTimeout,
            });

            // Remove the disconnected user's side of activeCalls but KEEP the partner's
            activeCalls.delete(socketId);
            return; // Don't clean up partner's activeCalls yet
        }

        // Fallback: if we can't identify users, end immediately
        io.to(partnerId).emit('call-ended', { by: socketId });
        activeCalls.delete(partnerId);
    }
    activeCalls.delete(socketId);

    scanQueueForMatches(io);
};

/**
 * Cancel a pending reconnect (called when the partner or system cancels)
 */
const cancelPendingReconnect = (io: Server, userId: string, reason: string = 'cancelled') => {
    const pending = pendingReconnects.get(userId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    pendingReconnects.delete(userId);

    setMatchCooldown(userId, pending.partnerUserId);
    io.to(pending.partnerSocketId).emit('call-ended', { by: userId, reason });
    activeCalls.delete(pending.partnerSocketId);

    console.log(`[MATCH] Reconnect cancelled for ${userId.substring(0, 8)}... reason: ${reason}`);
    scanQueueForMatches(io);
};

/**
 * When the waiting partner takes any action (end-call, stop-searching, find-match),
 * terminate any pending reconnect where they are the partner.
 * This prevents the disconnected user from rejoining a dead room.
 */
const cleanupPendingReconnectsForPartner = (io: Server, socketId: string) => {
    for (const [disconnectedUserId, pending] of pendingReconnects.entries()) {
        if (pending.partnerSocketId === socketId) {
            cancelPendingReconnect(io, disconnectedUserId, 'partner-left');
            return; // Each socket can only be partner in at most one pending reconnect
        }
    }
};

export const handleMatchmaking = (io: Server, socket: Socket) => {
    socket.on('find-match', async (data: { mode: 'voice', preferredCountry?: string }) => {
        // SKIP LOCK: Prevent spamming
        if (skipLocks.has(socket.id)) return;
        skipLocks.add(socket.id);

        try {
            const userId = userService.getUserId(socket.id);
            if (!userId || userService.getSocketId(userId) !== socket.id) {
                socket.emit('multi-session', { message: 'Your session is no longer active.' });
                return;
            }

            // 1. BACKEND-LEVEL SKIP
            const activePartner = activeCalls.get(socket.id);
            if (activePartner) {
                // Apply fresh cooldown on skip
                const partnerUserId = userService.getUserId(activePartner);
                if (userId && partnerUserId) {
                    setMatchCooldown(userId, partnerUserId);
                }

                io.to(activePartner).emit('call-ended', { by: socket.id });
                activeCalls.delete(activePartner);
                activeCalls.delete(socket.id);
            }

            // Clean up any pending reconnect where this user is the waiting partner
            cleanupPendingReconnectsForPartner(io, socket.id);

            const pendingRoomId = userPendingMatch.get(socket.id);
            if (pendingRoomId) {
                handleMatchFailure(io, pendingRoomId, 'partner-left');
            }

            // 2. AUTHORITATIVE CLEANUP
            const existingTimeout = fallbackTimeouts.get(socket.id);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
                fallbackTimeouts.delete(socket.id);
            }


            const resetSeniority = true;
            const joinTime = resetSeniority ? Date.now() : (voiceQueue.find(u => u.userId === userId)?.joinedAt || Date.now());

            const userInfo = connectedUsers.get(socket.id);
            if (!userInfo) return;

            const userProfile = await userService.getUserProfile(userId);

            const currentUser: User = {
                id: socket.id,
                userId,
                username: userProfile?.username || 'Guest',
                avatar: userProfile?.avatar || '/avatars/avatar1.webp',
                gender: userProfile?.gender || 'unknown',
                country: userInfo.country,
                countryCode: userInfo.countryCode,
                mode: 'voice',
                preferredCountry: data.preferredCountry === 'GLOBAL' ? undefined : data.preferredCountry,
                joinedAt: joinTime,
                state: 'FINDING'
            };

            QueueManager.add(currentUser, resetSeniority);
            scanQueueForMatches(io);
            notifyQueuePositions(io);

            // 4. FALLBACK TIMER
            if (currentUser.preferredCountry) {
                const timeout = setTimeout(() => {
                    fallbackTimeouts.delete(socket.id);
                    const u = voiceQueue.find(user => user.id === socket.id);
                    if (u && u.state === 'FINDING' && u.preferredCountry) {
                        u.preferredCountry = undefined;
                        scanQueueForMatches(io);
                    }
                }, CONSTANTS.FALLBACK_TIMER_MS);
                fallbackTimeouts.set(socket.id, timeout);
            }
        } finally {
            skipLocks.delete(socket.id);
        }
    });

    socket.on('match-ready', () => {
        const roomId = userPendingMatch.get(socket.id);
        const pending = pendingMatches.get(roomId || '');
        if (!pending) return;

        pending.acks.add(socket.id);
        if (pending.acks.size === 2) {
            const [uA, uB] = pending.pair;
            if (uA.state !== 'NEGOTIATING' || uB.state !== 'NEGOTIATING') {
                handleMatchFailure(io, pending.roomId, 'handshake-interrupted');
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
                    const timeout = fallbackTimeouts.get(to);
                    if (timeout) {
                        clearTimeout(timeout);
                        fallbackTimeouts.delete(to);
                    }

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

    socket.on('stop-searching', () => {
        QueueManager.remove(socket.id);
        const timeout = fallbackTimeouts.get(socket.id);
        if (timeout) clearTimeout(timeout);
        fallbackTimeouts.delete(socket.id);

        const partnerId = activeCalls.get(socket.id);
        if (partnerId) {
            // Apply fresh cooldown on stop
            const userId = userService.getUserId(socket.id);
            const partnerUserId = userService.getUserId(partnerId);
            if (userId && partnerUserId) {
                setMatchCooldown(userId, partnerUserId);
            }

            io.to(partnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(partnerId);
        }
        activeCalls.delete(socket.id);

        // Clean up any pending reconnect where this user is the waiting partner
        cleanupPendingReconnectsForPartner(io, socket.id);

        notifyQueuePositions(io);
    });

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
        cleanupPendingReconnectsForPartner(io, socket.id);
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
        const partnerInfo = connectedUsers.get(pending.partnerSocketId);
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
            cancelPendingReconnect(io, userId, 'user-cancelled');
            return;
        }

        // Check if this user is the PARTNER waiting for someone to reconnect
        for (const [disconnectedUserId, pending] of pendingReconnects.entries()) {
            if (pending.partnerSocketId === socket.id) {
                cancelPendingReconnect(io, disconnectedUserId, 'partner-cancelled');
                return;
            }
        }
    });

    // socket.on('disconnect') handled by handleMatchmakingDisconnect called from connection.ts
};

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
