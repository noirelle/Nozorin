import { User } from '../../shared/types/socket.types';

/** Master FIFO list for voice matching */
export const voiceQueue: User[] = [];

/** Bucketed queues by countryCode */
export const voiceBuckets = new Map<string, User[]>();

/** socketId → partner socketId */
export const activeCalls = new Map<string, string>();

/** userId → reconnection info */
export interface RejoinInfo {
    partnerSocketId: string;
    partnerUserId: string;
    roomId: string;
    expiresAt: number;
}
export const reconnectingUsers = new Map<string, RejoinInfo>();

export const removeUserFromQueues = (socketId: string, countryCode?: string): void => {
    const voiceIdx = voiceQueue.findIndex(u => u.id === socketId);
    if (voiceIdx !== -1) voiceQueue.splice(voiceIdx, 1);

    if (countryCode) {
        const bucket = voiceBuckets.get(countryCode);
        if (bucket) {
            const idx = bucket.findIndex(u => u.id === socketId);
            if (idx !== -1) bucket.splice(idx, 1);
        }
    } else {
        voiceBuckets.forEach(bucket => {
            const idx = bucket.findIndex(u => u.id === socketId);
            if (idx !== -1) bucket.splice(idx, 1);
        });
    }
};

export const removeUserFromQueuesByUserId = (userId: string): void => {
    // Remove from main queue
    for (let i = voiceQueue.length - 1; i >= 0; i--) {
        if (voiceQueue[i].userId === userId) {
            voiceQueue.splice(i, 1);
        }
    }

    // Remove from buckets
    voiceBuckets.forEach(bucket => {
        for (let i = bucket.length - 1; i >= 0; i--) {
            if (bucket[i].userId === userId) {
                bucket.splice(i, 1);
            }
        }
    });
};
