
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
        if (areUsersCompatible(currentUser, potentialPartner)) {
            return { partner: potentialPartner, index: i };
        }
    }
    return null;
};

export const handleMatchmaking = (io: Server, socket: Socket) => {

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
            // Check if anyone from that country is active (using userService for O(1) check would be better but let's stick to current structure)
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

            const roomId = `room-${partner.id}-${socket.id}`;

            // Track the last partner to prevent immediate re-matching
            const userId = userService.getUserId(socket.id);
            const partnerUserId = userService.getUserId(partner.id);
            if (userId && partnerUserId) {
                lastPartnerMap.set(userId, partnerUserId);
                lastPartnerMap.set(partnerUserId, userId);

                // Clear the "loop prevention" after 10 seconds to allow re-matching later
                setTimeout(() => {
                    if (lastPartnerMap.get(userId) === partnerUserId) lastPartnerMap.delete(userId);
                    if (lastPartnerMap.get(partnerUserId) === userId) lastPartnerMap.delete(partnerUserId);
                }, 10000);
            }

            // Track active calls
            activeCalls.set(socket.id, partner.id);
            activeCalls.set(partner.id, socket.id);

            // ... (rest of match success logic: notify users, join rooms, etc.) ...
            socket.join(roomId);
            console.log(`[MATCH] ✓ Matched ${socket.id} with ${partner.id} in ${mode} mode`);

            const joiningUserMediaState = userMediaState.get(socket.id) || { isMuted: false, isCameraOff: false };
            const waitingUserMediaState = userMediaState.get(partner.id) || { isMuted: false, isCameraOff: false };

            const joiningUserInfo = connectedUsers.get(socket.id);
            const waitingUserInfo = connectedUsers.get(partner.id);

            io.to(partner.id).emit('match-found', {
                role: 'offerer',
                partnerId: socket.id,
                partnerCountry: joiningUserInfo?.country,
                partnerCountryCode: joiningUserInfo?.countryCode,
                partnerIsMuted: joiningUserMediaState.isMuted,
                partnerIsCameraOff: joiningUserMediaState.isCameraOff,
                roomId,
                mode,
            });

            socket.emit('match-found', {
                role: 'answerer',
                partnerId: partner.id,
                partnerCountry: waitingUserInfo?.country,
                partnerCountryCode: waitingUserInfo?.countryCode,
                partnerIsMuted: waitingUserMediaState.isMuted,
                partnerIsCameraOff: waitingUserMediaState.isCameraOff,
                roomId,
                mode,
            });

            statsService.incrementDailyChats();
            statsService.incrementTotalConnections();
            io.emit('stats-update', statsService.getStats());
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

    // Stop searching (cancel finding a match)
    socket.on('stop-searching', () => {
        console.log(`[STOP] User ${socket.id} stopped searching`);
        removeUserFromQueues(socket.id);
        console.log(`[STOP] Queue after stop - Chat: ${chatQueue.length}, Video: ${videoQueue.length}`);
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
};
