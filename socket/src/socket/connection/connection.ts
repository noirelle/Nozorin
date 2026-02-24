import { Server, Socket } from 'socket.io';
import { initializeSocketConnection } from './initialization';
import { register as registerPresence, handleDisconnect as disconnectPresence, presenceService } from '../../modules/presence';
import { register as registerMatchmaking, handleDisconnect as disconnectMatchmaking, removeUserFromQueues } from '../../modules/matchmaking';
import { register as registerCall, handleDisconnect as disconnectCall, activeCalls } from '../../modules/call';
import { register as registerAuth } from '../../modules/auth';
import { register as registerMedia, handleDisconnect as disconnectMedia } from '../../modules/media';
import { register as registerSignaling } from '../../modules/signaling';
import { register as registerChat } from '../../modules/chat';
import { register as registerHistory } from '../../modules/history';
import { register as registerTracking, handleDisconnect as disconnectTracking, removeConnectedUser } from '../../modules/tracking';
import { register as registerDirectCall } from '../../modules/direct-call';
import { register as registerFriends } from '../../modules/friends';
import { userService } from '../../shared/services/user.service';
import { logger } from '../../core/logger';

export const handleSocketConnection = async (io: Server, socket: Socket): Promise<void> => {
    await initializeSocketConnection(io, socket);

    // Domain Modules
    registerAuth(io, socket);
    registerPresence(io, socket);
    registerMatchmaking(io, socket);
    registerCall(io, socket);
    registerDirectCall(io, socket);
    registerSignaling(io, socket);
    registerMedia(io, socket);
    registerChat(io, socket);
    registerFriends(io, socket);
    registerHistory(io, socket);
    registerTracking(io, socket);

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
        logger.info({ socketId: socket.id }, '[DISCONNECT] User disconnected');
        const userId = userService.getUserId(socket.id);

        // Lifecycle Hooks
        await disconnectTracking(io, socket);
        await disconnectCall(io, socket);
        await disconnectMatchmaking(io, socket.id);
        await disconnectMedia(io, socket);
        await disconnectPresence(io, socket);

        // Global Cleanup
        removeConnectedUser(socket.id);
        userService.removeSocket(socket.id);

        if (userId) {
            await presenceService.broadcastUserStatus(io, userId);
        }

        logger.info({ activeCalls: activeCalls.size }, '[DISCONNECT] Cleanup complete');
    });
};
