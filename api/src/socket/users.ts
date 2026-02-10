
import { User, MediaState, UserConnectionInfo } from './types';

// State Containers
// Note: We export these as consts but the content is mutable. 
// Ideally we might wrap these in a service class, but to keep the refactor simple
// we will expose them directly or via helper functions.

// Global queues (Master FIFO lists)
export const chatQueue: User[] = [];
export const videoQueue: User[] = [];

// Bucketed queues (Country index for O(1) lookup)
// Map<mode, Map<countryCode, User[]>>
export const chatBuckets = new Map<string, User[]>();
export const videoBuckets = new Map<string, User[]>();

export const activeCalls = new Map<string, string>(); // socketId -> partnerId
export const userMediaState = new Map<string, MediaState>(); // socketId -> media state
export const connectedUsers = new Map<string, UserConnectionInfo>(); // socketId -> Info
export const activeUsers = new Set<string>(); // socketId

// Helpers
export const removeUserFromQueues = (socketId: string, countryCode?: string) => {
    // 1. Remove from global queues
    const chatIndex = chatQueue.findIndex(u => u.id === socketId);
    if (chatIndex !== -1) chatQueue.splice(chatIndex, 1);

    const videoIndex = videoQueue.findIndex(u => u.id === socketId);
    if (videoIndex !== -1) videoQueue.splice(videoIndex, 1);

    // 2. Remove from bucketed queues
    if (countryCode) {
        // Optimized O(1) removal
        const cBucket = chatBuckets.get(countryCode);
        if (cBucket) {
            const idx = cBucket.findIndex(u => u.id === socketId);
            if (idx !== -1) cBucket.splice(idx, 1);
        }
        const vBucket = videoBuckets.get(countryCode);
        if (vBucket) {
            const idx = vBucket.findIndex(u => u.id === socketId);
            if (idx !== -1) vBucket.splice(idx, 1);
        }
    } else {
        // Fallback for when we don't have the country code (e.g. on raw disconnect)
        chatBuckets.forEach(bucket => {
            const idx = bucket.findIndex(u => u.id === socketId);
            if (idx !== -1) bucket.splice(idx, 1);
        });
        videoBuckets.forEach(bucket => {
            const idx = bucket.findIndex(u => u.id === socketId);
            if (idx !== -1) bucket.splice(idx, 1);
        });
    }
};
