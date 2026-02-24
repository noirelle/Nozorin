import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { getUserIdFromToken } from '../../core/utils/jwt.utils';
import { userService } from '../../shared/services/user.service';
import { historyService } from '../history/history.service';
import { presenceService } from '../presence/presence.service';
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
    activeSessions.delete(socketId);
    logger.info({ userId: session.userId.substring(0, 8) }, '[TRACKING] Session cleaned up on disconnect');
};

export const register = (io: Server, socket: Socket): void => {

    socket.on(SocketEvents.MATCH_ESTABLISHED, async (data: { token: string; partnerId: string; mode: 'chat' | 'voice' }) => {
        const { token, partnerId, mode } = data;
        if (!token) return;
        const userId = getUserIdFromToken(token);
        if (!userId) return;

        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);

        const sessionId = uuidv4();
        activeSessions.set(socket.id, { userId, sessionId, partnerId, mode });
        logger.info({ sessionId: sessionId.substring(0, 8), userId: userId.substring(0, 8) }, '[TRACKING] Session tracked');
    });

    socket.on(SocketEvents.SESSION_END, async (data: { token: string; reason?: string }) => {
        const { token, reason } = data;
        if (!token) return;
        const userId = getUserIdFromToken(token);
        if (!userId) return;

        const session = activeSessions.get(socket.id);
        if (!session) return;

        activeSessions.delete(socket.id);
        logger.info({ userId: userId.substring(0, 8), reason }, '[TRACKING] Session tracked end');
    });
};
