import { Server, Socket } from 'socket.io';
import { register as registerController } from './auth.controller';

export const register = (io: Server, socket: Socket) => {
    registerController(io, socket);
};

export * from './auth.service';
