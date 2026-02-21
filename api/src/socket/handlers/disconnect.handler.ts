import { Server, Socket } from 'socket.io';
import { userService } from '../../modules/user/user.service';
import { handleMatchmakingDisconnect } from '../../modules/matchmaking/matchmaking.service';
import { scanQueueForMatches } from '../../modules/matchmaking/matchmaking.matcher';
import { cleanupUserSession } from './tracking.handler';
import { broadcastUserStatus, handleUserDisconnection } from './status.handler';
import {
    removeConnectedUser,
    userMediaState,
    activeCalls,
    voiceQueue,
    removeUserFromQueues,
} from '../store/socket.store';

export const handleDisconnectEvents = (io: Server, socket: Socket) => {
    socket.on('disconnect', async () => {
        console.log(`[DISCONNECT] User ${socket.id} disconnected`);
        const userId = userService.getUserId(socket.id);

        await cleanupUserSession(socket.id);

        handleMatchmakingDisconnect(io, socket.id, scanQueueForMatches, userId);

        removeUserFromQueues(socket.id);

        userMediaState.delete(socket.id);
        removeConnectedUser(socket.id);
        userService.removeSocket(socket.id);

        if (userId) {
            await broadcastUserStatus(io, userId);
        }

        handleUserDisconnection(io, socket);

        console.log(`[DISCONNECT] Cleanup complete. Active calls: ${activeCalls.size}, Queue: ${voiceQueue.length}`);
    });
};
