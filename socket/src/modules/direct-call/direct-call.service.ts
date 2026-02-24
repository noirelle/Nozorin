import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { userService } from '../../shared/services/user.service';
import { activeCalls } from '../call/call.store';
import { removeUserFromQueues } from '../matchmaking/matchmaking.store';
import { userMediaState } from '../media/media.store';
import { getConnectedUser } from '../tracking/tracking.service';
import { logger } from '../../core/logger';

export const register = (io: Server, socket: Socket): void => {
    socket.on(SocketEvents.INITIATE_DIRECT_CALL, async (data: { targetUserId: string; mode: 'voice' }) => {
        const { targetUserId, mode } = data;

        const myUserId = userService.getUserId(socket.id);
        const authoritativeSocketId = myUserId ? userService.getSocketId(myUserId) : null;
        if (!myUserId || authoritativeSocketId !== socket.id) {
            socket.emit(SocketEvents.MULTI_SESSION, { message: 'Session no longer active. Please reconnect.' });
            return;
        }

        const targetSocketId = userService.getSocketId(targetUserId);
        if (!targetSocketId) { socket.emit(SocketEvents.CALL_ERROR, { message: 'User is offline' }); return; }
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (!targetSocket) { socket.emit(SocketEvents.CALL_ERROR, { message: 'User is offline' }); return; }

        const myExistingPartnerId = activeCalls.get(socket.id);
        if (myExistingPartnerId) {
            io.to(myExistingPartnerId).emit(SocketEvents.CALL_ENDED, { by: socket.id });
            activeCalls.delete(myExistingPartnerId);
            activeCalls.delete(socket.id);
        }

        removeUserFromQueues(socket.id);
        removeUserFromQueues(targetSocketId);

        const callerInfo = getConnectedUser(socket.id);
        const callerProfile = await userService.getUserProfile(myUserId);

        targetSocket.emit(SocketEvents.INCOMING_CALL, {
            fromUserId: myUserId,
            fromSocketId: socket.id,
            fromUsername: callerProfile?.username || 'Guest',
            fromAvatar: callerProfile?.avatar || '/avatars/avatar1.webp',
            fromGender: callerProfile?.gender || 'unknown',
            fromCountry: callerInfo?.country,
            fromCountryCode: callerInfo?.countryCode,
            mode,
        });

        logger.info({ from: socket.id, to: targetSocketId }, '[DIRECT-CALL] Call initiated');
    });

    socket.on(SocketEvents.RESPOND_TO_CALL, async (data: { callerSocketId: string; accepted: boolean; mode: 'voice' }) => {
        const { callerSocketId, accepted, mode } = data;

        const myUserId = userService.getUserId(socket.id);
        const authoritativeSocketId = myUserId ? userService.getSocketId(myUserId) : null;
        if (!myUserId || authoritativeSocketId !== socket.id) {
            socket.emit(SocketEvents.MULTI_SESSION, { message: 'Session no longer active. Please reconnect.' });
            return;
        }

        const callerSocket = io.sockets.sockets.get(callerSocketId);
        if (!callerSocket) { socket.emit(SocketEvents.CALL_ERROR, { message: 'Caller disconnected' }); return; }

        if (!accepted) { callerSocket.emit(SocketEvents.CALL_DECLINED, { by: socket.id }); return; }

        const roomId = `direct-${socket.id}-${callerSocketId}`;

        const myExistingPartnerId = activeCalls.get(socket.id);
        if (myExistingPartnerId) {
            io.to(myExistingPartnerId).emit(SocketEvents.CALL_ENDED, { by: 'answered-another' });
            activeCalls.delete(myExistingPartnerId);
            activeCalls.delete(socket.id);
        }

        activeCalls.set(socket.id, callerSocketId);
        activeCalls.set(callerSocketId, socket.id);

        socket.join(roomId);
        callerSocket.join(roomId);

        const mediaA = userMediaState.get(socket.id) || { isMuted: false };
        const mediaB = userMediaState.get(callerSocketId) || { isMuted: false };
        const infoA = getConnectedUser(socket.id);
        const infoB = getConnectedUser(callerSocketId);
        const callerUserId = userService.getUserId(callerSocketId);
        const profileA = await userService.getUserProfile(myUserId);
        const profileB = callerUserId ? await userService.getUserProfile(callerUserId) : null;

        socket.emit(SocketEvents.MATCH_FOUND, {
            role: 'answerer',
            partnerId: callerSocketId,
            partnerUsername: profileB?.username || 'Guest',
            partnerAvatar: profileB?.avatar || '/avatars/avatar1.webp',
            partnerGender: profileB?.gender || 'unknown',
            partnerCountry: infoB?.country,
            partnerCountryCode: infoB?.countryCode,
            partnerIsMuted: mediaB.isMuted,
            roomId, mode,
        });

        callerSocket.emit(SocketEvents.MATCH_FOUND, {
            role: 'offerer',
            partnerId: socket.id,
            partnerUsername: profileA?.username || 'Guest',
            partnerAvatar: profileA?.avatar || '/avatars/avatar1.webp',
            partnerGender: profileA?.gender || 'unknown',
            partnerCountry: infoA?.country,
            partnerCountryCode: infoA?.countryCode,
            partnerIsMuted: mediaA.isMuted,
            roomId, mode,
        });

        logger.info({ socketA: socket.id, socketB: callerSocketId }, '[DIRECT-CALL] Call established');
    });

    socket.on(SocketEvents.CANCEL_CALL, (data: { targetUserId: string }) => {
        const targetSocketId = userService.getSocketId(data.targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit(SocketEvents.CALL_CANCELLED_BY_CALLER, { from: socket.id });
        }
    });
};
