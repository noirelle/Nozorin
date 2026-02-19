
import { User, MediaState, UserConnectionInfo } from './types';

// State Containers
// Master FIFO list for voice matching
export const voiceQueue: User[] = [];

// Bucketed queues (Country index for O(1) lookup)
export const voiceBuckets = new Map<string, User[]>();

export const activeCalls = new Map<string, string>(); // socketId -> partnerId
export const userMediaState = new Map<string, MediaState>(); // socketId -> media state
const connectedUsers = new Map<string, UserConnectionInfo>(); // socketId -> Info
const activeUsers = new Set<string>(); // socketId

export const getConnectedUser = (socketId: string) => connectedUsers.get(socketId);
export const addConnectedUser = (socketId: string, info: UserConnectionInfo) => connectedUsers.set(socketId, info);
export const removeConnectedUser = (socketId: string) => connectedUsers.delete(socketId);

export const getActiveUserCount = () => activeUsers.size;
export const addActiveUser = (socketId: string) => activeUsers.add(socketId);
export const removeActiveUser = (socketId: string) => activeUsers.delete(socketId);

// Helpers
export const removeUserFromQueues = (socketId: string, countryCode?: string) => {
    // 1. Remove from global voice queue
    const voiceIndex = voiceQueue.findIndex(u => u.id === socketId);
    if (voiceIndex !== -1) voiceQueue.splice(voiceIndex, 1);

    // 2. Remove from bucketed queues
    if (countryCode) {
        // Optimized O(1) removal
        const vBucket = voiceBuckets.get(countryCode);
        if (vBucket) {
            const idx = vBucket.findIndex(u => u.id === socketId);
            if (idx !== -1) vBucket.splice(idx, 1);
        }
    } else {
        // Fallback for when we don't have the country code (e.g. on raw disconnect)
        voiceBuckets.forEach(bucket => {
            const idx = bucket.findIndex(u => u.id === socketId);
            if (idx !== -1) bucket.splice(idx, 1);
        });
    }
};
