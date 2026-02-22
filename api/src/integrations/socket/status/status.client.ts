
import { SocketHttpClient } from '../socket.http';
import { OnlineStatus } from './status.types';
import { SocketResponse } from '../socket.types';

class StatusClient extends SocketHttpClient {
    async getGlobalStats(): Promise<SocketResponse<OnlineStatus>> {
        return this.get<OnlineStatus>('/status/global');
    }
}

export const statusClient = new StatusClient();
