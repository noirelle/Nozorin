
export interface User {
    id: string; // Socket ID
    userId: string; // Persistent Visitor ID
    country: string; // Full name
    countryCode: string; // ISO Code
    mode: 'chat' | 'video';
    preferredCountry?: string;
    joinedAt: number; // For strict FIFO ordering
}

export interface Room {
    id: string;
    users: [string, string]; // partner IDs in the room or similar reference
}
