
import { Server, Socket } from 'socket.io';
import { userService } from '../services/userService';
import { activeCalls, removeUserFromQueues, connectedUsers, userMediaState } from './users';

export const handleDirectCall = (io: Server, socket: Socket) => {
    /**
     * Initiate a call to a specific user by their userId
     */
    socket.on('initiate-direct-call', async (data: { targetUserId: string, mode: 'video' }) => {
        const { targetUserId, mode } = data;

        // ROBUSTNESS: Ensure caller is identified and authoritative
        const myUserId = userService.getUserId(socket.id);
        const authoritativeSocketId = myUserId ? userService.getSocketId(myUserId) : null;

        if (!myUserId || authoritativeSocketId !== socket.id) {
            socket.emit('multi-session', { message: 'Session no longer active. Please reconnect.' });
            return;
        }

        const targetSocketId = userService.getSocketId(targetUserId);

        if (!targetSocketId) {
            socket.emit('call-error', { message: 'User is offline' });
            return;
        }

        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (!targetSocket) {
            socket.emit('call-error', { message: 'User is offline' });
            return;
        }

        // Also check if sender is currently in a call
        const myExistingPartnerId = activeCalls.get(socket.id);
        if (myExistingPartnerId) {
            io.to(myExistingPartnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(myExistingPartnerId);
            activeCalls.delete(socket.id);
        }

        // Ensure both are removed from matchmaking queues
        removeUserFromQueues(socket.id);
        removeUserFromQueues(targetSocketId);

        // Get caller info to show on receiver's screen
        const callerInfo = connectedUsers.get(socket.id);

        targetSocket.emit('incoming-call', {
            fromUserId: userService.getUserId(socket.id),
            fromSocketId: socket.id,
            fromCountry: callerInfo?.country,
            fromCountryCode: callerInfo?.countryCode,
            mode
        });

        console.log(`[DIRECT-CALL] Call request sent from ${socket.id} to ${targetSocketId}`);
    });

    /**
     * Handle response to an incoming direct call
     */
    socket.on('respond-to-call', (data: { callerSocketId: string, accepted: boolean, mode: 'video' }) => {
        const { callerSocketId, accepted, mode } = data;

        // ROBUSTNESS: Ensure responder is identified and authoritative
        const myUserId = userService.getUserId(socket.id);
        const authoritativeSocketId = myUserId ? userService.getSocketId(myUserId) : null;

        if (!myUserId || authoritativeSocketId !== socket.id) {
            socket.emit('multi-session', { message: 'Session no longer active. Please reconnect.' });
            return;
        }

        const callerSocket = io.sockets.sockets.get(callerSocketId);

        if (!callerSocket) {
            socket.emit('call-error', { message: 'Caller disconnected' });
            return;
        }

        if (!accepted) {
            callerSocket.emit('call-declined', { by: socket.id });
            return;
        }

        // ESTABLISH CONNECTION
        const roomId = `direct-${socket.id}-${callerSocketId}`;

        // PRIORITY: If I (the answerer) am in a call, notify my current partner with a specific reason
        const myExistingPartnerId = activeCalls.get(socket.id);
        if (myExistingPartnerId) {
            console.log(`[DIRECT-CALL] Answerer ${socket.id} in call, disconnecting partner ${myExistingPartnerId} (ANSWERED ANOTHER CALL)`);
            io.to(myExistingPartnerId).emit('call-ended', { by: 'answered-another' });
            activeCalls.delete(myExistingPartnerId);
            activeCalls.delete(socket.id);
        }

        activeCalls.set(socket.id, callerSocketId);
        activeCalls.set(callerSocketId, socket.id);

        socket.join(roomId);
        callerSocket.join(roomId);

        // Get media states
        const mediaA = userMediaState.get(socket.id) || { isMuted: false, isCameraOff: false };
        const mediaB = userMediaState.get(callerSocketId) || { isMuted: false, isCameraOff: false };

        // Get geo info
        const infoA = connectedUsers.get(socket.id);
        const infoB = connectedUsers.get(callerSocketId);

        // Finalize match for both
        socket.emit('match-found', {
            role: 'answerer',
            partnerId: callerSocketId,
            partnerCountry: infoB?.country,
            partnerCountryCode: infoB?.countryCode,
            partnerIsMuted: mediaB.isMuted,
            partnerIsCameraOff: mediaB.isCameraOff,
            roomId,
            mode,
        });

        callerSocket.emit('match-found', {
            role: 'offerer',
            partnerId: socket.id,
            partnerCountry: infoA?.country,
            partnerCountryCode: infoA?.countryCode,
            partnerIsMuted: mediaA.isMuted,
            partnerIsCameraOff: mediaA.isCameraOff,
            roomId,
            mode,
        });

        console.log(`[DIRECT-CALL] Established direct connection: ${socket.id} <-> ${callerSocketId}`);
    });

    /**
     * Cancel an outgoing call request
     */
    socket.on('cancel-call', (data: { targetUserId: string }) => {
        const { targetUserId } = data;
        const targetSocketId = userService.getSocketId(targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit('call-cancelled-by-caller', { from: socket.id });
        }
    });
};
