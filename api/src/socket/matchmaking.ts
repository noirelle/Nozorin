
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

// Helper to check if two users are compatible for matching
const areUsersCompatible = (userA: User, userB: User) => {
    // Check if A matches B's criteria
    const aSatisfied = !userA.preferredCountry || userA.preferredCountry === userB.countryCode;
    // Check if B matches A's criteria
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

    socket.on('find-match', (data: { mode: 'chat' | 'video', preferredCountry?: string }) => {
        // Mark user as active if not already
        if (!activeUsers.has(socket.id)) {
            activeUsers.add(socket.id);
            statsService.incrementOnlineUsers();
            io.emit('stats-update', statsService.getStats());
        }

        const mode = data.mode;

        // Ensure not already in a call - if so, end it
        const existingPartnerId = activeCalls.get(socket.id);
        if (existingPartnerId) {
            console.log(`[MATCH] Ending existing call with ${existingPartnerId} before searching`);
            io.to(existingPartnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(existingPartnerId);
            activeCalls.delete(socket.id);
        }

        removeUserFromQueues(socket.id); // Ensure not in multiple queues

        const preferredCountry = data.preferredCountry === 'GLOBAL' ? undefined : data.preferredCountry;
        console.log(`[MATCH] User ${socket.id} looking for ${mode} match${preferredCountry ? ` in ${preferredCountry}` : ''}`);

        let targetQueue = mode === 'chat' ? chatQueue : videoQueue;

        // Matchmaking Logic
        let match: { partner: User, index: number } | null = null;

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

        // 1. First Attempt: Try to find a match with current preference (if any)
        if (targetQueue.length > 0) {
            match = findMatchInQueue(targetQueue, currentUser);
        }

        // 2. Logic: If no match with preference, check if we should wait or fallback
        let shouldWait = false;

        if (!match && preferredCountry) {
            // Preference was set but no one in queue matched.

            // Check if anyone from that country is active/online
            const isSomeoneOnline = Array.from(activeUsers).some(id => {
                const info = connectedUsers.get(id);
                return info && info.countryCode === preferredCountry && id !== socket.id;
            });

            if (isSomeoneOnline) {
                shouldWait = true;
                console.log(`[MATCH] No match in queue, but user from ${preferredCountry} is online. Waiting...`);
            } else {
                console.log(`[MATCH] No match in queue and no one from ${preferredCountry} is online. Fallback to global.`);

                // Update current user to remove preference
                currentUser.preferredCountry = undefined;

                // Retry matching with no preference immediately
                if (targetQueue.length > 0) {
                    match = findMatchInQueue(targetQueue, currentUser);
                }
            }
        }

        if (match && match.partner && match.partner.id !== socket.id) {
            const { partner, index } = match;
            targetQueue.splice(index, 1); // Remove partner from queue

            const roomId = `room-${partner.id}-${socket.id}`;

            // Track the active connection
            activeCalls.set(socket.id, partner.id);
            activeCalls.set(partner.id, socket.id);

            // Join both users to the room
            socket.join(roomId);

            console.log(`[MATCH] ✓ Matched ${socket.id} with ${partner.id} in ${mode} mode`);

            // Get media states
            const joiningUserMediaState = userMediaState.get(socket.id) || { isMuted: false, isCameraOff: false };
            const waitingUserMediaState = userMediaState.get(partner.id) || { isMuted: false, isCameraOff: false };

            const joiningUserInfo = connectedUsers.get(socket.id);
            const waitingUserInfo = connectedUsers.get(partner.id);

            // Notify Waiting User
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

            // Notify Joining User
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

            // Track successful connection
            statsService.incrementDailyChats();
            statsService.incrementTotalConnections();
            io.emit('stats-update', statsService.getStats());

            console.log(`[MATCH] Queue sizes - Chat: ${chatQueue.length}, Video: ${videoQueue.length}`);
            return;
        }

        // 3. No match found -> Add to queue

        // If waiting with preference (shouldWait is true), use original pref. Otherwise undefined.
        const userToAdd: User = {
            ...currentUser,
            preferredCountry: shouldWait ? preferredCountry : undefined
        };

        if (mode === 'chat') {
            chatQueue.push(userToAdd);
        } else {
            videoQueue.push(userToAdd);
        }

        console.log(`[MATCH] User ${socket.id} added to ${mode} queue. Position: ${targetQueue.length}. Preference: ${userToAdd.preferredCountry || 'None'}`);
        socket.emit('waiting-for-match', { position: targetQueue.length });

        // If waiting with preference, set timeout to fallback
        if (shouldWait) {
            setTimeout(() => {
                // Check if user is still in queue
                const q = mode === 'chat' ? chatQueue : videoQueue;
                const idx = q.findIndex(u => u.id === socket.id);
                if (idx !== -1) {
                    const u = q[idx];
                    if (u.preferredCountry) {
                        console.log(`[MATCH] Timeout for ${u.id} waiting for ${u.preferredCountry}. Falling back to global.`);
                        u.preferredCountry = undefined; // Remove preference
                        // Available for others to pick up
                    }
                }
            }, 5000);
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
