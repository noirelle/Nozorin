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

    socket.on(SocketEvents.REJOIN_CALL, async (data: { roomId?: string }) => {
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

        if (Date.now() > rejoinInfo.expiresAt) {
            reconnectingUsers.delete(userId);
            socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'session-expired' });
            return;
        }

        const currentPartnerSocketId = userService.getSocketId(rejoinInfo.partnerUserId) || rejoinInfo.partnerSocketId;
        const startTime = rejoinInfo.startTime;

        activeCalls.set(socket.id, { partnerId: currentPartnerSocketId, startTime });
        activeCalls.set(currentPartnerSocketId, { partnerId: socket.id, startTime });
        reconnectingUsers.delete(userId);

        const partnerProfile = await userService.getUserProfile(rejoinInfo.partnerUserId);

        socket.emit(SocketEvents.REJOIN_SUCCESS, {
            partnerId: currentPartnerSocketId,
            partnerUserId: rejoinInfo.partnerUserId,
            partnerUsername: partnerProfile?.username,
            partnerAvatar: partnerProfile?.avatar,
            partnerGender: partnerProfile?.gender,
            partnerCountry: partnerProfile?.country,
            partnerCountryCode: partnerProfile?.countryCode,
            roomId: rejoinInfo.roomId
        });

        io.to(currentPartnerSocketId).emit(SocketEvents.PARTNER_RECONNECTED, {
            newSocketId: socket.id
        });

        logger.info({ socketId: socket.id, userId, partnerId: rejoinInfo.partnerSocketId }, '[CALL] Call rejoined successfully');
    });

    socket.on(SocketEvents.CANCEL_RECONNECT, () => {
        const userId = userService.getUserId(socket.id);
        if (userId) {
            const info = reconnectingUsers.get(userId);
            if (info) {
                io.to(info.partnerSocketId).emit(SocketEvents.CALL_ENDED, { reason: 'partner-cancelled' });
                activeCalls.delete(info.partnerSocketId);
                reconnectingUsers.delete(userId);
            }
            logger.info({ socketId: socket.id, userId }, '[CALL] Reconnection cancelled');
        }
    });
};
