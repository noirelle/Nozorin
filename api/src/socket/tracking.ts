import { Server, Socket } from 'socket.io';
import { historyService, SessionStart } from '../modules/history/history.service';
import { getUserIdFromToken } from '../core/utils/jwt.utils';
import { connectedUsers, activeCalls } from './users';
import { v4 as uuidv4 } from 'uuid';

// Track active sessions: socketId -> { userId, sessionId, partnerId }
const activeSessions = new Map<string, {
    userId: string;
    sessionId: string;
    partnerId: string;
    mode: 'chat' | 'voice';
}>();

import { userService } from '../modules/user/user.service';
import { broadcastUserStatus } from './status';

/**
 * Handle session tracking for history
 */
export const handleUserTracking = (io: Server, socket: Socket) => {

    /**
     * Identify user with their visitor token
     */
    socket.on('user-identify', async (data: { token: string }) => {
        const { token } = data;
        if (!token) return;

        const userId = getUserIdFromToken(token);
        if (!userId) {
            socket.emit('auth-error', { message: 'Invalid or expired token' });
            return;
        }

        // No conflict, proceed with identification
        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);
        console.log(`[TRACKING] Identified user ${userId.substring(0, 8)}... for socket ${socket.id}`);

        // Broadcast that this user is now online
        await broadcastUserStatus(io, userId);

        // Notify the socket that identification succeeded (used by reconnect flow)
        socket.emit('identify-success', { userId });
    });

    /**
     * Forcefully take over a session from another tab/device 
     */
    socket.on('force-reconnect', async (data: { token: string }) => {
        const { token } = data;
        if (!token) return;

        const userId = getUserIdFromToken(token);
        if (!userId) return;

        console.log(`[TRACKING] Force reconnect request from ${socket.id} for user ${userId.substring(0, 8)}...`);

        // Use the atomic setUserForSocket which returns the old ID
        const oldSocketId = userService.setUserForSocket(socket.id, userId);

        if (oldSocketId && oldSocketId !== socket.id) {
            console.log(`[TRACKING] Kicking old session ${oldSocketId} for user ${userId.substring(0, 8)}...`);
            io.to(oldSocketId).emit('multi-session', { message: 'You have been disconnected because a new session was started elsewhere.' });

            const oldSocket = io.sockets.sockets.get(oldSocketId);
            if (oldSocket) {
                oldSocket.disconnect(true);
            }
        }

        await userService.registerUser(userId);
        await broadcastUserStatus(io, userId);

        // Notify the new socket that they are now the primary session
        socket.emit('identify-success', { userId });
    });

    /**
     * Track when a match is established
     */
    socket.on('match-established', async (data: {
        token: string;
        partnerId: string; // partner socket id
        mode: 'chat' | 'voice';
    }) => {
        const { token, partnerId, mode } = data;

        if (!token) {
            console.warn('[TRACKING] No token provided for match-established');
            return;
        }

        const userId = getUserIdFromToken(token);
        if (!userId) {
            console.warn('[TRACKING] Invalid token for match-established');
            return;
        }

        // Map self if not already mapped
        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);

        const userInfo = connectedUsers.get(socket.id);
        const partnerInfo = connectedUsers.get(partnerId);

        if (!userInfo || !partnerInfo) {
            console.warn('[TRACKING] User or partner info not found');
            return;
        }

        // Find partner's userId
        const partnerUserId = userService.getUserId(partnerId);
        if (!partnerUserId) {
            console.warn(`[TRACKING] Partner userId not found for socket ${partnerId}`);
            // Note: In some race conditions, partner might not have identified yet.
            // For now, we'll use partnerId (socketId) as fallback or just wait for the identify event.
            // But usually, identify happens on connection.
        }

        const sessionId = uuidv4();

        // Store active session
        activeSessions.set(socket.id, {
            userId,
            sessionId,
            partnerId,
            mode,
        });

        // Start tracking in history service
        const sessionData: SessionStart = {
            sessionId,
            partnerId: partnerUserId || 'unknown',
            country: userInfo.country,
            countryCode: userInfo.countryCode,
            partnerCountry: partnerInfo.country,
            partnerCountryCode: partnerInfo.countryCode,
            mode,
        };

        try {
            await historyService.startSession(userId, sessionData);
            console.log(`[TRACKING] Started session ${sessionId.substring(0, 8)}... for user ${userId.substring(0, 8)}... with partner ${partnerUserId?.substring(0, 8) || 'unknown'}`);
        } catch (error) {
            console.error('[TRACKING] Error starting session:', error);
        }
    });

    /**
     * Track when a session ends
     */
    socket.on('session-end', async (data: {
        token: string;
        reason?: 'user-action' | 'partner-disconnect' | 'error' | 'skip' | 'network' | 'answered-another';
    }) => {
        const { token, reason } = data;

        if (!token) {
            console.warn('[TRACKING] No token provided for session-end');
            return;
        }

        const userId = getUserIdFromToken(token);
        if (!userId) {
            console.warn('[TRACKING] Invalid token for session-end');
            return;
        }

        const activeSession = activeSessions.get(socket.id);
        if (!activeSession) {
            console.warn('[TRACKING] No active session found for socket:', socket.id);
            return;
        }

        try {
            await historyService.endSession(userId, reason);
            activeSessions.delete(socket.id);
            console.log(`[TRACKING] Ended session for user ${userId.substring(0, 8)}..., reason: ${reason || 'user-action'}`);
        } catch (error) {
            console.error('[TRACKING] Error ending session:', error);
        }
    });
};

/**
 * Clean up session on disconnect
 */
export const cleanupUserSession = async (socketId: string, token?: string) => {
    const activeSession = activeSessions.get(socketId);

    if (!activeSession) {
        return; // No active session to clean up
    }

    const { userId } = activeSession;

    try {
        await historyService.endSession(userId, 'partner-disconnect');
        activeSessions.delete(socketId);
        console.log(`[TRACKING] Cleaned up session for disconnected user ${userId.substring(0, 8)}...`);
    } catch (error) {
        console.error('[TRACKING] Error cleaning up session:', error);
    }
};

// Export for use in other modules
export { activeSessions };
