import { Server, Socket } from 'socket.io';
import { register as registerSignalingEvents } from './signaling.service';

export const register = (io: Server, socket: Socket): void => {
    registerSignalingEvents(io, socket);
};
