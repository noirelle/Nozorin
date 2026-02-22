import { Server, Socket } from 'socket.io';
import { initializeSocketConnection } from './initialization';
import { register as registerStatus, statusService } from '../../modules/status';
import { register as registerMatchmaking, handleMatchmakingDisconnect, removeUserFromQueues, activeCalls } from '../../modules/matchmaking';
import { register as registerMedia, userMediaState } from '../../modules/media';
import { register as registerSignaling } from '../../modules/signaling';
import { register as registerChat } from '../../modules/chat';
import { register as registerHistory } from '../../modules/history';
import { register as registerTracking, cleanupUserSession, removeConnectedUser } from '../../modules/tracking';
import { register as registerDirectCall } from '../../modules/directCall';
import { userService } from '../../shared/services/user.service';
import { logger } from '../../core/logger';

export const handleSocketConnection = async (io: Server, socket: Socket): Promise<void> => {
    await initializeSocketConnection(io, socket);

    registerStatus(io, socket);
    registerMatchmaking(io, socket);
    registerDirectCall(io, socket);
    registerSignaling(io, socket);
    registerMedia(io, socket);
    registerHistory(io, socket);
    registerTracking(io, socket);
    registerChat(io, socket);

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
        logger.info({ socketId: socket.id }, '[DISCONNECT] User disconnected');
        const userId = userService.getUserId(socket.id);

        await cleanupUserSession(socket.id);
        handleMatchmakingDisconnect(io, socket.id);
        removeUserFromQueues(socket.id);
        userMediaState.delete(socket.id);
        removeConnectedUser(socket.id);
        userService.removeSocket(socket.id);

        if (userId) {
            await statusService.broadcastUserStatus(io, userId);
        }

        statusService.handleDisconnection(io, socket);

        logger.info({ activeCalls: activeCalls.size }, '[DISCONNECT] Cleanup complete');
    });
};
