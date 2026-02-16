
import { Server, Socket } from 'socket.io';
import { getGeoInfo } from '../utils/geo';
import { statsService } from '../services/statsService';
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
import { handleMatchmaking, setupMatchmaking, handleMatchmakingDisconnect } from './matchmaking';
import { handleDirectCall } from './directCall';
import { handleHistoryEvents } from './history';
import { handleUserTracking, cleanupUserSession } from './tracking';
import { handleStatusEvents, broadcastUserStatus } from './status';

import { userService } from '../services/userService';

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

    // Global middleware for this socket: Block any activity if not identified or if superseded by another tab
    socket.use(([event, ...args], next) => {
        // Always allow identification and system events
        if (event === 'user-identify' || event === 'force-reconnect' || event === 'disconnect' || event === 'stats-update') {
            return next();
        }

        const userId = userService.getUserId(socket.id);
        const masterSocketId = userId ? userService.getSocketId(userId) : null;

        // If not identifying AND (no userId OR another socket is master), block and notify
        if (!userId || masterSocketId !== socket.id) {
            console.warn(`[AUTH] Blocked '${event}' from non-authoritative session: ${socket.id}`);
            socket.emit('multi-session', { message: 'Your session has been superseded or expired.' });
            return; // Stop processing this event
        }

        next();
    });

    // Module Handlers
    handleStatusEvents(io, socket);
    handleMatchmaking(io, socket);
    handleDirectCall(io, socket);
    handleSignalingEvents(socket);
    handleMediaEvents(socket);
    handleHistoryEvents(socket);
    handleUserTracking(io, socket);

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
