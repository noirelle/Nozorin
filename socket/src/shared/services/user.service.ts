/**
 * In-process user service: maps socketId ↔ userId within the realtime service.
 * For profile data (username, avatar, status) it calls the API service.
 */
import { logger } from '../../core/logger';
import { getRedisClient } from '../../core/config/redis.config';

const API_URL = process.env.API_SERVICE_URL || 'http://nozorin_api:3001';

// ── In-memory maps ────────────────────────────────────────────────────────────
const socketToUser = new Map<string, string>(); // socketId → userId
const userToSockets = new Map<string, Set<string>>(); // userId → Set of socketIds

export const userService = {
    /** Associate socketId with a userId. Returns the previous primary socketId if any. */
    setUserForSocket(socketId: string, userId: string): string | null {
        const existingSockets = userToSockets.get(userId);
        const primarySocketId = existingSockets && existingSockets.size > 0 ? Array.from(existingSockets)[0] : null;

        socketToUser.set(socketId, userId);

        if (!existingSockets) {
            userToSockets.set(userId, new Set([socketId]));
        } else {
            existingSockets.add(socketId);
        }

        return primarySocketId;
    },

    getUserId(socketId: string): string | null {
        return socketToUser.get(socketId) || null;
    },

    getSocketId(userId: string): string | null {
        const sockets = userToSockets.get(userId);
        return (sockets && sockets.size > 0) ? Array.from(sockets)[0] : null;
    },

    /** Removes socket and returns true if user has NO MORE sockets left */
    removeSocket(socketId: string): boolean {
        const userId = socketToUser.get(socketId);
        if (userId) {
            const sockets = userToSockets.get(userId);
            if (sockets) {
                sockets.delete(socketId);
                if (sockets.size === 0) {
                    userToSockets.delete(userId);
                    socketToUser.delete(socketId);
                    return true; // Last socket gone
                }
            }
        }
        socketToUser.delete(socketId);
        return false;
    },

    /** Register/activate a user in the API service */
    async registerUser(userId: string): Promise<void> {
        try {
            await fetch(`${API_URL}/api/users/${userId}/register`, { method: 'POST' });
        } catch (err) {
            logger.warn({ err, userId }, '[USER-SERVICE] Failed to register user in API');
        }
    },

    /** Deactivate user in API (set offline) */
    async deactivateUser(userId: string): Promise<void> {
        try {
            await fetch(`${API_URL}/api/users/${userId}/deactivate`, { method: 'POST' });
        } catch (err) {
            logger.warn({ err, userId }, '[USER-SERVICE] Failed to deactivate user in API');
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
        country?: string;
        countryCode?: string;
    } | null> {
        // Priority 1: Fetch from Redis (cached by API on /join or /me)
        const redis = getRedisClient();
        if (redis) {
            try {
                const data = await redis.hgetall(`user:${userId}`);
                if (data && Object.keys(data).length > 0) {
                    return {
                        username: data.username,
                        avatar: data.avatar,
                        gender: data.gender,
                        country: data.country,
                        countryCode: data.country_code || data.countryCode // Handle both naming conventions
                    };
                }
            } catch (error) {
                logger.warn({ error, userId }, '[USER-SERVICE] Redis error getting profile');
            }
        }

        // Priority 2: Fallback to API
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}/profile`);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    },
};
