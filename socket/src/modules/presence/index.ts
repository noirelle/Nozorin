import { Server, Socket } from 'socket.io';
import { register as registerPresenceEvents, presenceService } from './presence.service';

export { presenceService };

/** Register all presence socket events for this connection */
export const register = (io: Server, socket: Socket): void => {
    presenceService.handleConnection(io, socket);
    registerPresenceEvents(io, socket);
};

export const handleDisconnect = async (io: Server, socket: Socket): Promise<void> => {
    presenceService.handleDisconnection(io, socket);
};
