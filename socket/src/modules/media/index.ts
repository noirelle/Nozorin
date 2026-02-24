import { Server, Socket } from 'socket.io';
import { register as registerMediaEvents } from './media.service';
import { userMediaState } from './media.store';

export { userMediaState };

export const register = (io: Server, socket: Socket): void => {
    // Initialize media state on connect
    userMediaState.set(socket.id, { isMuted: false });
    registerMediaEvents(io, socket);
};

export const handleDisconnect = async (io: Server, socket: Socket): Promise<void> => {
    userMediaState.delete(socket.id);
};
