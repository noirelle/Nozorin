import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { getUserIdFromToken } from '../../core/utils/jwt.utils';
import { userService } from '../../shared/services/user.service';
import { historyService } from '../history/history.service';
import { statusService } from '../status/status.service';
import { activeSessions } from './tracking.store';
import { logger } from '../../core/logger';
import { v4 as uuidv4 } from 'uuid';

// connected user geo info — lightweight per-socket store
const connectedUsers = new Map<string, { country: string; countryCode: string }>();

export const addConnectedUser = (socketId: string, info: { country: string; countryCode: string }): void => {
    connectedUsers.set(socketId, info);
};

export const getConnectedUser = (socketId: string) => connectedUsers.get(socketId);

export const removeConnectedUser = (socketId: string): void => {
    connectedUsers.delete(socketId);
};

export const cleanupUserSession = async (socketId: string): Promise<void> => {
    const session = activeSessions.get(socketId);
    if (!session) return;
    try {
        await historyService.endSession(session.userId, 'partner-disconnect');
        activeSessions.delete(socketId);
        logger.info({ userId: session.userId.substring(0, 8) }, '[TRACKING] Session cleaned up on disconnect');
    } catch (err) {
        logger.error({ err }, '[TRACKING] Failed to clean up session');
    }
};

export const register = (io: Server, socket: Socket): void => {
    socket.on(SocketEvents.USER_IDENTIFY, async (data: { token: string }) => {
        const { token } = data;
        if (!token) return;
        const userId = getUserIdFromToken(token);
        if (!userId) { socket.emit(SocketEvents.AUTH_ERROR, { message: 'Invalid or expired token' }); return; }

        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);
        logger.info({ socketId: socket.id, userId: userId.substring(0, 8) }, '[TRACKING] User identified');
        await statusService.broadcastUserStatus(io, userId);
        socket.emit(SocketEvents.IDENTIFY_SUCCESS, { userId });
    });

    socket.on(SocketEvents.UPDATE_TOKEN, async (data: { token: string }) => {
        const { token } = data;
        if (!token) return;
        const userId = getUserIdFromToken(token);
        if (!userId) { socket.emit(SocketEvents.AUTH_ERROR, { message: 'Invalid token during update' }); return; }

        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);
        socket.emit(SocketEvents.TOKEN_UPDATED, { success: true, userId });
    });

    socket.on(SocketEvents.FORCE_RECONNECT, async (data: { token: string }) => {
        const { token } = data;
        if (!token) return;
        const userId = getUserIdFromToken(token);
        if (!userId) return;

        const oldSocketId = userService.setUserForSocket(socket.id, userId);
        if (oldSocketId && oldSocketId !== socket.id) {
            io.to(oldSocketId).emit(SocketEvents.MULTI_SESSION, { message: 'You have been disconnected because a new session was started elsewhere.' });
            const oldSocket = io.sockets.sockets.get(oldSocketId);
            if (oldSocket) oldSocket.disconnect(true);
        }
        await userService.registerUser(userId);
        await statusService.broadcastUserStatus(io, userId);
        socket.emit(SocketEvents.IDENTIFY_SUCCESS, { userId });
    });

    socket.on(SocketEvents.MATCH_ESTABLISHED, async (data: { token: string; partnerId: string; mode: 'chat' | 'voice' }) => {
        const { token, partnerId, mode } = data;
        if (!token) return;
        const userId = getUserIdFromToken(token);
        if (!userId) return;

        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);

        const userInfo = getConnectedUser(socket.id);
        const partnerInfo = getConnectedUser(partnerId);
        const partnerUserId = userService.getUserId(partnerId);
        const sessionId = uuidv4();

        activeSessions.set(socket.id, { userId, sessionId, partnerId, mode });

        try {
            await historyService.startSession(userId, {
                sessionId,
                partnerId: partnerUserId || 'unknown',
                country: userInfo?.country,
                countryCode: userInfo?.countryCode,
                partnerCountry: partnerInfo?.country,
                partnerCountryCode: partnerInfo?.countryCode,
                mode,
            });
            logger.info({ sessionId: sessionId.substring(0, 8), userId: userId.substring(0, 8) }, '[TRACKING] Session started');
        } catch (err) {
            logger.error({ err }, '[TRACKING] Failed to start session');
        }
    });

    socket.on(SocketEvents.SESSION_END, async (data: { token: string; reason?: string }) => {
        const { token, reason } = data;
        if (!token) return;
        const userId = getUserIdFromToken(token);
        if (!userId) return;

        const session = activeSessions.get(socket.id);
        if (!session) return;

        try {
            await historyService.endSession(userId, reason);
            activeSessions.delete(socket.id);
            logger.info({ userId: userId.substring(0, 8), reason }, '[TRACKING] Session ended');
        } catch (err) {
            logger.error({ err }, '[TRACKING] Failed to end session');
        }
    });
};
