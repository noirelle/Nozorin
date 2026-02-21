
import { Server } from 'socket.io';
import { PendingReconnect } from './matchmaking.types';
import { CONSTANTS } from './matchmaking.constants';
import { QueueManager, setFallbackTimeout, clearFallbackTimeout, userPendingMatch } from './matchmaking.queue';
import { activeCalls } from '../../socket/store/socket.store';
import { userService } from '../user/user.service';
import { setMatchCooldown } from './matchmaking.cooldowns';
import { handleMatchFailure } from './matchmaking.rooms';

export const pendingReconnects = new Map<string, PendingReconnect>(); // disconnectedUserId -> PendingReconnect

/**
 * Cancel a pending reconnect (called when the partner or system cancels)
 */
export const cancelPendingReconnect = (io: Server, userId: string, reason: string = 'cancelled', scanQueueCallback: (io: Server) => void) => {
    const pending = pendingReconnects.get(userId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    pendingReconnects.delete(userId);

    setMatchCooldown(userId, pending.partnerUserId);
    io.to(pending.partnerSocketId).emit('call-ended', { by: userId, reason });
    activeCalls.delete(pending.partnerSocketId);

    console.log(`[MATCH] Reconnect cancelled for ${userId.substring(0, 8)}... reason: ${reason}`);
    scanQueueCallback(io);
};

/**
 * When the waiting partner takes any action (end-call, stop-searching, find-match),
 * terminate any pending reconnect where they are the partner.
 * This prevents the disconnected user from rejoining a dead room.
 */
export const cleanupPendingReconnectsForPartner = (io: Server, socketId: string, scanQueueCallback: (io: Server) => void) => {
    for (const [disconnectedUserId, pending] of pendingReconnects.entries()) {
        if (pending.partnerSocketId === socketId) {
            cancelPendingReconnect(io, disconnectedUserId, 'partner-left', scanQueueCallback);
            return; // Each socket can only be partner in at most one pending reconnect
        }
    }
};

export const handleMatchmakingDisconnect = (io: Server, socketId: string, scanQueueCallback: (io: Server) => void, explicitUserId?: string) => {
    QueueManager.remove(socketId);

    const roomId = userPendingMatch.get(socketId);
    if (roomId) handleMatchFailure(io, roomId, 'partner-disconnected', scanQueueCallback);

    clearFallbackTimeout(socketId);

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

                scanQueueCallback(io);
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

    scanQueueCallback(io);
};
