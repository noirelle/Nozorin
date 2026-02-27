import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { userService } from '../../shared/services/user.service';
import { activeCalls } from '../call/call.store';
import { removeUserFromQueues } from '../matchmaking/matchmaking.store';
import { userMediaState } from '../media/media.store';
import { getConnectedUser } from '../tracking/tracking.service';
import { logger } from '../../core/logger';
import { callService } from '../call/call.service';

export const directCallService = {
    async initiateCall(io: Server, fromUserId: string, targetUserId: string, mode: 'voice' | 'video') {
        const fromSocketId = userService.getSocketId(fromUserId);
        const targetSocketId = userService.getSocketId(targetUserId);

        if (!fromSocketId || !targetSocketId) {
            throw new Error('User is offline');
        }

        const fromSocket = io.sockets.sockets.get(fromSocketId);
        const targetSocket = io.sockets.sockets.get(targetSocketId);

        if (!fromSocket || !targetSocket) {
            logger.warn({
                fromSocketId,
                fromSocketExists: !!fromSocket,
                targetSocketId,
                targetSocketExists: !!targetSocket,
                fromUserId,
                targetUserId
            }, '[DIRECT-CALL] Failed to find socket in io.sockets.sockets');
            throw new Error('User connection lost');
        }

        // 1. End any existing calls for the caller
        const existingInfo = activeCalls.get(fromSocketId);
        if (existingInfo) {
            await callService.handleEndCall(io, fromSocketId, { target: existingInfo.partner_id, reason: 'skip' });
        }

        // 2. Remove both from matchmaking queues
        removeUserFromQueues(fromSocketId);
        removeUserFromQueues(targetSocketId);

        // 3. Get caller profile and location info
        const callerInfo = getConnectedUser(fromSocketId);
        const callerProfile = await userService.getUserProfile(fromUserId);

        // 4. Emit incoming call event to target
        targetSocket.emit(SocketEvents.INCOMING_CALL, {
            from_user_id: fromUserId,
            from_socket_id: fromSocketId,
            from_username: callerProfile?.username || 'Guest',
            from_avatar: callerProfile?.avatar || '/avatars/avatar1.webp',
            from_gender: callerProfile?.gender || 'unknown',
            from_country: callerInfo?.country,
            from_country_name: callerInfo?.country_name,
            mode,
        });

        logger.info({ from: fromUserId, to: targetUserId }, '[DIRECT-CALL] Call request signaled');
        return { success: true };
    },

    async handleResponse(io: Server, responderUserId: string, callerUserId: string, accepted: boolean, mode: 'voice' | 'video') {
        const responderSocketId = userService.getSocketId(responderUserId);
        const callerSocketId = userService.getSocketId(callerUserId);

        if (!responderSocketId || !callerSocketId) {
            throw new Error('One of the users disconnected');
        }

        const responderSocket = io.sockets.sockets.get(responderSocketId);
        const callerSocket = io.sockets.sockets.get(callerSocketId);

        if (!responderSocket || !callerSocket) {
            throw new Error('User connection lost');
        }

        if (!accepted) {
            callerSocket.emit(SocketEvents.CALL_DECLINED, { by: responderSocketId });
            return { success: true, accepted: false };
        }

        const roomId = `direct-${responderSocketId}-${callerSocketId}`;

        // End any existing calls
        const existingInfo = activeCalls.get(responderSocketId);
        if (existingInfo) {
            await callService.handleEndCall(io, responderSocketId, { target: existingInfo.partner_id, reason: 'answered-another' });
        }

        const start_time = Date.now();
        activeCalls.set(responderSocketId, { partner_id: callerSocketId, start_time });
        activeCalls.set(callerSocketId, { partner_id: responderSocketId, start_time });

        responderSocket.join(roomId);
        callerSocket.join(roomId);

        // Fetch media and profile info for both
        const mediaA = userMediaState.get(responderSocketId) || { is_muted: false };
        const mediaB = userMediaState.get(callerSocketId) || { is_muted: false };
        const infoA = getConnectedUser(responderSocketId);
        const infoB = getConnectedUser(callerSocketId);
        const profileA = await userService.getUserProfile(responderUserId);
        const profileB = await userService.getUserProfile(callerUserId);

        const friendshipStatus = await userService.getFriendshipStatus(responderUserId, callerUserId);

        // Emit MATCH_FOUND to both to establish the P2P connection
        responderSocket.emit(SocketEvents.MATCH_FOUND, {
            role: 'answerer',
            partner_id: callerSocketId,
            partner_user_id: callerUserId,
            partner_username: profileB?.username || 'Guest',
            partner_avatar: profileB?.avatar || '/avatars/avatar1.webp',
            partner_gender: profileB?.gender || 'unknown',
            partner_country: infoB?.country,
            partner_country_name: infoB?.country_name,
            partner_is_muted: mediaB.is_muted,
            room_id: roomId,
            mode,
            friendship_status: friendshipStatus,
        });

        let reverseStatus = friendshipStatus;
        if (friendshipStatus === 'pending_sent') reverseStatus = 'pending_received';
        else if (friendshipStatus === 'pending_received') reverseStatus = 'pending_sent';

        callerSocket.emit(SocketEvents.MATCH_FOUND, {
            role: 'offerer',
            partner_id: responderSocketId,
            partner_user_id: responderUserId,
            partner_username: profileA?.username || 'Guest',
            partner_avatar: profileA?.avatar || '/avatars/avatar1.webp',
            partner_gender: profileA?.gender || 'unknown',
            partner_country: infoA?.country,
            partner_country_name: infoA?.country_name,
            partner_is_muted: mediaA.is_muted,
            room_id: roomId,
            mode,
            friendship_status: reverseStatus,
        });

        logger.info({ responderUserId, callerUserId }, '[DIRECT-CALL] Call established via API');
        return { success: true, accepted: true };
    },

    async endCall(io: Server, userId: string, targetUserId: string) {
        const userSocketId = userService.getSocketId(userId);
        if (userSocketId) {
            const existingInfo = activeCalls.get(userSocketId);
            const targetSocketId = userService.getSocketId(targetUserId);

            // Use the general call session handler
            await callService.handleEndCall(io, userSocketId, {
                target: (targetSocketId || existingInfo?.partner_id || null) as (string | null),
                reason: 'remote'
            });
            return { success: true };
        }
        throw new Error('User socket not found');
    }
};

