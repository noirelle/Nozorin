
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

// Track the last partner ID for each user to prevent immediate re-matching
const lastPartnerMap = new Map<string, string>(); // user ID -> last partner user ID

// Track pending matches during handshake
interface PendingMatch {
    pair: [User, User]; // [userA, userB]
    mode: 'chat' | 'video';
    startTime: number;
    acks: Set<string>;
    timeout: NodeJS.Timeout;
    roomId: string;
}
const pendingMatches = new Map<string, PendingMatch>(); // roomId -> PendingMatch
const userPendingMatch = new Map<string, string>(); // socketId -> roomId

// Helper to check if two users are compatible for matching
const areUsersCompatible = (userA: User, userB: User) => {
    // 1. MUST be in FINDING state
    if (userA.state !== 'FINDING' || userB.state !== 'FINDING') return false;

    // 2. Prevent matching with self
    if (userA.userId === userB.userId) return false;

    // 3. Block immediate re-matching (Persistent Re-match Prevention)
    const lastA = lastPartnerMap.get(userA.userId);
    const lastB = lastPartnerMap.get(userB.userId);
    if (lastA === userB.userId || lastB === userA.userId) return false;

    // 4. Criteria Check
    const aSatisfied = !userA.preferredCountry || userA.preferredCountry === userB.countryCode;
    const bSatisfied = !userB.preferredCountry || userB.preferredCountry === userA.countryCode;

    return aSatisfied && bSatisfied;
};

// Notify all users in the queue of their current position
const notifyQueuePositions = (io: Server, mode: 'chat' | 'video') => {
    const queue = mode === 'chat' ? chatQueue : videoQueue;
    queue.forEach((user, index) => {
        const socket = io.sockets.sockets.get(user.id);
        if (socket) {
            socket.emit('waiting-for-match', { position: index + 1 });
        }
    });
};

// Initiate handshake between two users
const initiateHandshake = (io: Server, userA: User, userB: User, mode: 'chat' | 'video') => {
    // 1. Transition to NEGOTIATING (isolates them from dispatcher)
    userA.state = 'NEGOTIATING';
    userB.state = 'NEGOTIATING';

    const sortedIds = [userA.id, userB.id].sort();
    const roomId = `room-${sortedIds[0]}-${sortedIds[1]}-${Date.now()}`;

    // 2. Persistent Re-match Prevention (using persistent User IDs)
    lastPartnerMap.set(userA.userId, userB.userId);
    lastPartnerMap.set(userB.userId, userA.userId);

    // Clear cooldown after 10s
    setTimeout(() => {
        if (lastPartnerMap.get(userA.userId) === userB.userId) lastPartnerMap.delete(userA.userId);
        if (lastPartnerMap.get(userB.userId) === userA.userId) lastPartnerMap.delete(userB.userId);
        scanQueueForMatches(io);
    }, 10000);

    const startTime = Date.now();
    const timeout = setTimeout(() => {
        const pending = pendingMatches.get(roomId);
        if (pending) {
            console.log(`[MATCH] Handshake failed for ${roomId} due to timeout`);
            handleMatchFailure(io, roomId, 'timeout');
        }
    }, 5000); // Production-ready: 5s handshake window (Azar style)

    pendingMatches.set(roomId, {
        pair: [userA, userB],
        mode,
        startTime,
        acks: new Set(),
        timeout,
        roomId
    });

    userPendingMatch.set(userA.id, roomId);
    userPendingMatch.set(userB.id, roomId);

    io.to(userB.id).emit('prepare-match', {
        partnerCountry: userA.country,
        partnerCountryCode: userA.countryCode,
    });
    io.to(userA.id).emit('prepare-match', {
        partnerCountry: userB.country,
        partnerCountryCode: userB.countryCode,
    });

    console.log(`[MATCH] Handshake started for ${userA.id} and ${userB.id}`);
};

