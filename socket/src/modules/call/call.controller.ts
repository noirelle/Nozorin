import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { userService } from '../../shared/services/user.service';
import { logger } from '../../core/logger';
import { activeCalls, reconnectingUsers } from './call.store';
import { callService } from './call.service';
import { CallDisconnectReason } from '../../shared/types/socket.types';

export const register = (io: Server, socket: Socket): void => {
    socket.on(SocketEvents.END_CALL, async (data: { target: string | null, reason?: CallDisconnectReason }, callback?: (ack: any) => void) => {
        const success = await callService.handleEndCall(io, socket.id, data);
        if (callback) callback({ success });
    });

    socket.on(SocketEvents.REJOIN_CALL, async (data: { room_id?: string }) => {
        const userId = userService.getUserId(socket.id);
        if (!userId) {
            socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'user-not-identified' });
            return;
        }

        const rejoinInfo = reconnectingUsers.get(userId);
        if (!rejoinInfo) {
            socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'no-rejoin-session' });
            return;
        }

        if (Date.now() > rejoinInfo.expires_at) {
            reconnectingUsers.delete(userId);
            socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'session-expired' });
            return;
        }

        const currentPartnerSocketId = userService.getSocketId(rejoinInfo.partner_user_id) || rejoinInfo.partner_socket_id;
        const startTime = rejoinInfo.start_time;

        const oldSocketId = [...activeCalls.entries()].find(
            ([k, v]) => v.partner_id === currentPartnerSocketId
        )?.[0];

        if (oldSocketId) {
            activeCalls.delete(oldSocketId);
        }

        activeCalls.set(socket.id, { partner_id: currentPartnerSocketId, start_time: startTime });
        activeCalls.set(currentPartnerSocketId, { partner_id: socket.id, start_time: startTime });
        reconnectingUsers.delete(userId);

        const partnerProfile = await userService.getUserProfile(rejoinInfo.partner_user_id);

        socket.emit(SocketEvents.REJOIN_SUCCESS, {
            partner_id: currentPartnerSocketId,
            partner_user_id: rejoinInfo.partner_user_id,
            partner_username: partnerProfile?.username,
            partner_avatar: partnerProfile?.avatar,
            partner_gender: partnerProfile?.gender,
            partner_country_name: partnerProfile?.country_name,
            partner_country: partnerProfile?.country,
            room_id: rejoinInfo.room_id
        });

        io.to(currentPartnerSocketId).emit(SocketEvents.PARTNER_RECONNECTED, {
            new_socket_id: socket.id,
            new_user_id: userId
        });

        logger.info({ socketId: socket.id, user_id: userId, partner_id: rejoinInfo.partner_socket_id }, '[CALL] Call rejoined successfully');
    });

    socket.on(SocketEvents.CANCEL_RECONNECT, () => {
        const userId = userService.getUserId(socket.id);
        if (userId) {
            const info = reconnectingUsers.get(userId);
            if (info) {
                io.to(info.partner_socket_id).emit(SocketEvents.CALL_ENDED, { reason: 'partner-cancelled' });
                activeCalls.delete(info.partner_socket_id);
                reconnectingUsers.delete(userId);
            }
            logger.info({ socketId: socket.id, user_id: userId }, '[CALL] Reconnection cancelled');
        }
    });
};
