
import { Server, Socket } from 'socket.io';
import { userService } from '../modules/user/user.service';
import { handleMatchmakingDisconnect } from '../modules/matchmaking/matchmaking.service';
import { scanQueueForMatches } from '../modules/matchmaking/matchmaking.matcher';
import { cleanupUserSession } from './tracking';
import { broadcastUserStatus, handleUserDisconnection } from './status';
import {
    removeConnectedUser,
    userMediaState,
    activeCalls,
    voiceQueue,
    removeUserFromQueues
} from './users';

export const handleDisconnectEvents = (io: Server, socket: Socket) => {
    socket.on('disconnect', async () => {
        console.log(`[DISCONNECT] User ${socket.id} disconnected`);
        const userId = userService.getUserId(socket.id);

        // Clean up any active session
        await cleanupUserSession(socket.id);

        // Centralized disconnect logic for matchmaking
        handleMatchmakingDisconnect(io, socket.id, scanQueueForMatches, userId);

        // Match/Call cleanup is handled in matchmaking.ts to ensure proper event emission
        // and avoid race conditions or double-handling.

        removeUserFromQueues(socket.id);

        // Clean up media state
        userMediaState.delete(socket.id);
        removeConnectedUser(socket.id);
        userService.removeSocket(socket.id);

        // Broadcast that this user is now offline
        if (userId) {
            await broadcastUserStatus(io, userId);
        }

        // Handle stats update
        handleUserDisconnection(io, socket);

        console.log(`[DISCONNECT] Cleanup complete. Active calls: ${activeCalls.size}, Queue: ${voiceQueue.length}`);
    });
};
