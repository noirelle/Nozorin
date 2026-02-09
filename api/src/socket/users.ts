
import { User, MediaState, UserConnectionInfo } from './types';

// State Containers
// Note: We export these as consts but the content is mutable. 
// Ideally we might wrap these in a service class, but to keep the refactor simple
// we will expose them directly or via helper functions.

export const chatQueue: User[] = [];
export const videoQueue: User[] = [];
export const activeCalls = new Map<string, string>(); // socketId -> partnerId
export const userMediaState = new Map<string, MediaState>(); // socketId -> media state
export const connectedUsers = new Map<string, UserConnectionInfo>(); // socketId -> Info
export const activeUsers = new Set<string>(); // socketId

// Helpers
export const removeUserFromQueues = (socketId: string) => {
    const chatIndex = chatQueue.findIndex(u => u.id === socketId);
    if (chatIndex !== -1) chatQueue.splice(chatIndex, 1);

    const videoIndex = videoQueue.findIndex(u => u.id === socketId);
    if (videoIndex !== -1) videoQueue.splice(videoIndex, 1);
};
