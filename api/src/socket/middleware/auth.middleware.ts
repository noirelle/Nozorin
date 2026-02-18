import { Socket } from 'socket.io';
import { verifyVisitorToken, verifyRefreshToken } from '../../core/utils/jwt.utils';

export interface AuthenticatedSocket extends Socket {
    data: {
        user?: {
            userId: string;
            userType: string;
        };
        [key: string]: any;
    };
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
        // Allow unauthenticated connection (guest/home page)
        // Mark as guest in socket data for later reference if needed
        socket.data.isGuest = true;
        return next();
    }

    // Try verifying as visitor token first (most common)
    const visitorPayload = verifyVisitorToken(token as string);
    if (visitorPayload) {
        socket.data.user = {
            userId: visitorPayload.userId,
            userType: visitorPayload.userType,
        };
        return next();
    }

    // If not visitor, maybe refresh token? (Less likely for socket, but possible)
    const refreshPayload = verifyRefreshToken(token as string);
    if (refreshPayload) {
        socket.data.user = {
            userId: refreshPayload.userId,
            userType: 'authenticated', // pending distinction
        };
        return next();
    }

    return next(new Error('Authentication error: Invalid token'));
};
