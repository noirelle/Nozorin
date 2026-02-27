import { Server, Socket } from 'socket.io';
import { getClientIp, getGeoInfo } from '../../core/utils/ip.utils';
import { userService } from '../../shared/services/user.service';
import { addConnectedUser } from '../../modules/tracking/tracking.service';
import { presenceService } from '../../modules/presence/presence.service';
import { logger } from '../../core/logger';
import { SocketEvents } from '../socket.events';
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
        userService.setUserForSocket(socket.id, user_id);
        await userService.registerUser(user_id);
        logger.info({ socketId: socket.id, user_id: user_id.substring(0, 8) }, '[CONNECT] Auto-registered');
        socket.emit(SocketEvents.IDENTIFY_SUCCESS, { user_id, auto: true });
    }
};
