
import { SocketHttpClient } from '../socket.http';
import { SocketResponse } from '../socket.types';

export interface SignalCallRequest {
    caller_user_id: string;
    target_user_id: string;
    mode: 'voice' | 'video';
}

export interface SignalCallResponse {
    caller_user_id: string;
    target_user_id: string;
    accepted: boolean;
    mode: 'voice' | 'video';
}

class CallClient extends SocketHttpClient {
    async requestCall(data: SignalCallRequest): Promise<SocketResponse> {
        return this.post('/calls/request', data);
    }

    async respondToCall(data: SignalCallResponse): Promise<SocketResponse> {
        return this.post('/calls/respond', data);
    }
}

export const callClient = new CallClient();
