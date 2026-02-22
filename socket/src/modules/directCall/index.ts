import { Server, Socket } from 'socket.io';
import { register as registerDirectCallEvents } from './directCall.service';

export const register = (io: Server, socket: Socket): void => {
    registerDirectCallEvents(io, socket);
};
