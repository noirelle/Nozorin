import { Server, Socket } from 'socket.io';
import { handleMediaEvents } from '../handlers/media.handler';
import { handleSignalingEvents } from '../handlers/signaling.handler';
import { handleMatchmaking, setupMatchmaking } from '../../modules/matchmaking/matchmaking.service';
import { handleDirectCall } from '../handlers/directCall.handler';
import { handleHistoryEvents } from '../handlers/history.handler';
import { handleUserTracking } from '../handlers/tracking.handler';
import { handleStatusEvents } from '../handlers/status.handler';
import { handleChatEvents } from '../handlers/chat.handler';
import { handleDisconnectEvents } from '../handlers/disconnect.handler';
import { initializeSocketConnection } from './initialization';

export const handleSocketConnection = async (io: Server, socket: Socket) => {
    setupMatchmaking(io);
    await initializeSocketConnection(io, socket);

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
