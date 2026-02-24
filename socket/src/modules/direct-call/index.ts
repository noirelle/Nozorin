import { Server, Socket } from 'socket.io';
import { register as registerDirectCallEvents } from './direct-call.service';

export const register = (io: Server, socket: Socket): void => {
    registerDirectCallEvents(io, socket);
};
