import { Server } from 'socket.io';
import { socketAuthMiddleware } from './middleware/auth.middleware';
import { handleSocketConnection } from './connection/connection';

/**
 * Bootstrap the Socket.IO layer.
 * Call this once after creating the `io` Server instance.
 */
export const bootstrapSocket = (io: Server): void => {
    io.use((socket, next) => {
        socketAuthMiddleware(socket as any, next);
    });

    io.on('connection', (socket) => {
        handleSocketConnection(io, socket);
    });
};
