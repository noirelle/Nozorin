import { Server, Socket } from 'socket.io';
import { register as registerTracking, cleanupUserSession, addConnectedUser, getConnectedUser, removeConnectedUser } from './tracking.service';

export { cleanupUserSession, addConnectedUser, getConnectedUser, removeConnectedUser };

export const register = (io: Server, socket: Socket): void => {
    registerTracking(io, socket);
};

export const handleDisconnect = async (io: Server, socket: Socket): Promise<void> => {
    await cleanupUserSession(socket.id);
};