// Scan queues for potential matches using Bucketed Discovery
export const scanQueueForMatches = (io: Server) => {
    ['chat', 'video'].forEach(m => {
        const mode = m as 'chat' | 'video';
        const globalQueue = mode === 'chat' ? chatQueue : videoQueue;
        const buckets = mode === 'chat' ? chatBuckets : videoBuckets;

        if (globalQueue.length < 2) return;

        let i = 0;
        let matchHappened = false;

        while (i < globalQueue.length) {
            const userA = globalQueue[i];

            // 1. Safety Cleanup: If user is busy/disconnected, remove from all lists
            if (!io.sockets.sockets.has(userA.id) || userA.state !== 'FINDING') {
                removeUserFromQueues(userA.id);
                matchHappened = true;
                continue;
            }

            let partner: User | undefined;

            // 2. PRIORITY 1: Targeted Preference Match (O(1) bucket lookup)
            if (userA.preferredCountry) {
                const targetBucket = buckets.get(userA.preferredCountry);
                if (targetBucket) {
                    partner = targetBucket.find(userB =>
                        userB.id !== userA.id &&
                        areUsersCompatible(userA, userB)
                    );
                }
            }

            // 3. PRIORITY 2: Global Fallback (O(N) scan)
            // If userA has a preference, they are locked into Priority 1 for at least 5s
            // (The preferredCountry property is cleared after 5s by a timer in find-match)
            if (!partner && !userA.preferredCountry) {
                // Find someone else who is also compatible (respecting THEIR preferences)
                for (let j = i + 1; j < globalQueue.length; j++) {
                    const userB = globalQueue[j];
                    if (areUsersCompatible(userA, userB)) {
                        partner = userB;
                        break;
                    }
                }
            }

            if (partner) {
                // MATCH FOUND!
                removeUserFromQueues(userA.id, userA.countryCode);
                removeUserFromQueues(partner.id, partner.countryCode);
                initiateHandshake(io, userA, partner, mode);
                matchHappened = true;
                // Restart from head to satisfy the new head of queue
                i = 0;
            } else {
                i++;
            }
        }

        if (matchHappened) {
            notifyQueuePositions(io, mode);
        }
    });
};

// Start a background interval to ensure matches happen even if no new users join
let scanInterval: NodeJS.Timeout | null = null;
const startMatchmakerHeartbeat = (io: Server) => {
    if (scanInterval) return;
    scanInterval = setInterval(() => {
        if (chatQueue.length >= 2 || videoQueue.length >= 2) {
            scanQueueForMatches(io);
        }
    }, 4000); // Check every 4 seconds
};

const handleMatchFailure = (io: Server, rid: string, reason: string) => {
    const pending = pendingMatches.get(rid);
    if (!pending) return;

    console.log(`[MATCH] Match failed for ${rid} due to ${reason}`);

    // Cleanup
    clearTimeout(pending.timeout);
    pendingMatches.delete(rid);
    pending.pair.forEach(u => userPendingMatch.delete(u.id));

    // Notify victims and RE-QUEUE at the FRONT (seniority preservation)
    pending.pair.forEach(u => {
        const s = io.sockets.sockets.get(u.id);
        if (s) {
            s.emit('match-cancelled', { reason });
            // Re-insert into queue while preserving strict FIFO (sorted by joinedAt)
            u.state = 'FINDING';
            const gQueue = u.mode === 'chat' ? chatQueue : videoQueue;
            const buckets = u.mode === 'chat' ? chatBuckets : videoBuckets;

            gQueue.push(u);
            gQueue.sort((a, b) => a.joinedAt - b.joinedAt);

            if (!buckets.has(u.countryCode)) buckets.set(u.countryCode, []);
            buckets.get(u.countryCode)!.push(u);
            buckets.get(u.countryCode)!.sort((a, b) => a.joinedAt - b.joinedAt);
        }
    });

    scanQueueForMatches(io);
    notifyQueuePositions(io, pending.mode);
};

