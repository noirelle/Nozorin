
import { Socket, Server } from 'socket.io';
import { User } from '../types';
import {
    chatQueue,
    videoQueue,
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
    pair: [string, string]; // [socketIdA, socketIdB]
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
    // 1. Prevent matching with self (same user ID across devices/tabs)
    if (userA.userId === userB.userId) {
        return false;
    }

    // 2. Block immediate re-matching
    if (lastPartnerMap.get(userA.userId) === userB.userId || lastPartnerMap.get(userB.userId) === userA.userId) {
        return false;
    }

    // 3. Check if A matches B's criteria
    const aSatisfied = !userA.preferredCountry || userA.preferredCountry === userB.countryCode;
    // 4. Check if B matches A's criteria
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
    // Determine a stable roomId based on sorted socket IDs
    const sortedIds = [userA.id, userB.id].sort();
    const roomId = `room-${sortedIds[0]}-${sortedIds[1]}-${Date.now()}`;

    // Track the last partner to prevent immediate re-matching
    lastPartnerMap.set(userA.userId, userB.userId);
    lastPartnerMap.set(userB.userId, userA.userId);

    // Clear the "loop prevention" after 10 seconds to allow re-matching later
    setTimeout(() => {
        if (lastPartnerMap.get(userA.userId) === userB.userId) lastPartnerMap.delete(userA.userId);
        if (lastPartnerMap.get(userB.userId) === userA.userId) lastPartnerMap.delete(userB.userId);
        // Proactively trigger a queue scan after cooldown expires
        scanQueueForMatches(io);
    }, 10000);

    const startTime = Date.now();
    const timeout = setTimeout(() => {
        const pending = pendingMatches.get(roomId);
        if (pending) {
            console.log(`[MATCH] Match failed for ${roomId} due to timeout`);
            clearTimeout(pending.timeout);
            pendingMatches.delete(roomId);
            pending.pair.forEach(sid => userPendingMatch.delete(sid));
            pending.pair.forEach(sid => {
                const s = io.sockets.sockets.get(sid);
                if (s) s.emit('match-cancelled', { reason: 'timeout' });
            });
            // Rescan after failure
            scanQueueForMatches(io);
        }
    }, 8000);

    pendingMatches.set(roomId, {
        pair: [userA.id, userB.id],
        mode,
        startTime,
        acks: new Set(),
        timeout,
        roomId
    });

    userPendingMatch.set(userA.id, roomId);
    userPendingMatch.set(userB.id, roomId);

    // Notify both to prepare
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

// Scan queues for potential matches
export const scanQueueForMatches = (io: Server) => {
    ['chat', 'video'].forEach(m => {
        const mode = m as 'chat' | 'video';
        const queue = mode === 'chat' ? chatQueue : videoQueue;

        if (queue.length < 2) return;

        let i = 0;
        let matchHappened = false;
        while (i < queue.length) {
            const userA = queue[i];

            // Safety cleanup: If user is busy or disconnected, remove them
            if (!io.sockets.sockets.has(userA.id) || userPendingMatch.has(userA.id)) {
                queue.splice(i, 1);
                matchHappened = true;
                continue;
            }

            let found = false;
            // Try to match userA (the oldest available person) with anyone further down
            for (let j = i + 1; j < queue.length; j++) {
                const userB = queue[j];

                // Skip busy/disconnected partners
                if (!io.sockets.sockets.has(userB.id) || userPendingMatch.has(userB.id)) {
                    queue.splice(j, 1);
                    j--; // Adjust index after splice
                    matchHappened = true;
                    continue;
                }

                if (areUsersCompatible(userA, userB)) {
                    // Match found!
                    queue.splice(j, 1);
                    queue.splice(i, 1);

                    initiateHandshake(io, userA, userB, mode);
                    found = true;
                    matchHappened = true;
                    break;
                }
            }

            if (found) {
                // Restart scan for this mode
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

export const handleMatchmaking = (io: Server, socket: Socket) => {
    startMatchmakerHeartbeat(io);

    const handleMatchFailure = (rid: string, reason: string) => {
        const pending = pendingMatches.get(rid);
        if (!pending) return;

        console.log(`[MATCH] Match failed for ${rid} due to ${reason}`);

        // Cleanup
        clearTimeout(pending.timeout);
        pendingMatches.delete(rid);
        pending.pair.forEach(sid => userPendingMatch.delete(sid));

        // Notify victims and potentially requeue them
        pending.pair.forEach(sid => {
            const s = io.sockets.sockets.get(sid);
            if (s) {
                s.emit('match-cancelled', { reason });
            }
        });

        // Proactively scan after failure to handle remaining queue
        scanQueueForMatches(io);
    };

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
        removeUserFromQueues(socket.id);
        const pendingRoomId = userPendingMatch.get(socket.id);
        if (pendingRoomId) {
            handleMatchFailure(pendingRoomId, 'partner-left');
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

        // Check if we should wait for a preferred country
        const isSomeoneWaitable = preferredCountry ? Array.from(activeUsers).some(id => {
            const info = connectedUsers.get(id);
            return info && info.countryCode === preferredCountry && id !== socket.id;
        }) : false;
        const shouldWait = preferredCountry && isSomeoneWaitable;

        // 5. ADD TO QUEUE FIRST (Ensures strict FIFO and avoids race conditions)
        const currentUser: User = {
            id: socket.id,
            userId: userId,
            country: userInfo.country,
            countryCode: userInfo.countryCode,
            mode: mode,
            preferredCountry: shouldWait ? preferredCountry : undefined,
            joinedAt: Date.now()
        };

        const targetQueue = mode === 'chat' ? chatQueue : videoQueue;
        targetQueue.push(currentUser);

        // Safety: Ensure it's sorted by time (usually redundant but good for robustness)
        targetQueue.sort((a, b) => a.joinedAt - b.joinedAt);

        // 6. TRIGGER GLOBAL SCAN (Immediately try to satisfy the oldest people in queue, including this newcomer)
        scanQueueForMatches(io);
        notifyQueuePositions(io, mode);

        // 7. Handle feedback to client if still in queue
        const currentIdx = targetQueue.findIndex(u => u.id === socket.id);
        if (currentIdx !== -1) {
            // Already handled by notifyQueuePositions, but sending initial confirm is good
            socket.emit('waiting-for-match', { position: currentIdx + 1 });

            // Handle preference timeout if applicable
            if (shouldWait) {
                setTimeout(() => {
                    const q = mode === 'chat' ? chatQueue : videoQueue;
                    const idx = q.findIndex(u => u.id === socket.id);
                    if (idx !== -1 && q[idx].preferredCountry) {
                        q[idx].preferredCountry = undefined;
                        console.log(`[MATCH] Preference timeout for ${socket.id}`);
                        scanQueueForMatches(io);
                    }
                }, 10000); // 10s wait for preference
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
            pending.pair.forEach(sid => userPendingMatch.delete(sid));

            const [idA, idB] = pending.pair;
            const mode = pending.mode;

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

    // Stop searching (cancel finding a match)
    socket.on('stop-searching', () => {
        console.log(`[STOP] User ${socket.id} stopped searching`);
        removeUserFromQueues(socket.id);

        // Cleanup pending match if in handshake
        const roomId = userPendingMatch.get(socket.id);
        if (roomId) {
            const pending = pendingMatches.get(roomId);
            if (pending) {
                // Determine other partner and notify them
                const otherId = pending.pair.find(id => id !== socket.id);
                if (otherId) io.to(otherId).emit('match-cancelled', { reason: 'partner-left' });

                clearTimeout(pending.timeout);
                pendingMatches.delete(roomId);
                pending.pair.forEach(sid => userPendingMatch.delete(sid));
            }
        }

        // Proactively scan after someone leaves
        scanQueueForMatches(io);
    });

    // End Call / Next Match / Skip
    socket.on('end-call', (data?: { target?: string }) => {
        console.log(`User ${socket.id} ending call`);

        // Get partner ID from either the data or the active calls map
        let partnerId = data?.target || activeCalls.get(socket.id);

        if (partnerId) {
            console.log(`Notifying partner ${partnerId} that call ended`);
            io.to(partnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(partnerId);
            activeCalls.delete(socket.id);
        } else {
            // Just remove from active calls if no partner
            activeCalls.delete(socket.id);
        }

        // Remove self from queues
        removeUserFromQueues(socket.id);

        console.log(`Active calls after end: ${activeCalls.size}, Queue - Chat: ${chatQueue.length}, Video: ${videoQueue.length}`);

        // Proactively scan after call ends
        scanQueueForMatches(io);
    });

    // Handle Disconnect during handshake
    socket.on('disconnect', () => {
        const roomId = userPendingMatch.get(socket.id);
        if (roomId) {
            const pending = pendingMatches.get(roomId);
            if (pending) {
                const otherId = pending.pair.find(id => id !== socket.id);
                if (otherId) io.to(otherId).emit('match-cancelled', { reason: 'partner-disconnected' });
                clearTimeout(pending.timeout);
                pendingMatches.delete(roomId);
                pending.pair.forEach(sid => userPendingMatch.delete(sid));
            }
        }

        // Final cleanup and scan
        scanQueueForMatches(io);
    });
};
