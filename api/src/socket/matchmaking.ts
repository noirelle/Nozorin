
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
    // 1. Check if they were just matched (prevent loops)
    const userIdA = userService.getUserId(userA.id);
    const userIdB = userService.getUserId(userB.id);

    if (userIdA && userIdB) {
        if (lastPartnerMap.get(userIdA) === userIdB || lastPartnerMap.get(userIdB) === userIdA) {
            return false;
        }
    }

    // 2. Check if A matches B's criteria
    const aSatisfied = !userA.preferredCountry || userA.preferredCountry === userB.countryCode;
    // 3. Check if B matches A's criteria
    const bSatisfied = !userB.preferredCountry || userB.preferredCountry === userA.countryCode;

    return aSatisfied && bSatisfied;
};

// Helper to find a compatible match in the queue
const findMatchInQueue = (queue: User[], currentUser: User): { partner: User, index: number } | null => {
    for (let i = 0; i < queue.length; i++) {
        const potentialPartner = queue[i];
        if (potentialPartner.id === currentUser.id) continue;
        if (areUsersCompatible(currentUser, potentialPartner)) {
            return { partner: potentialPartner, index: i };
        }
    }
    return null;
};

// Initiate handshake between two users
const initiateHandshake = (io: Server, userAId: string, userBId: string, mode: 'chat' | 'video') => {
    const roomId = `room-${userAId}-${userBId}`;

    // Track the last partner to prevent immediate re-matching
    const userIdA = userService.getUserId(userAId);
    const userIdB = userService.getUserId(userBId);
    if (userIdA && userIdB) {
        lastPartnerMap.set(userIdA, userIdB);
        lastPartnerMap.set(userIdB, userIdA);

        // Clear the "loop prevention" after 5 seconds to allow re-matching later
        setTimeout(() => {
            if (lastPartnerMap.get(userIdA) === userIdB) lastPartnerMap.delete(userIdA);
            if (lastPartnerMap.get(userIdB) === userIdA) lastPartnerMap.delete(userIdB);

            // Proactively trigger a queue scan after cooldown expires to handle stuck pairs
            scanQueueForMatches(io);
        }, 5000);
    }

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
        }
    }, 8000);

    pendingMatches.set(roomId, {
        pair: [userAId, userBId],
        mode,
        startTime,
        acks: new Set(),
        timeout,
        roomId
    });

    userPendingMatch.set(userAId, roomId);
    userPendingMatch.set(userBId, roomId);

    const infoA = connectedUsers.get(userAId);
    const infoB = connectedUsers.get(userBId);

    // Notify both to prepare
    io.to(userBId).emit('prepare-match', {
        partnerCountry: infoA?.country,
        partnerCountryCode: infoA?.countryCode,
    });
    io.to(userAId).emit('prepare-match', {
        partnerCountry: infoB?.country,
        partnerCountryCode: infoB?.countryCode,
    });

    console.log(`[MATCH] Handshake started for ${userAId} and ${userBId}`);
};

// Scan queues for potential matches
export const scanQueueForMatches = (io: Server) => {
    ['chat', 'video'].forEach(m => {
        const mode = m as 'chat' | 'video';
        const queue = mode === 'chat' ? chatQueue : videoQueue;

        let i = 0;
        while (i < queue.length) {
            const user = queue[i];
            const result = findMatchInQueue(queue, user);

            if (result) {
                // Found a match within the queue!
                const partner = result.partner;
                const partnerIdx = result.index;

                // Remove both (be careful with indices)
                // Remove the one further in the queue first
                const indices = [i, partnerIdx].sort((a, b) => b - a);
                queue.splice(indices[0], 1);
                queue.splice(indices[1], 1);

                initiateHandshake(io, user.id, partner.id, mode);
                // After finding a match, indices are shifted, just restart or keep processing
                // For simplicity, we restart scan for this mode after reduction
                i = 0;
                continue;
            }
            i++;
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
    };

    socket.on('find-match', async (data: { mode: 'chat' | 'video', preferredCountry?: string }) => {
        // Mark user as active if not already
        if (!activeUsers.has(socket.id)) {
            activeUsers.add(socket.id);
            statsService.incrementOnlineUsers();
            io.emit('stats-update', statsService.getStats());
        }
        const mode = data.mode;

        // Safety check: ensure user is not already being processed or already in queue
        removeUserFromQueues(socket.id);

        // Ensure not already in an active call on the server side
        const existingPartnerId = activeCalls.get(socket.id);
        if (existingPartnerId) {
            console.log(`[MATCH] Ending existing call with ${existingPartnerId} before searching`);
            io.to(existingPartnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(existingPartnerId);
            activeCalls.delete(socket.id);
        }

        // Cleanup any pending match if user starts a new search during handshake
        const pendingRoomId = userPendingMatch.get(socket.id);
        if (pendingRoomId) {
            console.log(`[MATCH] User ${socket.id} started new search during handshake for ${pendingRoomId}. Cancelling old match.`);
            handleMatchFailure(pendingRoomId, 'partner-left');
        }

        const preferredCountry = data.preferredCountry === 'GLOBAL' ? undefined : data.preferredCountry;

        // Get user info (country) from connected state
        const userInfo = connectedUsers.get(socket.id);
        if (!userInfo) {
            console.warn(`[MATCH] User info not found for ${socket.id}`);
            return;
        }

        const currentUser: User = {
            id: socket.id,
            country: userInfo.country,
            countryCode: userInfo.countryCode,
            mode: mode,
            preferredCountry: preferredCountry
        };

        const targetQueue = mode === 'chat' ? chatQueue : videoQueue;

        // Matchmaking Logic
        let match = findMatchInQueue(targetQueue, currentUser);

        // If no match with preference, check if we should wait or fallback
        let shouldWait = false;
        if (!match && preferredCountry) {
            // Check if anyone from that country is active
            const isSomeoneOnline = Array.from(activeUsers).some(id => {
                const info = connectedUsers.get(id);
                return info && info.countryCode === preferredCountry && id !== socket.id;
            });

            if (isSomeoneOnline) {
                shouldWait = true;
            } else {
                // Fallback to global search immediately
                currentUser.preferredCountry = undefined;
                match = findMatchInQueue(targetQueue, currentUser);
            }
        }

        if (match && match.partner && match.partner.id !== socket.id) {
            const { partner, index } = match;
            targetQueue.splice(index, 1); // Remove partner from queue
            initiateHandshake(io, socket.id, partner.id, mode);
            return;
        }

        // Add to queue
        const userToAdd: User = {
            ...currentUser,
            preferredCountry: shouldWait ? preferredCountry : undefined
        };

        if (mode === 'chat') {
            chatQueue.push(userToAdd);
        } else {
            videoQueue.push(userToAdd);
        }

        socket.emit('waiting-for-match', { position: targetQueue.length });

        // Handle preference timeout
        if (shouldWait) {
            setTimeout(() => {
                const q = mode === 'chat' ? chatQueue : videoQueue;
                const idx = q.findIndex(u => u.id === socket.id);
                if (idx !== -1 && q[idx].preferredCountry) {
                    q[idx].preferredCountry = undefined;
                    console.log(`[MATCH] Timeout for ${socket.id}, falling back to GLOBAL`);
                }
            }, 8000); // 8 seconds for preference
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
    });
};