export const handleMatchmaking = (io: Server, socket: Socket) => {
    startMatchmakerHeartbeat(io);

    socket.on('find-match', async (data: { mode: 'chat' | 'video', preferredCountry?: string }) => {
        const mode = data.mode;

        // ROBUSTNESS: Ensure user is identified and this is the authoritative socket
        const userId = userService.getUserId(socket.id);
        const authoritativeSocketId = userId ? userService.getSocketId(userId) : null;

        if (!userId || authoritativeSocketId !== socket.id) {
            console.warn(`[MATCH] Non-authoritative session ${socket.id} tried to find-match.`);
            socket.emit('multi-session', { message: 'Your session is no longer active. Please reconnect.' });
            return;
        }

        console.log(`[MATCH] User ${userId.substring(0, 8)}... (${socket.id}) starting search in ${mode} mode`);

        // 1. Mandatory Cleanup: Remove user from all queues and pending matches
        const userInfoForCleanup = connectedUsers.get(socket.id);
        removeUserFromQueues(socket.id, userInfoForCleanup?.countryCode);
        const pendingRoomId = userPendingMatch.get(socket.id);
        if (pendingRoomId) {
            handleMatchFailure(io, pendingRoomId, 'partner-left');
        }

        // 2. End existing call if any
        const existingPartnerId = activeCalls.get(socket.id);
        if (existingPartnerId) {
            io.to(existingPartnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(existingPartnerId);
            activeCalls.delete(socket.id);
        }

        // 3. Update stats and state
        if (!activeUsers.has(socket.id)) {
            activeUsers.add(socket.id);
            statsService.incrementOnlineUsers();
            io.emit('stats-update', statsService.getStats());
        }

        // 4. Determine criteria
        const preferredCountry = data.preferredCountry === 'GLOBAL' ? undefined : data.preferredCountry;
        const userInfo = connectedUsers.get(socket.id);
        if (!userInfo) {
            console.warn(`[MATCH] User info not found for ${socket.id}. Cannot match.`);
            return;
        }

        // 5. ADD TO QUEUE FIRST (Ensures strict FIFO and avoids race conditions)
        const currentUser: User = {
            id: socket.id,
            userId: userId,
            country: userInfo.country,
            countryCode: userInfo.countryCode,
            mode: mode,
            preferredCountry: preferredCountry, // Respect preference IMMEDIATELY
            joinedAt: Date.now(),
            state: 'FINDING'
        };

        const targetGlobalQueue = mode === 'chat' ? chatQueue : videoQueue;
        const targetBuckets = mode === 'chat' ? chatBuckets : videoBuckets;

        // Add to global FIFO
        targetGlobalQueue.push(currentUser);
        // Ensure strictly ascending joinedAt for FIFO integrity
        targetGlobalQueue.sort((a, b) => a.joinedAt - b.joinedAt);

        // Add to country bucket for O(1) discovery
        if (!targetBuckets.has(userInfo.countryCode)) {
            targetBuckets.set(userInfo.countryCode, []);
        }
        targetBuckets.get(userInfo.countryCode)!.push(currentUser);

        // 6. TRIGGER GLOBAL SCAN
        scanQueueForMatches(io);
        notifyQueuePositions(io, mode);

        // 7. Handle feedback and 5s Fallback
        const currentIdx = targetGlobalQueue.findIndex(u => u.id === socket.id);
        if (currentIdx !== -1) {
            socket.emit('waiting-for-match', { position: currentIdx + 1 });

            // 5-Second Fallback: Relax preference to Global
            if (preferredCountry) {
                setTimeout(() => {
                    const u = targetGlobalQueue.find((q: User) => q.id === socket.id);
                    if (u && u.state === 'FINDING' && u.preferredCountry) {
                        u.preferredCountry = undefined;
                        console.log(`[MATCH] 5s Fallback triggered for ${socket.id}`);
                        scanQueueForMatches(io);
                    }
                }, 5000); // production-ready: 5s preference relaxation
            }
        }
    });

    // Handle Match Ready (Handshake Ack)
    socket.on('match-ready', () => {
        const roomId = userPendingMatch.get(socket.id);
        if (!roomId) return;

        const pending = pendingMatches.get(roomId);
        if (!pending) return;

        // Verify handshake is still valid (not timed out or already processed)
        // Handshake window is managed by the timeout set in find-match.
        // We removed the aggressive 2.5s latency check to prevent false positives on slower networks.

        pending.acks.add(socket.id);

        if (pending.acks.size === 2) {
            // BOTH are ready - Finalize the match!
            clearTimeout(pending.timeout);
            pendingMatches.delete(roomId);
            pending.pair.forEach(u => userPendingMatch.delete(u.id));

            const [userA, userB] = pending.pair;
            const mode = pending.mode;

            // Transition to MATCHED state
            userA.state = 'MATCHED';
            userB.state = 'MATCHED';

            const idA = userA.id;
            const idB = userB.id;

            activeCalls.set(idA, idB);
            activeCalls.set(idB, idA);

            const socketA = io.sockets.sockets.get(idA);
            const socketB = io.sockets.sockets.get(idB);

            if (!socketA || !socketB) {
                console.log(`[MATCH] One partner disconnected during finalizing`);
                return;
            }

            socketA.join(roomId);
            socketB.join(roomId);

            const mediaA = userMediaState.get(idA) || { isMuted: false, isCameraOff: false };
            const mediaB = userMediaState.get(idB) || { isMuted: false, isCameraOff: false };

            const infoA = connectedUsers.get(idA);
            const infoB = connectedUsers.get(idB);

            io.to(idB).emit('match-found', {
                role: 'offerer',
                partnerId: idA,
                partnerCountry: infoA?.country,
                partnerCountryCode: infoA?.countryCode,
                partnerIsMuted: mediaA.isMuted,
                partnerIsCameraOff: mediaA.isCameraOff,
                roomId,
                mode,
            });

            io.to(idA).emit('match-found', {
                role: 'answerer',
                partnerId: idB,
                partnerCountry: infoB?.country,
                partnerCountryCode: infoB?.countryCode,
                partnerIsMuted: mediaB.isMuted,
                partnerIsCameraOff: mediaB.isCameraOff,
                roomId,
                mode,
            });

            console.log(`[MATCH] Handshake complete. Matched ${idA} and ${idB}`);

            statsService.incrementDailyChats();
            statsService.incrementTotalConnections();
            io.emit('stats-update', statsService.getStats());
        }
    });

    // Stop searching
    socket.on('stop-searching', () => {
        const userInfoForStop = connectedUsers.get(socket.id);
        removeUserFromQueues(socket.id, userInfoForStop?.countryCode);
        const roomId = userPendingMatch.get(socket.id);
        if (roomId) handleMatchFailure(io, roomId, 'partner-left');
        scanQueueForMatches(io);
    });

    // End Call / Next
    socket.on('end-call', (data?: { target?: string }) => {
        let partnerId = data?.target || activeCalls.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(partnerId);
            activeCalls.delete(socket.id);
        }
        activeCalls.delete(socket.id);
        const userInfoForEnd = connectedUsers.get(socket.id);
        removeUserFromQueues(socket.id, userInfoForEnd?.countryCode);
        scanQueueForMatches(io);
    });

    // Handle Disconnect during handshake or while searching
    socket.on('disconnect', () => {
        // 1. Cleanup from matching pools
        const userInfo = connectedUsers.get(socket.id);
        removeUserFromQueues(socket.id, userInfo?.countryCode);

        // 2. Cleanup from handshake
        const roomId = userPendingMatch.get(socket.id);
        if (roomId) handleMatchFailure(io, roomId, 'partner-disconnected');

        // 3. Cleanup from active calls
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
