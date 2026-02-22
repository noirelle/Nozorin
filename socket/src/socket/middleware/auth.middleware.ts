import { Socket } from 'socket.io';
import { verifyVisitorToken, verifyRefreshToken } from '../../core/utils/jwt.utils';
import { logger } from '../../core/logger';

export interface AuthenticatedSocket extends Socket {
    data: {
        user?: {
            userId: string;
            userType: string;
        };
        isGuest?: boolean;
        [key: string]: unknown;
    };
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void): void => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
        socket.data.isGuest = true;
        return next();
    }

    const visitorPayload = verifyVisitorToken(token as string);
    if (visitorPayload) {
        socket.data.user = { userId: visitorPayload.userId, userType: visitorPayload.userType };
        return next();
    }

    const refreshPayload = verifyRefreshToken(token as string);
    if (refreshPayload) {
        socket.data.user = { userId: refreshPayload.userId, userType: 'authenticated' };
        return next();
    }

    logger.warn({ socketId: socket.id }, '[AUTH] Invalid token — proceeding as guest');
    socket.data.isGuest = true;
    return next();
};
