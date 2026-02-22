import { User } from '../../shared/types/socket.types';

/** Master FIFO list for voice matching */
export const voiceQueue: User[] = [];

/** Bucketed queues by countryCode */
export const voiceBuckets = new Map<string, User[]>();

/** socketId → partner socketId */
export const activeCalls = new Map<string, string>();

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
