import { Server, Socket } from 'socket.io';
import { initializeSocketConnection } from './initialization';
import { register as registerPresence, presenceService } from '../../modules/presence/presence.service';
import { register as registerMatchmaking, handleMatchmakingDisconnect as disconnectMatchmaking } from '../../modules/matchmaking/matchmaking.service';
import { removeUserFromQueues } from '../../modules/matchmaking/matchmaking.store';
import { register as registerCall } from '../../modules/call/call.controller';
import { callService } from '../../modules/call/call.service';
import { activeCalls } from '../../modules/call/call.store';
import { register as registerAuth } from '../../modules/auth/auth.controller';
import { register as registerMedia } from '../../modules/media/media.service';
import { userMediaState } from '../../modules/media/media.store';
import { register as registerChat } from '../../modules/chat/chat.service';
import { register as registerHistory } from '../../modules/history/history.service';
import { register as registerTracking, cleanupUserSession as disconnectTracking, removeConnectedUser } from '../../modules/tracking/tracking.service';
import { register as registerDirectCall } from '../../modules/direct-call/direct-call.service';
import { register as registerFriends } from '../../modules/friends/friends.service';
import { register as registerSignaling } from '../../modules/signaling/signaling.service';
import { setIo } from '../../api/emit.controller';
import { userService } from '../../shared/services/user.service';
import { logger } from '../../core/logger';

export const handleSocketConnection = async (io: Server, socket: Socket): Promise<void> => {
    setIo(io);
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
        await disconnectTracking(socket.id);
        callService.handleDisconnect(io, socket.id);
        await disconnectMatchmaking(null as any, socket.id);
        userMediaState.delete(socket.id);
        presenceService.handleDisconnection(io, socket);

        // Global Cleanup
        removeConnectedUser(socket.id);
        userService.removeSocket(socket.id);

        if (userId) {
            await presenceService.broadcastUserStatus(io, userId);
        }

        logger.info({ activeCalls: activeCalls.size }, '[DISCONNECT] Cleanup complete');
    });
};
