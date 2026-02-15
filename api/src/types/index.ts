export type MatchState = 'IDLE' | 'FINDING' | 'NEGOTIATING' | 'MATCHED';

export interface User {
    id: string; // Socket ID
    userId: string; // Persistent Visitor ID
    country: string; // Full name
    countryCode: string; // ISO Code
    mode: 'chat' | 'voice';
    preferredCountry?: string;
    joinedAt: number; // For strict FIFO ordering
    state: MatchState;
}

export interface Room {
    id: string;
    users: [string, string]; // partner IDs in the room or similar reference
}

export * from './user';
