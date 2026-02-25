import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { userService } from '../../shared/services/user.service';
import { activeCalls } from '../call/call.store';
import { removeUserFromQueues } from '../matchmaking/matchmaking.store';
import { userMediaState } from '../media/media.store';
import { getConnectedUser } from '../tracking/tracking.service';
import { logger } from '../../core/logger';
import { callService } from '../call/call.service';

export const register = (io: Server, socket: Socket): void => {
    socket.on(SocketEvents.INITIATE_DIRECT_CALL, async (data: { target_user_id: string; mode: 'voice' }) => {
        const { target_user_id: targetUserId, mode } = data;

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

        const existingInfo = activeCalls.get(socket.id);
        if (existingInfo) {
            await callService.handleEndCall(io, socket.id, { target: existingInfo.partner_id, reason: 'skip' });
        }

        removeUserFromQueues(socket.id);
        removeUserFromQueues(targetSocketId);

        const callerInfo = getConnectedUser(socket.id);
        const callerProfile = await userService.getUserProfile(myUserId);

        targetSocket.emit(SocketEvents.INCOMING_CALL, {
            from_user_id: myUserId,
            from_socket_id: socket.id,
            from_username: callerProfile?.username || 'Guest',
            from_avatar: callerProfile?.avatar || '/avatars/avatar1.webp',
            from_gender: callerProfile?.gender || 'unknown',
            from_country: callerInfo?.country,
            from_country_code: callerInfo?.country_code,
            mode,
        });

        logger.info({ from: socket.id, to: targetSocketId }, '[DIRECT-CALL] Call initiated');
    });

    socket.on(SocketEvents.RESPOND_TO_CALL, async (data: { caller_socket_id: string; accepted: boolean; mode: 'voice' }) => {
        const { caller_socket_id: callerSocketId, accepted, mode } = data;

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

        const existingInfo = activeCalls.get(socket.id);
        if (existingInfo) {
            await callService.handleEndCall(io, socket.id, { target: existingInfo.partner_id, reason: 'answered-another' });
        }

        const start_time = Date.now();
        activeCalls.set(socket.id, { partner_id: callerSocketId, start_time });
        activeCalls.set(callerSocketId, { partner_id: socket.id, start_time });

        socket.join(roomId);
        callerSocket.join(roomId);

        const mediaA = userMediaState.get(socket.id) || { is_muted: false };
        const mediaB = userMediaState.get(callerSocketId) || { is_muted: false };
        const infoA = getConnectedUser(socket.id);
        const infoB = getConnectedUser(callerSocketId);
        const callerUserId = userService.getUserId(callerSocketId);
        const profileA = await userService.getUserProfile(myUserId);
        const profileB = callerUserId ? await userService.getUserProfile(callerUserId) : null;

        let friendshipStatus = 'none';
        if (myUserId && myUserId !== 'unknown' && callerUserId && callerUserId !== 'unknown') {
            friendshipStatus = await userService.getFriendshipStatus(myUserId, callerUserId);
        }

        socket.emit(SocketEvents.MATCH_FOUND, {
            role: 'answerer',
            partner_id: callerSocketId,
            partner_user_id: callerUserId || 'unknown',
            partner_username: profileB?.username || 'Guest',
            partner_avatar: profileB?.avatar || '/avatars/avatar1.webp',
            partner_gender: profileB?.gender || 'unknown',
            partner_country: infoB?.country,
            partner_country_code: infoB?.country_code,
            partner_is_muted: mediaB.is_muted,
            room_id: roomId, mode,
            friendship_status: friendshipStatus,
        });

        let reverseStatus = friendshipStatus;
        if (friendshipStatus === 'pending_sent') reverseStatus = 'pending_received';
        else if (friendshipStatus === 'pending_received') reverseStatus = 'pending_sent';

        callerSocket.emit(SocketEvents.MATCH_FOUND, {
            role: 'offerer',
            partner_id: socket.id,
            partner_user_id: myUserId || 'unknown',
            partner_username: profileA?.username || 'Guest',
            partner_avatar: profileA?.avatar || '/avatars/avatar1.webp',
            partner_gender: profileA?.gender || 'unknown',
            partner_country: infoA?.country,
            partner_country_code: infoA?.country_code,
            partner_is_muted: mediaA.is_muted,
            room_id: roomId, mode,
            friendship_status: reverseStatus,
        });

        logger.info({ socketA: socket.id, socketB: callerSocketId }, '[DIRECT-CALL] Call established');
    });

    socket.on(SocketEvents.CANCEL_CALL, (data: { target_user_id: string }) => {
        const targetSocketId = userService.getSocketId(data.target_user_id);
        if (targetSocketId) {
            io.to(targetSocketId).emit(SocketEvents.CALL_CANCELLED_BY_CALLER, { from: socket.id });
        }
    });
};
