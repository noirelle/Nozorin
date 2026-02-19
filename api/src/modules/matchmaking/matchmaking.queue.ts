
import { User } from '../../shared/types/socket.types';
import {
    voiceQueue,
    voiceBuckets,
    removeUserFromQueues,
    getConnectedUser
} from '../../socket/users';
import { CONSTANTS } from './matchmaking.constants';

// State
export const userPendingMatch = new Map<string, string>(); // socketId -> roomId
const fallbackTimeouts = new Map<string, NodeJS.Timeout>(); // socketId -> timeout
export const skipLocks = new Set<string>(); // socketId -> boolean

export const QueueManager = {
    add: (user: User, resetSeniority: boolean = false) => {
        // Cleanup existing by userId
        const qIndex = voiceQueue.findIndex(u => u.userId === user.userId);
        if (qIndex !== -1) voiceQueue.splice(qIndex, 1);

        const bucket = voiceBuckets.get(user.countryCode);
        if (bucket) {
            const bIndex = bucket.findIndex(u => u.userId === user.userId);
            if (bIndex !== -1) bucket.splice(bIndex, 1);
        }

        userPendingMatch.delete(user.id);

        if (resetSeniority) {
            user.joinedAt = Date.now();
        }

        const insertSorted = (arr: User[], newUser: User) => {
            let low = 0, high = arr.length;
            while (low < high) {
                let mid = (low + high) >>> 1;
                if (arr[mid].joinedAt < newUser.joinedAt) low = mid + 1;
                else high = mid;
            }
            arr.splice(low, 0, newUser);
        };

        insertSorted(voiceQueue, user);
        if (!voiceBuckets.has(user.countryCode)) voiceBuckets.set(user.countryCode, []);
        insertSorted(voiceBuckets.get(user.countryCode)!, user);
    },
    remove: (socketId: string) => {
        skipLocks.delete(socketId);
        const userInfo = getConnectedUser(socketId);
        removeUserFromQueues(socketId, userInfo?.countryCode);
    }
};

export const notifyQueuePositions = (io: any) => {
    voiceQueue.forEach((user, index) => {
        const socket = io.sockets.sockets.get(user.id);
        if (socket) socket.emit('waiting-for-match', { position: index + 1 });
    });
};

export const setFallbackTimeout = (socketId: string, timeout: NodeJS.Timeout) => {
    fallbackTimeouts.set(socketId, timeout);
};

export const clearFallbackTimeout = (socketId: string) => {
    const timeout = fallbackTimeouts.get(socketId);
    if (timeout) {
        clearTimeout(timeout);
        fallbackTimeouts.delete(socketId);
    }
};
