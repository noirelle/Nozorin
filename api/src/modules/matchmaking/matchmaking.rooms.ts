
import { Server } from 'socket.io';
import { User } from '../../shared/types/socket.types';
import { PendingMatch } from './matchmaking.types';
import { CONSTANTS } from './matchmaking.constants';
import { QueueManager, notifyQueuePositions, userPendingMatch, skipLocks } from './matchmaking.queue';
// Note: scanQueueForMatches needs to be passed in to avoid circular dependency

export const pendingMatches = new Map<string, PendingMatch>(); // roomId -> PendingMatch

export const handleMatchFailure = (io: Server, rid: string, reason: string, scanQueueCallback: (io: Server) => void) => {
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

    scanQueueCallback(io);
    notifyQueuePositions(io);
};

export const initiateHandshake = (io: Server, userA: User, userB: User, scanQueueCallback: (io: Server) => void) => {
    // ATOMIC STATE CHANGE
    userA.state = 'NEGOTIATING';
    userB.state = 'NEGOTIATING';

    const sortedIds = [userA.id, userB.id].sort();
    const roomId = `room-${sortedIds[0]}-${sortedIds[1]}-${Date.now()}`;

    // Set temporary "matched" state, but actual cooldown is set when they finish.
    // Note: This logic was in main file, we might need to export this or handle it here.
    // Ideally, setMatchCooldown should be called here or in main.
    // But initiateHandshake in valid code sets lastPartnerMap temporarily.

    const timeout = setTimeout(() => handleMatchFailure(io, roomId, 'timeout', scanQueueCallback), CONSTANTS.HANDSHAKE_TIMEOUT_MS);

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
