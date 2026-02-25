import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { logger } from '../../core/logger';
import { userService } from '../../shared/services/user.service';
import { activeCalls, reconnectingUsers } from './call.store';
import { historyService } from '../history/history.service';
import { CallDisconnectReason } from '../../shared/types/socket.types';

export const callService = {
    handleEndCall: async (io: Server, socketId: string, data: { target: string | null; reason?: CallDisconnectReason }) => {
        const info = activeCalls.get(socketId);
        const partnerId = data?.target || info?.partnerId;
        const reason: CallDisconnectReason = data?.reason || 'skip';

        if (partnerId) {
            const partnerInfo = activeCalls.get(partnerId);

            // Capture data for history before deleting state
            const startTime = info?.startTime;
            const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

            // Delete state immediately to prevent re-entry
            activeCalls.delete(partnerId);
            activeCalls.delete(socketId);

            const userId = userService.getUserId(socketId);
            if (userId) reconnectingUsers.delete(userId);
            const partnerUserId = userService.getUserId(partnerId);
            if (partnerUserId) reconnectingUsers.delete(partnerUserId);

            // Notify partner
            io.to(partnerId).emit(SocketEvents.CALL_ENDED, { by: socketId, reason });

            // Record history if we have start time
            if (startTime) {
                const reason1 = reason;
                const reason2: CallDisconnectReason = reason === 'skip' ? 'partner-skip' : 'partner-disconnect';
                await callService.reportHistory(socketId, partnerId, duration, reason1, reason2);
            }

            logger.info({ socketId, partnerId, reason }, '[CALL] Call ended');
            return true;
        }

        logger.debug({ socketId, target: data?.target }, '[CALL] End call requested but no active partner found');
        return true;
    },

    handleDisconnect: async (io: Server, socketId: string) => {
        const info = activeCalls.get(socketId);
        const partnerId = info?.partnerId;
        const userId = userService.getUserId(socketId);

        if (partnerId && userId) {
            const partnerUserId = userService.getUserId(partnerId);
            reconnectingUsers.set(userId, {
                partnerSocketId: partnerId,
                partnerUserId: partnerUserId || 'unknown',
                roomId: `match-${socketId}-${partnerId}`,
                startTime: info.startTime,
                expiresAt: Date.now() + 30000
            });

            io.to(partnerId).emit(SocketEvents.PARTNER_RECONNECTING, { timeoutMs: 30000 });
            logger.info({ socketId, userId, partnerId }, '[CALL] Partner disconnected, starting grace period');
        } else if (partnerId) {
            // No chance to reconnect, end it and record
            const startTime = info?.startTime;
            const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

            // Delete state immediately
            activeCalls.delete(partnerId);
            activeCalls.delete(socketId);

            io.to(partnerId).emit(SocketEvents.CALL_ENDED, { by: socketId, reason: 'partner-disconnect' });

            if (startTime) {
                await callService.reportHistory(socketId, partnerId, duration, 'user-action', 'partner-disconnect');
            }
        }
    },

    cleanupExpiredSessions: async (io: Server) => {
        const now = Date.now();
        for (const [userId, info] of reconnectingUsers.entries()) {
            if (now > info.expiresAt) {
                reconnectingUsers.delete(userId);

                const activeInfo = activeCalls.get(info.partnerSocketId);
                if (activeInfo) {
                    const startTime = activeInfo.startTime;
                    const duration = startTime ? Math.floor((now - startTime) / 1000) : 0;

                    // We don't have the original socketId easily here, but we can use info.partnerSocketId's partner
                    const originalSocketId = [...activeCalls.entries()].find(([k, v]) => v.partnerId === info.partnerSocketId)?.[0];

                    // Clear state before async ops
                    activeCalls.delete(info.partnerSocketId);
                    if (originalSocketId) {
                        activeCalls.delete(originalSocketId);
                    }

                    const partnerSocket = io.sockets.sockets.get(info.partnerSocketId);
                    if (partnerSocket) {
                        partnerSocket.emit(SocketEvents.CALL_ENDED, { reason: 'partner-disconnect' });
                    }

                    if (originalSocketId && startTime) {
                        await callService.reportHistory(originalSocketId, info.partnerSocketId, duration, 'timeout', 'partner-disconnect');
                    }
                }
                logger.info({ userId }, '[CALL] Reconnection grace period expired');
            }
        }
    },

    reportHistory: async (userId1: string, userId2: string, duration: number, reason1: CallDisconnectReason = 'skip', reason2?: CallDisconnectReason) => {
        const u1 = userService.getUserId(userId1);
        const u2 = userService.getUserId(userId2);
        if (!u1 || !u2) return;

        const p1 = await userService.getUserProfile(u1);
        const p2 = await userService.getUserProfile(u2);

        // If reason2 is not provided, we might want to derive it or use reason1 for both
        const finalReason2 = reason2 || (reason1 === 'skip' ? 'partner-skip' : reason1);

        const save = async (uid: string, partner: any, r: CallDisconnectReason) => {
            await historyService.addHistory({
                user_id: uid,
                partner_id: partner.id,
                partner_username: partner.username,
                partner_avatar: partner.avatar,
                partner_country: partner.country,
                partner_country_code: partner.countryCode,
                duration,
                mode: 'voice',
                reason: r
            });
        };

        if (u1 && u1 !== 'unknown' && p2) await save(u1, { ...p2, id: u2 }, reason1);
        if (u2 && u2 !== 'unknown' && p1) await save(u2, { ...p1, id: u1 }, finalReason2);
    }
};
