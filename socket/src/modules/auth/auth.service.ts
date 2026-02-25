import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { getUserIdFromToken } from '../../core/utils/jwt.utils';
import { userService } from '../../shared/services/user.service';
import { presenceService } from '../presence/presence.service';
import { logger } from '../../core/logger';

export const authService = {
    identify: async (io: Server, socket: Socket, token: string) => {
        if (!token) return null;
        const userId = getUserIdFromToken(token);
        if (!userId) {
            socket.emit(SocketEvents.AUTH_ERROR, { message: 'Invalid or expired token' });
            return null;
        }

        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);
        logger.info({ socket_id: socket.id, user_id: userId.substring(0, 8) }, '[AUTH] User identified');
        await presenceService.broadcastUserStatus(io, userId);
        socket.emit(SocketEvents.IDENTIFY_SUCCESS, { user_id: userId });
        return userId;
    },

    updateToken: async (socket: Socket, token: string) => {
        if (!token) return;
        const userId = getUserIdFromToken(token);
        if (!userId) {
            socket.emit(SocketEvents.AUTH_ERROR, { message: 'Invalid token during update' });
            return;
        }

        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);
        socket.emit(SocketEvents.TOKEN_UPDATED, { success: true, user_id: userId });
    },

    forceReconnect: async (io: Server, socket: Socket, token: string) => {
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
        await presenceService.broadcastUserStatus(io, userId);
        socket.emit(SocketEvents.IDENTIFY_SUCCESS, { user_id: userId });
    }
};
