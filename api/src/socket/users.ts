
import { User, MediaState, UserConnectionInfo } from './types';

// State Containers
// Master FIFO list for video matching
export const videoQueue: User[] = [];

// Bucketed queues (Country index for O(1) lookup)
export const videoBuckets = new Map<string, User[]>();

export const activeCalls = new Map<string, string>(); // socketId -> partnerId
export const userMediaState = new Map<string, MediaState>(); // socketId -> media state
export const connectedUsers = new Map<string, UserConnectionInfo>(); // socketId -> Info
export const activeUsers = new Set<string>(); // socketId

// Helpers
export const removeUserFromQueues = (socketId: string, countryCode?: string) => {
    // 1. Remove from global video queue
    const videoIndex = videoQueue.findIndex(u => u.id === socketId);
    if (videoIndex !== -1) videoQueue.splice(videoIndex, 1);

    // 2. Remove from bucketed queues
    if (countryCode) {
        // Optimized O(1) removal
        const vBucket = videoBuckets.get(countryCode);
        if (vBucket) {
            const idx = vBucket.findIndex(u => u.id === socketId);
            if (idx !== -1) vBucket.splice(idx, 1);
        }
    } else {
        // Fallback for when we don't have the country code (e.g. on raw disconnect)
        videoBuckets.forEach(bucket => {
            const idx = bucket.findIndex(u => u.id === socketId);
            if (idx !== -1) bucket.splice(idx, 1);
        });
    }
};
