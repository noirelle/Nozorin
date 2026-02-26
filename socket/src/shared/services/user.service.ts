/**
 * In-process user service: maps socketId ↔ userId within the realtime service.
 * Accesses DB and Redis directly to avoid HTTP calls to the API.
 */
import { logger } from '../../core/logger';
import { getRedisClient } from '../../core/config/redis.config';
import { AppDataSource } from '../../core/config/database.config';
import { User } from '../../modules/user/user.entity';
import { Friend } from '../../modules/friends/friend.entity';
import { FriendRequest } from '../../modules/friends/friend-request.entity';

const STATUS_TTL = 3600; // 1 hour for status if not updated

// ── In-memory maps ────────────────────────────────────────────────────────────
const socketToUser = new Map<string, string>(); // socketId → userId
const userToSockets = new Map<string, Set<string>>(); // userId → Set of socketIds

// ── Repositories ─────────────────────────────────────────────────────────────
const userRepository = AppDataSource.getRepository(User);
const friendRepository = AppDataSource.getRepository(Friend);
const requestRepository = AppDataSource.getRepository(FriendRequest);

export const userService = {
    /** Associate socketId with a user_id. Returns the previous primary socketId if any. */
    setUserForSocket(socketId: string, user_id: string): string | null {
        const existingSockets = userToSockets.get(user_id);
        const primarySocketId = existingSockets && existingSockets.size > 0 ? Array.from(existingSockets)[0] : null;

        socketToUser.set(socketId, user_id);

        if (!existingSockets) {
            userToSockets.set(user_id, new Set([socketId]));
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

    /** Register/activate a user (marking existence in Redis) */
    async registerUser(userId: string): Promise<void> {
        const redis = getRedisClient();
        if (redis) {
            try {
                // Set a key to indicate user existence, matching API logic
                await redis.set(`user:exists:${userId}`, '1', 'EX', 30 * 24 * 60 * 60);
                // Also mark as online
                await this.updateUserStatus(userId, true);
            } catch (error) {
                logger.warn({ error, userId }, '[USER-SERVICE] Redis error registering user');
            }
        }
    },

    /** Update user online status and last seen in Redis */
    async updateUserStatus(userId: string, isOnline: boolean) {
        const status = {
            is_online: isOnline,
            last_seen: Date.now()
        };

        const redis = getRedisClient();
        if (redis) {
            try {
                await redis.setex(`user:status:${userId}`, STATUS_TTL, JSON.stringify(status));
            } catch (error) {
                logger.warn({ error, userId }, '[USER-SERVICE] Redis error updating status');
            }
        }
    },

    /** Deactivate user in DB (set offline and update last active) */
    async deactivateUser(userId: string): Promise<void> {
        logger.info({ userId }, '[USER-SERVICE] Deactivating user');
        await this.updateUserStatus(userId, false);

        try {
            await userRepository.update(userId, {
                last_active_at: Date.now()
            });
        } catch (error) {
            logger.warn({ error, userId }, '[USER-SERVICE] DB error updating last_active_at on deactivation');
        }
    },

    /** Fetch user's online status from Redis */
    async getUserStatus(userId: string): Promise<any> {
        const redis = getRedisClient();
        if (redis) {
            try {
                const statusJson = await redis.get(`user:status:${userId}`);
                if (statusJson) {
                    return JSON.parse(statusJson);
                }
            } catch (error) {
                logger.warn({ error, userId }, '[USER-SERVICE] Redis error getting status');
            }
        }
        return { is_online: false, last_seen: 0 };
    },

    /** Fetch statuses for multiple users from Redis */
    async getUserStatuses(user_ids: string[]): Promise<Record<string, unknown>> {
        const results: Record<string, unknown> = {};
        for (const userId of user_ids) {
            results[userId] = await this.getUserStatus(userId);
        }
        return results;
    },

    /** Check if user is registered in Redis */
    async isUserRegistered(userId: string): Promise<boolean> {
        const redis = getRedisClient();
        if (redis) {
            try {
                const exists = await redis.get(`user:exists:${userId}`);
                return !!exists;
            } catch (error) {
                logger.warn({ error, userId }, '[USER-SERVICE] Redis error checking user existence');
            }
        }
        return false;
    },

    /** Fetch full profile from Redis or DB */
    async getUserProfile(userId: string): Promise<any | null> {
        // Priority 1: Fetch from Redis
        const redis = getRedisClient();
        if (redis) {
            try {
                const data = await redis.hgetall(`user:${userId}`);
                if (data && Object.keys(data).length > 0) {
                    return {
                        id: userId,
                        username: data.username,
                        avatar: data.avatar,
                        gender: data.gender,
                        profile_completed: data.profile_completed === 'true',
                        is_claimed: data.is_claimed === 'true',
                        created_at: parseInt(data.created_at || '0'),
                        country: data.country,
                        country_name: data.country_name,
                        last_ip: data.last_ip,
                        device_id: data.device_id,
                        last_active_at: parseInt(data.last_active_at || '0')
                    };
                }
            } catch (error) {
                logger.warn({ error, userId }, '[USER-SERVICE] Redis error getting profile');
            }
        }

        // Priority 2: Fallback to DB
        try {
            const user = await userRepository.findOneBy({ id: userId });
            return user;
        } catch (error) {
            logger.warn({ error, userId }, '[USER-SERVICE] DB error getting profile');
            return null;
        }
    },

    /** Fetch friendship status between two users directly from DB */
    async getFriendshipStatus(user_id: string, target_id: string): Promise<string> {
        try {
            const friendship = await friendRepository.findOne({
                where: { user_id: user_id, friend_id: target_id }
            });
            if (friendship) return 'friends';

            const request = await requestRepository.findOne({
                where: [
                    { sender_id: user_id, receiver_id: target_id, status: 'pending' },
                    { sender_id: target_id, receiver_id: user_id, status: 'pending' }
                ]
            });

            if (request) {
                return request.sender_id === user_id ? 'pending_sent' : 'pending_received';
            }

            return 'none';
        } catch (error) {
            logger.warn({ error, user_id, target_id }, '[USER-SERVICE] DB error fetching friendship status');
            return 'none';
        }
    }
}
