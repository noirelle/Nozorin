
import { matchmakingClient } from '../../integrations/socket/matchmaking/matchmaking.client';
import { JoinQueueDto, LeaveQueueDto } from '../../integrations/socket/matchmaking/matchmaking.types';

class MatchmakingService {
    async joinQueue(dto: JoinQueueDto) {
        return await matchmakingClient.joinQueue(dto);
    }

    async leaveQueue(dto: LeaveQueueDto) {
        return await matchmakingClient.leaveQueue(dto);
    }
}

export const matchmakingService = new MatchmakingService();