export const register = (io: Server, socket: Socket): void => {
    socket.on(SocketEvents.INITIATE_DIRECT_CALL, async (data: { target_user_id: string; mode: 'voice' | 'video' }) => {
        const myUserId = userService.getUserId(socket.id);
        if (!myUserId) return;
        try {
            await directCallService.initiateCall(io, myUserId, data.target_user_id, data.mode);
        } catch (err: any) {
            socket.emit(SocketEvents.CALL_ERROR, { message: err.message });
        }
    });

    socket.on(SocketEvents.RESPOND_TO_CALL, async (data: { caller_socket_id: string; accepted: boolean; mode: 'voice' | 'video' }) => {
        const myUserId = userService.getUserId(socket.id);
        const callerUserId = userService.getUserId(data.caller_socket_id);
        if (!myUserId || !callerUserId) return;
        try {
            await directCallService.handleResponse(io, myUserId, callerUserId, data.accepted, data.mode);
        } catch (err: any) {
            socket.emit(SocketEvents.CALL_ERROR, { message: err.message });
        }
    });

    socket.on(SocketEvents.CANCEL_CALL, (data: { target_user_id: string }) => {
        const myUserId = userService.getUserId(socket.id);
        if (!myUserId) return;

        const mySocketId = socket.id;
        const targetSocketId = userService.getSocketId(data.target_user_id);
        const isActive = activeCalls.has(mySocketId);

        if (!isActive && targetSocketId) {
            // It's a request cancellation (pre-match)
            io.to(targetSocketId).emit(SocketEvents.CALL_CANCELLED_BY_CALLER, { by: myUserId });
            logger.info({ from: myUserId, to: data.target_user_id }, '[DIRECT-CALL] Call request cancelled by caller');
        } else {
            // It's an active call termination or cleanup
            directCallService.endCall(io, myUserId, data.target_user_id).catch(() => { });
        }
    });
};
