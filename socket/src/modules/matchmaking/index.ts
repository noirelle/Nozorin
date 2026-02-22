import { Server, Socket } from 'socket.io';
import { register as registerMatchmaking, handleMatchmakingDisconnect } from './matchmaking.service';
import { activeCalls, voiceQueue, removeUserFromQueues } from './matchmaking.store';

export { activeCalls, voiceQueue, removeUserFromQueues, handleMatchmakingDisconnect };

export const register = (io: Server, socket: Socket): void => {
    registerMatchmaking(io, socket);
};
