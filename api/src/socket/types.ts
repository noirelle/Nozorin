
import { User, Room } from '../types';

export type { User, Room };

export interface MediaState {
    isMuted: boolean;
    isCameraOff: boolean;
}

export interface UserConnectionInfo {
    country: string;
    countryCode: string;
}

export interface MatchData {
    mode: 'chat' | 'video';
    preferredCountry?: string;
}
