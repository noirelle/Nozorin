import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../socket.events';
import { historyService, SessionStart } from '../../modules/history/history.service';
import { getUserIdFromToken } from '../../core/utils/jwt.utils';
import { userService } from '../../modules/user/user.service';
import { getConnectedUser } from '../store/socket.store';
import { broadcastUserStatus } from './status.handler';
import { v4 as uuidv4 } from 'uuid';

// Track active sessions: socketId → { userId, sessionId, partnerId, mode }
const activeSessions = new Map<string, {
    userId: string;
    sessionId: string;
    partnerId: string;
    mode: 'chat' | 'voice';
}>();

/**
 * Handle session tracking for history
 */
export const handleUserTracking = (io: Server, socket: Socket) => {
    /**
     * Identify user with their visitor token
     */
    socket.on(SocketEvents.USER_IDENTIFY, async (data: { token: string }) => {
        const { token } = data;
        if (!token) return;

        const userId = getUserIdFromToken(token);
        if (!userId) {
            socket.emit(SocketEvents.AUTH_ERROR, { message: 'Invalid or expired token' });
            return;
        }

        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);
        console.log(`[TRACKING] Identified user ${userId.substring(0, 8)}... for socket ${socket.id}`);

        await broadcastUserStatus(io, userId);
        socket.emit(SocketEvents.IDENTIFY_SUCCESS, { userId });
    });

    /**
     * Seamlessly update token for existing connection
     */
    socket.on(SocketEvents.UPDATE_TOKEN, async (data: { token: string }) => {
        const { token } = data;
        if (!token) return;

        const userId = getUserIdFromToken(token);
        if (!userId) {
            console.warn(`[TRACKING] Invalid token provided for update-token from ${socket.id}`);
            socket.emit(SocketEvents.AUTH_ERROR, { message: 'Invalid token during update' });
            return;
        }

        console.log(`[TRACKING] Updating token/session for user ${userId.substring(0, 8)}... on socket ${socket.id}`);
        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);
        socket.emit(SocketEvents.TOKEN_UPDATED, { success: true, userId });
    });

    /**
     * Forcefully take over a session from another tab/device
     */
    socket.on(SocketEvents.FORCE_RECONNECT, async (data: { token: string }) => {
        const { token } = data;
        if (!token) return;

        const userId = getUserIdFromToken(token);
        if (!userId) return;

        console.log(`[TRACKING] Force reconnect request from ${socket.id} for user ${userId.substring(0, 8)}...`);

        const oldSocketId = userService.setUserForSocket(socket.id, userId);

        if (oldSocketId && oldSocketId !== socket.id) {
            console.log(`[TRACKING] Kicking old session ${oldSocketId} for user ${userId.substring(0, 8)}...`);
            io.to(oldSocketId).emit(SocketEvents.MULTI_SESSION, {
                message: 'You have been disconnected because a new session was started elsewhere.',
            });

            const oldSocket = io.sockets.sockets.get(oldSocketId);
            if (oldSocket) oldSocket.disconnect(true);
        }

        await userService.registerUser(userId);
        await broadcastUserStatus(io, userId);
        socket.emit(SocketEvents.IDENTIFY_SUCCESS, { userId });
    });

    /**
     * Track when a match is established
     */
    socket.on(SocketEvents.MATCH_ESTABLISHED, async (data: {
        token: string;
        partnerId: string;
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

        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);

        const userInfo = getConnectedUser(socket.id);
        const partnerInfo = getConnectedUser(partnerId);

        if (!userInfo || !partnerInfo) {
            console.warn('[TRACKING] User or partner info not found');
            return;
        }

        const partnerUserId = userService.getUserId(partnerId);
        if (!partnerUserId) {
            console.warn(`[TRACKING] Partner userId not found for socket ${partnerId}`);
        }

        const sessionId = uuidv4();

        activeSessions.set(socket.id, { userId, sessionId, partnerId, mode });

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
    socket.on(SocketEvents.SESSION_END, async (data: {
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
export const cleanupUserSession = async (socketId: string) => {
    const activeSession = activeSessions.get(socketId);
    if (!activeSession) return;

    const { userId } = activeSession;

    try {
        await historyService.endSession(userId, 'partner-disconnect');
        activeSessions.delete(socketId);
        console.log(`[TRACKING] Cleaned up session for disconnected user ${userId.substring(0, 8)}...`);
    } catch (error) {
        console.error('[TRACKING] Error cleaning up session:', error);
    }
};

export { activeSessions };
