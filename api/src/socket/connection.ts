import { Server, Socket } from 'socket.io';
import { getGeoInfo } from '../core/utils/geo.utils';
import { statsService } from '../modules/stats/stats.service';
import {
    connectedUsers,
    activeUsers,
    userMediaState,
    activeCalls,
    voiceQueue,
    removeUserFromQueues
} from './users';
import { handleMediaEvents } from './media';
import { handleSignalingEvents } from './signaling';
import { handleMatchmaking, setupMatchmaking, handleMatchmakingDisconnect } from '../modules/matchmaking/matchmaking.service';
import { handleDirectCall } from './directCall';
import { handleHistoryEvents } from './history';
import { handleUserTracking, cleanupUserSession } from './tracking';
import { handleStatusEvents, broadcastUserStatus } from './status';

import { userService } from '../modules/user/user.service';

import { verifyVisitorToken } from '../core/utils/jwt.utils';

export const handleSocketConnection = (io: Server, socket: Socket) => {
    setupMatchmaking(io);
    console.log(`[CONNECT] User connected: ${socket.id}`);

    const clientIp =
        socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    const geo = getGeoInfo(
        Array.isArray(clientIp) ? clientIp[0] : clientIp
    );
    const country = geo.name;
    const countryCode = geo.code;

    // Store user info
    connectedUsers.set(socket.id, { country, countryCode });

    // Track online state
    activeUsers.add(socket.id);
    statsService.setOnlineUsers(activeUsers.size);
    statsService.incrementTotalConnections();

    // Send current stats to the newly connected user
    socket.emit('stats-update', statsService.getStats());
    // Broadcast to all that others are online
    io.emit('stats-update', statsService.getStats());

    // Initialize user media state (unmuted)
    userMediaState.set(socket.id, { isMuted: false });

    // Auto-register if middleware authenticated the user
    if (socket.data.user && socket.data.user.userId) {
        const { userId } = socket.data.user;
        userService.setUserForSocket(socket.id, userId);
        userService.registerUser(userId);
        console.log(`[CONNECT] Auto-registered authenticated user: ${userId}`);
    }

    // Module Handlers
    handleStatusEvents(io, socket);
    handleMatchmaking(io, socket);
    handleDirectCall(io, socket);
    handleSignalingEvents(socket);
    handleMediaEvents(socket);
    handleHistoryEvents(socket);
    handleUserTracking(io, socket);

    // Handle token update (graceful refresh)
    socket.on('update-token', (data: { token: string }) => {
        const payload = verifyVisitorToken(data.token);
        if (payload) {
            socket.data.user = {
                userId: payload.userId,
                userType: payload.userType
            };

            // Update mapping in user service
            userService.setUserForSocket(socket.id, payload.userId);
            userService.registerUser(payload.userId);

            console.log(`[AUTH] Socket ${socket.id} token updated successfully for user ${payload.userId}`);
            socket.emit('token-updated', { success: true });
        } else {
            console.warn(`[AUTH] Socket ${socket.id} failed to update token: invalid token`);
            socket.emit('auth-error', { message: 'Invalid token during update' });
            // Should we disconnect? Maybe give them a chance to retry? Or disconnect after short delay?
            // For now, let client handle 'auth-error' which triggers refresh flow again.
        }
    });

    // Text Chat Message
    socket.on('send-message', (data) => {
        const { target, message } = data;
        // console.log(`[MESSAGE] ${socket.id} -> ${target}: ${message.substring(0, 50)}...`);
        socket.to(target).emit('receive-message', {
            senderId: socket.id,
            message,
            timestamp: new Date().toISOString()
        });
    });

    // Disconnect
    socket.on('disconnect', async () => {
        console.log(`[DISCONNECT] User ${socket.id} disconnected`);
        const userId = userService.getUserId(socket.id);

        // Clean up any active session
        await cleanupUserSession(socket.id);

        // Centralized disconnect logic for matchmaking
        handleMatchmakingDisconnect(io, socket.id, userId);

        // Match/Call cleanup is handled in matchmaking.ts to ensure proper event emission
        // and avoid race conditions or double-handling.

        removeUserFromQueues(socket.id);

        // Clean up media state
        userMediaState.delete(socket.id);
        connectedUsers.delete(socket.id);
        userService.removeSocket(socket.id);

        // Broadcast that this user is now offline
        if (userId) {
            await broadcastUserStatus(io, userId);
        }

        // Decrement online users
        activeUsers.delete(socket.id);
        statsService.setOnlineUsers(activeUsers.size);
        io.emit('stats-update', statsService.getStats());

        console.log(`[DISCONNECT] Cleanup complete. Active calls: ${activeCalls.size}, Queue: ${voiceQueue.length}`);
    });
};
