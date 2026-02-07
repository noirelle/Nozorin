
import { Server, Socket } from 'socket.io';
import { handleSocketConnection } from '../controllers/socketController';

export const setupSocketIO = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        handleSocketConnection(io, socket);
    });
};
