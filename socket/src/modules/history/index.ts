import { Server, Socket } from 'socket.io';
import { register as registerHistoryEvents, historyService } from './history.service';

export { historyService };

export const register = (io: Server, socket: Socket): void => {
    registerHistoryEvents(io, socket);
};
