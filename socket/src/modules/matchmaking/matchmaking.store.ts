import { User } from '../../shared/types/socket.types';
import { activeCalls as realActiveCalls, reconnectingUsers as realReconnectingUsers } from '../call/call.store';

export const activeCalls = realActiveCalls;
export const reconnectingUsers = realReconnectingUsers;

/** Master FIFO list for voice matching */
export const voiceQueue: User[] = [];

/** Bucketed queues by country */
export const voiceBuckets = new Map<string, User[]>();

export const removeUserFromQueues = (socketId: string, country?: string): void => {
    const voiceIdx = voiceQueue.findIndex(u => u.id === socketId);
    if (voiceIdx !== -1) voiceQueue.splice(voiceIdx, 1);

    if (country) {
        const bucket = voiceBuckets.get(country);
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

export const removeUserFromQueuesByUserId = (user_id: string): void => {
    // Remove from main queue
    for (let i = voiceQueue.length - 1; i >= 0; i--) {
        if (voiceQueue[i].user_id === user_id) {
            voiceQueue.splice(i, 1);
        }
    }

    // Remove from buckets
    voiceBuckets.forEach(bucket => {
        for (let i = bucket.length - 1; i >= 0; i--) {
            if (bucket[i].user_id === user_id) {
                bucket.splice(i, 1);
            }
        }
    });
};
