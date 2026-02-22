import { Server, Socket } from 'socket.io';
import { register as registerStatusEvents, statusService } from './status.service';

export { statusService };

/** Register all status socket events for this connection */
export const register = (io: Server, socket: Socket): void => {
    statusService.handleConnection(io, socket);
    registerStatusEvents(io, socket);
};
