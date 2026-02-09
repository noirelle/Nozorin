
import { getRedisClient, checkRedisAvailability } from '../config/redis';

const STATUS_TTL = 3600; // 1 hour for status if not updated

export interface UserStatus {
    isOnline: boolean;
    lastSeen: number;
}

// Map for socketId -> userId
const socketToUserMap = new Map<string, string>();
// Map for userId -> socketId (assuming one socket per user for now)
const userToSocketMap = new Map<string, string>();

// In-memory fallback for statuses
const userStatusMemory = new Map<string, UserStatus>();

class UserService {
    /**
     * Map a socket ID to a User ID (from JWT)
     */
    setUserForSocket(socketId: string, userId: string) {
        // Cleanup old mappings if they exist
        const oldUserId = socketToUserMap.get(socketId);
        if (oldUserId) {
            userToSocketMap.delete(oldUserId);
        }

        socketToUserMap.set(socketId, userId);
        userToSocketMap.set(userId, socketId);

        // Update status as online
        this.updateUserStatus(userId, true);
    }

    /**
     * Get User ID for a Socket ID
     */
    getUserId(socketId: string): string | undefined {
        return socketToUserMap.get(socketId);
    }

    /**
     * Get Socket ID for a User ID
     */
    getSocketId(userId: string): string | undefined {
        return userToSocketMap.get(userId);
    }

    /**
     * Remove socket mapping (on disconnect)
     */
    removeSocket(socketId: string) {
        const userId = socketToUserMap.get(socketId);
        if (userId) {
            this.updateUserStatus(userId, false);
            userToSocketMap.delete(userId);
        }
        socketToUserMap.delete(socketId);
    }

    /**
     * Update user online status and last seen
     */
    async updateUserStatus(userId: string, isOnline: boolean) {
        const status: UserStatus = {
            isOnline,
            lastSeen: Date.now()
        };

        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    await redis.setex(`user:status:${userId}`, STATUS_TTL, JSON.stringify(status));
                    return;
                } catch (error) {
                    console.error('[USER] Redis error updating status:', error);
                }
            }
        }

        userStatusMemory.set(userId, status);
    }

    /**
     * Get multiple users' status
     */
    async getUserStatuses(userIds: string[]): Promise<Record<string, UserStatus>> {
        const results: Record<string, UserStatus> = {};

        // In production with many users, use Redis MGET
        for (const userId of userIds) {
            results[userId] = await this.getUserStatus(userId);
        }

        return results;
    }

    /**
     * Get a single user's status
     */
    async getUserStatus(userId: string): Promise<UserStatus> {
        // If user is currently in userToSocketMap, they are definitely online
        if (userToSocketMap.has(userId)) {
            return { isOnline: true, lastSeen: Date.now() };
        }

        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    const statusJson = await redis.get(`user:status:${userId}`);
                    if (statusJson) {
                        return JSON.parse(statusJson);
                    }
                } catch (error) {
                    console.error('[USER] Redis error getting status:', error);
                }
            }
        }

        return userStatusMemory.get(userId) || { isOnline: false, lastSeen: 0 };
    }

    /**
     * Register a user (make them 'known' to the system)
     */
    async registerUser(userId: string) {
        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    // Set a key to indicate user existence, matching JWT expiry (30 days)
                    await redis.set(`user:exists:${userId}`, '1', 'EX', 30 * 24 * 60 * 60);
                    return;
                } catch (error) {
                    console.error('[USER] Redis error registering user:', error);
                }
            }
        }

        // In-memory fallback
        userStatusMemory.set(userId, { isOnline: true, lastSeen: Date.now() });
    }

    /**
     * Check if a user is registered/known
     */
    async isUserRegistered(userId: string): Promise<boolean> {
        if (userToSocketMap.has(userId)) return true;

        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    const exists = await redis.get(`user:exists:${userId}`);
                    return !!exists;
                } catch (error) {
                    console.error('[USER] Redis error checking user existence:', error);
                }
            }
        }

        return userStatusMemory.has(userId);
    }
}

export const userService = new UserService();
