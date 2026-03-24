import { Server, Socket } from 'socket.io';
import { getClientIp, getGeoInfo } from '../../core/utils/ip.utils';
import { userService } from '../../shared/services/user.service';
import { addConnectedUser } from '../../modules/tracking/tracking.service';
import { presenceService } from '../../modules/presence/presence.service';
import * as matchmakingService from '../../modules/matchmaking/matchmaking.service';
import { logger } from '../../core/logger';
import { SocketEvents } from '../socket.events';

import { authService } from '../../modules/auth/auth.service';
import { callService } from '../../modules/call/call.service';

export const initializeSocketConnection = async (io: Server, socket: Socket): Promise<void> => {
    logger.info({ socketId: socket.id }, '[CONNECT] New connection');

    const clientIp = getClientIp(socket.request);
    const geo = getGeoInfo(clientIp);
    const country = geo?.country || 'Unknown';
    const country_name = geo?.country_name || 'Unknown';

    addConnectedUser(socket.id, { country, country_name });
    presenceService.handleConnection(io, socket);

    // Auto-register if auth middleware parsed a token
    if (socket.data.user?.user_id) {
        const { user_id } = socket.data.user;

        // Cleanup other sessions BEFORE registering this new one
        await authService.cleanupOtherSessions(io, user_id, socket.id);

        userService.setUserForSocket(socket.id, user_id);
        userService.joinUserRoom(socket, user_id);
        await userService.registerUser(user_id);

        // SYNC: update queue if already there (edge case)
        const profile = await userService.getUserProfile(user_id);
        if (profile) {
            await matchmakingService.updateUserInQueue(socket.id, profile);
        }

        await presenceService.handleUserConnection(io, user_id, socket.id);

        // Proactive Session Push: check for active call and notify client immediately
        const activeCall = await callService.getActiveCall(user_id);
        if (activeCall) {
            const partnerProfile = await userService.getUserProfile(activeCall.partner_user_id);
            socket.emit(SocketEvents.IDENTIFY_SUCCESS, {
                user_id,
                auto: true,
                active_session: {
                    ...activeCall,
                    partner_profile: partnerProfile
                }
            });
            logger.info({ userId: user_id, partnerId: activeCall.partner_user_id }, '[CONNECT] Auto-registered and pushed active session');
        } else {
            socket.emit(SocketEvents.IDENTIFY_SUCCESS, { user_id, auto: true });
            logger.info({ socketId: socket.id, user_id: user_id.substring(0, 8) }, '[CONNECT] Auto-registered');
        }
    }
};
