
import { User, Room } from '../shared/types/socket.types';

export type { User, Room };

export interface MediaState {
    isMuted: boolean;
}

export interface UserConnectionInfo {
    country: string;
    countryCode: string;
}

export interface MatchData {
    mode: 'chat' | 'voice';
    preferredCountry?: string;
}
