import { Server, Socket } from 'socket.io';
import { register as registerMatchmaking, handleMatchmakingDisconnect } from './matchmaking.service';
import { voiceQueue, removeUserFromQueues } from './matchmaking.store';

export { voiceQueue, removeUserFromQueues };

export const register = (io: Server, socket: Socket): void => {
    registerMatchmaking(io, socket);
};

export const handleDisconnect = async (io: Server, socketId: string): Promise<void> => {
    handleMatchmakingDisconnect(null as any, socketId);
};
