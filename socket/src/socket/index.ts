import { Server } from 'socket.io';
import { socketAuthMiddleware } from './middleware/auth.middleware';
import { handleSocketConnection } from './connection/connection';

export const bootstrapSocket = (io: Server): void => {
    io.use((socket, next) => {
        socketAuthMiddleware(socket as any, next);
    });

    io.on('connection', (socket) => {
        handleSocketConnection(io, socket);
    });
};
