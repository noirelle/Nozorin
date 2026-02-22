import { Server, Socket } from 'socket.io';
import { getClientIp } from '../../core/utils/ip.utils';
import { getGeoInfo } from '../../core/utils/geo.utils';
import { userService } from '../../shared/services/user.service';
import { addConnectedUser } from '../../modules/tracking';
import { statusService } from '../../modules/status/status.service';
import { logger } from '../../core/logger';

export const initializeSocketConnection = async (io: Server, socket: Socket): Promise<void> => {
    logger.info({ socketId: socket.id }, '[CONNECT] New connection');

    const clientIp = getClientIp(socket.request);
    const geo = await getGeoInfo(clientIp);
    const country = geo?.country || 'Unknown';
    const countryCode = geo?.country_code || 'UN';

    addConnectedUser(socket.id, { country, countryCode });
    statusService.handleConnection(io, socket);

    // Auto-register if auth middleware parsed a token
    if (socket.data.user?.userId) {
        const { userId } = socket.data.user;
        userService.setUserForSocket(socket.id, userId);
        await userService.registerUser(userId);
        logger.info({ socketId: socket.id, userId: userId.substring(0, 8) }, '[CONNECT] Auto-registered');
    }
};
