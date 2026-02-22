import { Server, Socket } from 'socket.io';
import { register as registerChatEvents } from './chat.service';

export const register = (io: Server, socket: Socket): void => {
    registerChatEvents(io, socket);
};
