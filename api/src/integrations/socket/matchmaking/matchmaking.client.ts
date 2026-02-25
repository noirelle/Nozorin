
import { SocketHttpClient } from '../socket.http';
import { JoinQueueDto, LeaveQueueDto, JoinQueueResponse } from './matchmaking.types';
import { SocketResponse } from '../socket.types';

class MatchmakingClient extends SocketHttpClient {
    async joinQueue(dto: JoinQueueDto): Promise<SocketResponse<JoinQueueResponse>> {
        const payload = {
            user_id: dto.userId,
            mode: dto.mode,
            preferences: dto.preferences ? {
                selected_country: dto.preferences.selectedCountry,
                language: dto.preferences.language,
                min_rating: dto.preferences.minRating
            } : undefined,
            peer_id: dto.peerId,
            request_id: dto.requestId
        };
        return this.post<JoinQueueResponse>('/queue/join', payload);
    }

    async leaveQueue(dto: LeaveQueueDto): Promise<SocketResponse<void>> {
        return this.post<void>('/queue/leave', { user_id: dto.userId });
    }
}

export const matchmakingClient = new MatchmakingClient();
