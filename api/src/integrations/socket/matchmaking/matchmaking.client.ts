
import { SocketHttpClient } from '../socket.http';
import { JoinQueueDto, LeaveQueueDto, JoinQueueResponse } from './matchmaking.types';
import { SocketResponse } from '../socket.types';

class MatchmakingClient extends SocketHttpClient {
    async joinQueue(dto: JoinQueueDto): Promise<SocketResponse<JoinQueueResponse>> {
        return this.post<JoinQueueResponse>('/queue/join', dto);
    }

    async leaveQueue(dto: LeaveQueueDto): Promise<SocketResponse<void>> {
        return this.post<void>('/queue/leave', dto);
    }
}

export const matchmakingClient = new MatchmakingClient();
