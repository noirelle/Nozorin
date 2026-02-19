
import { Server, Socket } from 'socket.io';
import { userService } from '../modules/user/user.service';
import { activeCalls, removeUserFromQueues, getConnectedUser, userMediaState } from './users';

export const handleDirectCall = (io: Server, socket: Socket) => {
    /**
     * Initiate a call to a specific user by their userId
     */
    socket.on('initiate-direct-call', async (data: { targetUserId: string, mode: 'voice' }) => {
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
        const callerInfo = getConnectedUser(socket.id);
        const callerProfile = await userService.getUserProfile(myUserId);

        targetSocket.emit('incoming-call', {
            fromUserId: myUserId,
            fromSocketId: socket.id,
            fromUsername: callerProfile?.username || 'Guest',
            fromAvatar: callerProfile?.avatar || '/avatars/avatar1.webp',
            fromGender: callerProfile?.gender || 'unknown',
            fromCountry: callerInfo?.country,
            fromCountryCode: callerInfo?.countryCode,
            mode
        });

        console.log(`[DIRECT-CALL] Call request sent from ${socket.id} to ${targetSocketId}`);
    });

    /**
     * Handle response to an incoming direct call
     */
    socket.on('respond-to-call', async (data: { callerSocketId: string, accepted: boolean, mode: 'voice' }) => {
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
        const mediaA = userMediaState.get(socket.id) || { isMuted: false };
        const mediaB = userMediaState.get(callerSocketId) || { isMuted: false };

        // Get geo info
        const infoA = getConnectedUser(socket.id);
        const infoB = getConnectedUser(callerSocketId);

        // Get profiles
        const callerUserId = userService.getUserId(callerSocketId);
        const profileA = await userService.getUserProfile(myUserId);
        const profileB = callerUserId ? await userService.getUserProfile(callerUserId) : null;

        // Finalize match for both
        socket.emit('match-found', {
            role: 'answerer',
            partnerId: callerSocketId,
            partnerUsername: profileB?.username || 'Guest',
            partnerAvatar: profileB?.avatar || '/avatars/avatar1.webp',
            partnerGender: profileB?.gender || 'unknown',
            partnerCountry: infoB?.country,
            partnerCountryCode: infoB?.countryCode,
            partnerIsMuted: mediaB.isMuted,
            roomId,
            mode,
        });

        callerSocket.emit('match-found', {
            role: 'offerer',
            partnerId: socket.id,
            partnerUsername: profileA?.username || 'Guest',
            partnerAvatar: profileA?.avatar || '/avatars/avatar1.webp',
            partnerGender: profileA?.gender || 'unknown',
            partnerCountry: infoA?.country,
            partnerCountryCode: infoA?.countryCode,
            partnerIsMuted: mediaA.isMuted,
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
