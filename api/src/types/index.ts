
export interface User {
    id: string;
    country: string; // Full name
    countryCode: string; // ISO Code
    mode: 'chat' | 'video';
    preferredCountry?: string;
    // ... any other fields
}

export interface Room {
    id: string;
    users: [string, string]; // partner IDs in the room or similar reference
}
