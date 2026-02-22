/**
 * In-process user service: maps socketId ↔ userId within the realtime service.
 * For profile data (username, avatar, status) it calls the API service.
 */
import { logger } from '../../core/logger';

const API_URL = process.env.API_SERVICE_URL || 'http://nozorin_api:3001';

// ── In-memory maps ────────────────────────────────────────────────────────────
const socketToUser = new Map<string, string>(); // socketId → userId
const userToSocket = new Map<string, string>(); // userId → socketId (authoritative socket)

export const userService = {
    /** Associate socketId with a userId. Returns the previous socketId if any. */
    setUserForSocket(socketId: string, userId: string): string | null {
        const existingSocketId = userToSocket.get(userId) || null;
        socketToUser.set(socketId, userId);
        userToSocket.set(userId, socketId);
        return existingSocketId !== socketId ? existingSocketId : null;
    },

    getUserId(socketId: string): string | null {
        return socketToUser.get(socketId) || null;
    },

    getSocketId(userId: string): string | null {
        return userToSocket.get(userId) || null;
    },

    removeSocket(socketId: string): void {
        const userId = socketToUser.get(socketId);
        if (userId && userToSocket.get(userId) === socketId) {
            userToSocket.delete(userId);
        }
        socketToUser.delete(socketId);
    },

    /** Register/activate a user in the API service */
    async registerUser(userId: string): Promise<void> {
        try {
            await fetch(`${API_URL}/api/users/${userId}/register`, { method: 'POST' });
        } catch (err) {
            logger.warn({ err, userId }, '[USER-SERVICE] Failed to register user in API');
        }
    },

    /** Fetch user's online status from API */
    async getUserStatus(userId: string): Promise<unknown> {
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}/status`);
            return await res.json();
        } catch {
            return { isOnline: false, lastSeen: 0 };
        }
    },

    /** Fetch statuses for multiple users */
    async getUserStatuses(userIds: string[]): Promise<Record<string, unknown>> {
        if (!userIds.length) return {};
        try {
            const res = await fetch(`${API_URL}/api/users/statuses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds }),
            });
            return await res.json();
        } catch {
            return {};
        }
    },

    /** Check if user is registered */
    async isUserRegistered(userId: string): Promise<boolean> {
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}/exists`);
            const data = await res.json() as { exists: boolean };
            return data.exists ?? false;
        } catch {
            return false;
        }
    },

    /** Fetch full profile from API */
    async getUserProfile(userId: string): Promise<{
        username: string;
        avatar: string;
        gender: string;
    } | null> {
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}/profile`);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    },
};
