import { Server, Socket } from 'socket.io';
import { register as registerFriendsEvents } from './friends.service';

export const register = (io: Server, socket: Socket): void => {
    registerFriendsEvents(io, socket);
};
