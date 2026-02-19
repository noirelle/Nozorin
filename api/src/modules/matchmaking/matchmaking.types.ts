
import { User } from '../../shared/types/socket.types';

export interface PendingReconnect {
    partnerSocketId: string;
    partnerUserId: string;
    disconnectedUserId: string;
    timeout: NodeJS.Timeout;
}

export interface PendingMatch {
    pair: [User, User];
    mode: 'voice';
    startTime: number;
    acks: Set<string>;
    timeout: NodeJS.Timeout;
    roomId: string;
}
