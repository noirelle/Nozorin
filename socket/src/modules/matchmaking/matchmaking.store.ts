import { User } from '../../shared/types/socket.types';
import { activeCalls as realActiveCalls, reconnectingUsers as realReconnectingUsers } from '../call/call.store';

export const activeCalls = realActiveCalls;
export const reconnectingUsers = realReconnectingUsers;

/** Master FIFO list for voice matching */
export const voiceQueue: User[] = [];

/** Bucketed queues by countryCode */
export const voiceBuckets = new Map<string, User[]>();

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
