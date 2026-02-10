import { Socket, Server } from 'socket.io';
import { User } from '../types';
import {
    chatQueue,
    videoQueue,
    chatBuckets,
    videoBuckets,
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
    QUEUE_THRESHOLD_FAST_HEARTBEAT: 50
};

// --- STATE MANAGEMENT ---

const lastPartnerMap = new Map<string, string>(); // userId -> partnerUserId
const lastPartnerTimeouts = new Map<string, NodeJS.Timeout>(); // userId -> timeout
const pendingMatches = new Map<string, PendingMatch>(); // roomId -> PendingMatch
const userPendingMatch = new Map<string, string>(); // socketId -> roomId
const fallbackTimeouts = new Map<string, NodeJS.Timeout>(); // socketId -> timeout
const skipLocks = new Set<string>(); // socketId -> boolean (Prevents rapid skip spam)

interface PendingMatch {
    pair: [User, User];
    mode: 'chat' | 'video';
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
    // Cannot match with self (different socket handles are checked by userId later, but socketId is first layer)
    if (userA.id === userB.id) return false;
    // Cannot match if same person (multi-tab or immediate reconnect)
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

const notifyQueuePositions = (io: Server, mode: 'chat' | 'video') => {
    const queue = mode === 'chat' ? chatQueue : videoQueue;
    queue.forEach((user, index) => {
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

const initiateHandshake = (io: Server, userA: User, userB: User, mode: 'chat' | 'video') => {
    // ATOMIC STATE CHANGE
    userA.state = 'NEGOTIATING';
    userB.state = 'NEGOTIATING';

    const sortedIds = [userA.id, userB.id].sort();
    const roomId = `room-${sortedIds[0]}-${sortedIds[1]}-${Date.now()}`;

    // Set Cooldowns (UserId based)
    lastPartnerMap.set(userA.userId, userB.userId);
    lastPartnerMap.set(userB.userId, userA.userId);

    const cooldownTimeout = setTimeout(() => {
        if (lastPartnerMap.get(userA.userId) === userB.userId) clearCooldown(userA.userId);
        if (lastPartnerMap.get(userB.userId) === userA.userId) clearCooldown(userB.userId);
    }, CONSTANTS.COOLDOWN_MS);

    [userA.userId, userB.userId].forEach(uid => {
        const prev = lastPartnerTimeouts.get(uid);
        if (prev) clearTimeout(prev);
        lastPartnerTimeouts.set(uid, cooldownTimeout);
    });

    // Handshake Timeout
    const timeout = setTimeout(() => handleMatchFailure(io, roomId, 'timeout'), CONSTANTS.HANDSHAKE_TIMEOUT_MS);

    pendingMatches.set(roomId, {
        pair: [userA, userB],
        mode,
        startTime: Date.now(),
        acks: new Set(),
        timeout,
        roomId
    });

    userPendingMatch.set(userA.id, roomId);
    userPendingMatch.set(userB.id, roomId);

    io.to(userB.id).emit('prepare-match', { partnerCountry: userA.country, partnerCountryCode: userA.countryCode });
    io.to(userA.id).emit('prepare-match', { partnerCountry: userB.country, partnerCountryCode: userB.countryCode });
};

const handleMatchFailure = (io: Server, rid: string, reason: string) => {
    const pending = pendingMatches.get(rid);
    if (!pending) return;

    // 1. ATOMIC STATE UPDATE: Set all users to FINDING before re-adding
    pending.pair.forEach(u => {
        u.state = 'FINDING';
    });

    // 2. EXHAUSTIVE PURGE
    pending.pair.forEach(u => {
        userPendingMatch.delete(u.id);
        const s = io.sockets.sockets.get(u.id);
        if (s) {
            s.emit('match-cancelled', { reason });
            // SENIORITY PRESERVATION: Re-add to queue directly
            QueueManager.add(u);
        }
    });

    clearTimeout(pending.timeout);
    pending.acks.clear();
    pendingMatches.delete(rid);

    scanQueueForMatches(io);
    notifyQueuePositions(io, pending.mode);
};

// --- CORE LOGIC ---

export const scanQueueForMatches = (io: Server) => {
    if (isScanning) {
        needsRescan = true;
        return;
    }

    isScanning = true;

    try {
        ['chat', 'video'].forEach(m => {
            const mode = m as 'chat' | 'video';
            const globalQueue = mode === 'chat' ? chatQueue : videoQueue;
            const buckets = mode === 'chat' ? chatBuckets : videoBuckets;

            if (globalQueue.length < 2) return;

            // We use a set to track users matched in this pass to avoid duplicate processing
            const matchedInThisPass = new Set<string>();

            // 1. COLLECT AND VALIDATE ELIGIBLE USERS
            // Robustness: Ensure user is still connected AND is the authoritative socket for their ID
            const eligibleUsers = globalQueue.filter(u =>
                u.state === 'FINDING' &&
                io.sockets.sockets.has(u.id) &&
                userService.getSocketId(u.userId) === u.id
            );

            // 2. ITERATE BY JOIN ORDER (FIFO)
            for (let i = 0; i < eligibleUsers.length; i++) {
                const userA = eligibleUsers[i];
                if (matchedInThisPass.has(userA.id)) continue;

                let partner: User | undefined;

                // TRY PREFERENCE MATCH FIRST (O(BucketSize) instead of O(QueueSize))
                if (userA.preferredCountry) {
                    const targetBucket = buckets.get(userA.preferredCountry);
                    if (targetBucket) {
                        partner = targetBucket.find(userB =>
                            !matchedInThisPass.has(userB.id) &&
                            userB.id !== userA.id &&
                            userB.state === 'FINDING' &&
                            userService.getSocketId(userB.userId) === userB.id && // Validate partner auth
                            areUsersCompatible(userA, userB)
                        );
                    }
                }

                // TRY GENERAL MATCH (O(QueueSize) but respects FIFO)
                if (!partner) {
                    for (let j = 0; j < eligibleUsers.length; j++) {
                        const userB = eligibleUsers[j];
                        if (userB.id === userA.id || matchedInThisPass.has(userB.id)) continue;

                        // Note: userB is already validated for auth in the eligibleUsers filter
                        if (areUsersCompatible(userA, userB)) {
                            partner = userB;
                            break;
                        }
                    }
                }

                if (partner) {
                    matchedInThisPass.add(userA.id);
                    matchedInThisPass.add(partner.id);

                    // Atomic Removal from persistent queues
                    QueueManager.remove(userA.id);
                    QueueManager.remove(partner.id);

                    initiateHandshake(io, userA, partner, mode);
                }
            }

            if (matchedInThisPass.size > 0) {
                notifyQueuePositions(io, mode);
            }
        });
    } finally {
        isScanning = false;
        if (needsRescan) {
            needsRescan = false;
            // Debounce the next scan slightly to allow batching
            setTimeout(() => scanQueueForMatches(io), 100);
        }
    }
};

const QueueManager = {
    add: (user: User) => {
        const q = user.mode === 'chat' ? chatQueue : videoQueue;
        const bMap = user.mode === 'chat' ? chatBuckets : videoBuckets;

        // Cleanup existing (prevents duplicate entries)
        const qIndex = q.findIndex(u => u.id === user.id);
        if (qIndex !== -1) q.splice(qIndex, 1);

        const bucket = bMap.get(user.countryCode);
        if (bucket) {
            const bIndex = bucket.findIndex(u => u.id === user.id);
            if (bIndex !== -1) bucket.splice(bIndex, 1);
        }

        userPendingMatch.delete(user.id);

        const insertSorted = (arr: User[], newUser: User) => {
            let low = 0, high = arr.length;
            while (low < high) {
                let mid = (low + high) >>> 1;
                if (arr[mid].joinedAt < newUser.joinedAt) low = mid + 1;
                else high = mid;
            }
            arr.splice(low, 0, newUser);
        };

        insertSorted(q, user);
        if (!bMap.has(user.countryCode)) bMap.set(user.countryCode, []);
        insertSorted(bMap.get(user.countryCode)!, user);
    },
    remove: (socketId: string) => {
        // Also remove locks if present
        skipLocks.delete(socketId);

        const userInfo = connectedUsers.get(socketId);
        removeUserFromQueues(socketId, userInfo?.countryCode);
    }
};

// --- HANDLERS ---

export const handleMatchmaking = (io: Server, socket: Socket) => {
    socket.on('find-match', async (data: { mode: 'chat' | 'video', preferredCountry?: string }) => {
        // SKIP LOCK: Prevent spamming
        if (skipLocks.has(socket.id)) return;
        skipLocks.add(socket.id);

        try {
            const userId = userService.getUserId(socket.id);
            if (!userId || userService.getSocketId(userId) !== socket.id) {
                socket.emit('multi-session', { message: 'Your session is no longer active.' });
                return;
            }

            // 1. BACKEND-LEVEL SKIP ATOMICITY
            // If user is currently in a handshake or call, clean it up before allowing a new search
            const activePartner = activeCalls.get(socket.id);
            if (activePartner) {
                io.to(activePartner).emit('call-ended', { by: socket.id });
                activeCalls.delete(activePartner);
                activeCalls.delete(socket.id);
            }

            const pendingRoomId = userPendingMatch.get(socket.id);
            if (pendingRoomId) {
                handleMatchFailure(io, pendingRoomId, 'partner-left');
            }

            // 2. AUTHORITATIVE CLEANUP: Clear any existing timers
            const existingTimeout = fallbackTimeouts.get(socket.id);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
                fallbackTimeouts.delete(socket.id);
            }

            // 3. SENIORITY PRESERVATION
            const q = data.mode === 'chat' ? chatQueue : videoQueue;
            const existingUser = q.find(u => u.id === socket.id);
            const joinTime = existingUser?.joinedAt || Date.now();

            const userInfo = connectedUsers.get(socket.id);
            if (!userInfo) return; // Should not happen if connected

            const currentUser: User = {
                id: socket.id,
                userId,
                country: userInfo.country,
                countryCode: userInfo.countryCode,
                mode: data.mode,
                preferredCountry: data.preferredCountry === 'GLOBAL' ? undefined : data.preferredCountry,
                joinedAt: joinTime,
                state: 'FINDING'
            };

            QueueManager.add(currentUser);
            scanQueueForMatches(io);
            notifyQueuePositions(io, data.mode);

            // 4. FALLBACK TIMER
            if (currentUser.preferredCountry) {
                const timeout = setTimeout(() => {
                    fallbackTimeouts.delete(socket.id);
                    const q = currentUser.mode === 'chat' ? chatQueue : videoQueue;
                    const u = q.find(user => user.id === socket.id);
                    if (u && u.state === 'FINDING' && u.preferredCountry) {
                        u.preferredCountry = undefined;
                        scanQueueForMatches(io);
                    }
                }, CONSTANTS.FALLBACK_TIMER_MS);
                fallbackTimeouts.set(socket.id, timeout);
            }
        } finally {
            // Remove lock immediately after processing the request logic (queue addition)
            // The actual matching happens async in scanQueueForMatches, but this request is done
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
                    const media = userMediaState.get(partner.id) || { isMuted: false, isCameraOff: false };
                    io.to(to).emit('match-found', {
                        role, partnerId: partner.id, partnerCountry: partner.country,
                        partnerCountryCode: partner.countryCode, partnerIsMuted: media.isMuted,
                        partnerIsCameraOff: media.isCameraOff, roomId: pending.roomId, mode: pending.mode
                    });
                };
                emitMatch(uB.id, uA, 'offerer');
                emitMatch(uA.id, uB, 'answerer');
            }
        }
    });

    socket.on('stop-searching', () => {
        QueueManager.remove(socket.id);
        const timeout = fallbackTimeouts.get(socket.id);
        if (timeout) clearTimeout(timeout);
        fallbackTimeouts.delete(socket.id);

        // Robustness: If connected, end the call
        const partnerId = activeCalls.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(partnerId);
        }
        activeCalls.delete(socket.id);

        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
            const q = chatQueue.some(u => u.id === socket.id) ? 'chat' : 'video';
            notifyQueuePositions(io, q as any);
        }
    });

    socket.on('end-call', () => {
        const partnerId = activeCalls.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(partnerId);
        }
        activeCalls.delete(socket.id);
        QueueManager.remove(socket.id);
    });

    socket.on('disconnect', () => {
        QueueManager.remove(socket.id);

        const roomId = userPendingMatch.get(socket.id);
        if (roomId) handleMatchFailure(io, roomId, 'partner-disconnected');

        const timeout = fallbackTimeouts.get(socket.id);
        if (timeout) clearTimeout(timeout);
        fallbackTimeouts.delete(socket.id);

        const userId = userService.getUserId(socket.id);
        if (userId) {
            const partnerUserId = lastPartnerMap.get(userId);
            if (partnerUserId) clearCooldown(partnerUserId);
            clearCooldown(userId);
        }

        const partnerId = activeCalls.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(partnerId);
        }
        activeCalls.delete(socket.id);

        statsService.decrementOnlineUsers();
        activeUsers.delete(socket.id);
        io.emit('stats-update', statsService.getStats());
        scanQueueForMatches(io);
    });
};

// --- INITIALIZATION ---

let heartbeatTimeout: NodeJS.Timeout | null = null;

const runHeartbeat = (io: Server) => {
    // Dynamic Interval based on load
    const totalUsers = chatQueue.length + videoQueue.length;
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
    console.log('[MATCH] Matchmaker heartbeat started.');
    runHeartbeat(io);
};
