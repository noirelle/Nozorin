import { Server, Socket } from 'socket.io';
import { getClientIp } from '../../core/utils/ip.utils';
import { getGeoInfo } from '../../core/utils/geo.utils';
import { userService } from '../../modules/user/user.service';
import { addConnectedUser, userMediaState } from '../store/socket.store';
import { handleUserConnection } from '../handlers/status.handler';

export const initializeSocketConnection = async (io: Server, socket: Socket) => {
    console.log(`[CONNECT] User connected: ${socket.id}`);

    const clientIp = getClientIp(socket.request);
    const geo = await getGeoInfo(clientIp);
    const country = (geo && geo.country) || 'Unknown';
    const countryCode = (geo && geo.country_code) || 'UN';

    addConnectedUser(socket.id, { country, countryCode });

    handleUserConnection(io, socket);

    userMediaState.set(socket.id, { isMuted: false });

    // Auto-register if middleware authenticated the user
    if (socket.data.user && socket.data.user.userId) {
        const { userId } = socket.data.user;
        userService.setUserForSocket(socket.id, userId);
        userService.registerUser(userId);
        console.log(`[CONNECT] Auto-registered authenticated user: ${userId}`);
    }
};
