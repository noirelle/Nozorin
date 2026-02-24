import { Server, Socket } from 'socket.io';
import { register as registerController } from './call.controller';
import { callService } from './call.service';

export const register = (io: Server, socket: Socket) => {
    registerController(io, socket);
};

export const handleDisconnect = async (io: Server, socket: Socket) => {
    callService.handleDisconnect(io, socket.id);
};

export * from './call.store';
export * from './call.service';
