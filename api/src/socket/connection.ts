import { Server, Socket } from 'socket.io';
import { handleMediaEvents } from './media';
import { handleSignalingEvents } from './signaling';
import { handleMatchmaking, setupMatchmaking } from '../modules/matchmaking/matchmaking.service';
import { handleDirectCall } from './directCall';
import { handleHistoryEvents } from './history';
import { handleUserTracking } from './tracking';
import { handleStatusEvents } from './status';
import { handleChatEvents } from './chat';
import { handleDisconnectEvents } from './disconnect';
import { initializeSocketConnection } from './initialization';

export const handleSocketConnection = async (io: Server, socket: Socket) => {
    setupMatchmaking(io);
    await initializeSocketConnection(io, socket);

    // Module Handlers
    handleStatusEvents(io, socket);
    handleMatchmaking(io, socket);
    handleDirectCall(io, socket);
    handleSignalingEvents(socket);
    handleMediaEvents(socket);
    handleHistoryEvents(socket);
    handleUserTracking(io, socket);
    handleChatEvents(socket);
    handleDisconnectEvents(io, socket);
};
