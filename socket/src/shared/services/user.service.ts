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
import { UserProfile } from '../types/socket.types';

const ONLINE_TTL = 150; // 2.5 minutes (allows for ~5 missed heartbeats)
const OFFLINE_TTL = 7 * 24 * 60 * 60; // 7 days
const DB_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// ── In-memory maps ────────────────────────────────────────────────────────────
const socketToUser = new Map<string, string>(); // socketId → userId
const userToSockets = new Map<string, Set<string>>(); // userId → Set of socketIds
const lastDbSync = new Map<string, number>(); // userId → timestamp

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
            // Memory guard: cap sockets per user to prevent unbounded Set growth
            if (existingSockets.size >= 5) {
                const oldestSocketId = Array.from(existingSockets)[0];
                existingSockets.delete(oldestSocketId);
                socketToUser.delete(oldestSocketId);
                logger.warn({ user_id, removedSocketId: oldestSocketId }, '[USER-SERVICE] Capped sockets per user, removing oldest');
            }
            existingSockets.add(socketId);
        }

        return primarySocketId;
    },

    /** Helper to have a socket join its private user room */
    joinUserRoom(socket: any, userId: string): void {
        const room = `user:${userId}`;
        socket.join(room);
        logger.debug({ socketId: socket.id, userId }, '[USER-SERVICE] Socket joined user room');
    },

    getUserId(socketId: string): string | null {
        return socketToUser.get(socketId) || null;
    },

    getSocketId(userId: string): string | null {
        const sockets = userToSockets.get(userId);
        if (!sockets || sockets.size === 0) return null;
        // Return the LAST added socket (most recent) to avoid stale references during fast refresh
        return Array.from(sockets).slice(-1)[0];
    },

    /** Returns all socket IDs associated with a user */
    getAllSockets(userId: string): string[] {
        const sockets = userToSockets.get(userId);
        return sockets ? Array.from(sockets) : [];
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

    /** Returns all user IDs currently associated with at least one socket */
    getActiveUserIds(): string[] {
        return Array.from(userToSockets.keys());
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
        const lastSeen = Date.now();
        const status = {
            is_online: isOnline,
            last_seen: lastSeen
        };

        const redis = getRedisClient();
        if (redis) {
            try {
                const ttl = isOnline ? ONLINE_TTL : OFFLINE_TTL;
                await redis.setex(`user:status:${userId}`, ttl, JSON.stringify(status));
            } catch (error) {
                logger.warn({ error, userId }, '[USER-SERVICE] Redis error updating status');
            }
        }

        // Sync to DB if going offline, OR if online and it's time for a periodic refresh
        const now = Date.now();
        const lastSync = lastDbSync.get(userId) || 0;
        const shouldSync = !isOnline || (now - lastSync > DB_SYNC_INTERVAL);

        if (shouldSync) {
            try {
                await userRepository.update(userId, {
                    last_active_at: lastSeen,
                    is_online: isOnline
                });
                lastDbSync.set(userId, now);
                if (!isOnline) lastDbSync.delete(userId);
            } catch (error) {
                logger.warn({ error, userId }, '[USER-SERVICE] DB error updating user status');
            }
        }
    },

    /** Deactivate user in DB (set offline and update last active) */
    async deactivateUser(userId: string): Promise<void> {
        logger.info({ userId }, '[USER-SERVICE] Deactivating user');
        await this.updateUserStatus(userId, false);

        try {
            await userRepository.update(userId, {
                last_active_at: Date.now(),
                is_online: false
            });
        } catch (error) {
            logger.warn({ error, userId }, '[USER-SERVICE] DB error updating user deactivation');
        }
    },

    /** Fetch user's online status (Redis -> DB fallback with zombie protection) */
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

        // Fallback to DB with zombie protection
        try {
            const user = await userRepository.findOne({
                where: { id: userId },
                select: ['last_active_at', 'is_online']
            });

            if (user) {
                const lastSeen = Number(user.last_active_at) || 0;
                const zombieCutoff = Date.now() - (15 * 60 * 1000);
                const isOnline = user.is_online && lastSeen > zombieCutoff;

                return {
                    is_online: isOnline,
                    last_seen: lastSeen
                };
            }
        } catch (error) {
            logger.warn({ error, userId }, '[USER-SERVICE] DB fallback error getting status');
        }

        return { is_online: false, last_seen: 0, is_deleted: true };
    },

    /** Fetch statuses for multiple users in a single batch (MGET with DB fallback) */
    async getUserStatuses(user_ids: string[]): Promise<Record<string, any>> {
        if (!user_ids.length) return {};

        const results: Record<string, any> = {};
        const missingUserIds: string[] = [];
        const redis = getRedisClient();

        if (redis) {
            try {
                const keys = user_ids.map(id => `user:status:${id}`);
                const statuses = await redis.mget(...keys);

                user_ids.forEach((userId, index) => {
                    const statusJson = statuses[index];
                    if (statusJson) {
                        try {
                            results[userId] = JSON.parse(statusJson);
                        } catch (e) {
                            missingUserIds.push(userId);
                        }
                    } else {
                        missingUserIds.push(userId);
                    }
                });
            } catch (error) {
                logger.warn({ error }, '[USER-SERVICE] Redis error in batch getUserStatuses');
                missingUserIds.push(...user_ids);
            }
        } else {
            missingUserIds.push(...user_ids);
        }

        // Fetch missing from DB in one query
        if (missingUserIds.length > 0) {
            try {
                const users = await userRepository.findByIds(missingUserIds);
                const zombieCutoff = Date.now() - (15 * 60 * 1000);

                users.forEach(user => {
                    const lastSeen = Number(user.last_active_at) || 0;
                    results[user.id] = {
                        is_online: user.is_online && lastSeen > zombieCutoff,
                        last_seen: lastSeen
                    };
                });

                // Fill defaults for any still missing
                missingUserIds.forEach(id => {
                    if (!results[id]) results[id] = { is_online: false, last_seen: 0 };
                });
            } catch (error) {
                logger.warn({ error }, '[USER-SERVICE] DB fallback error in batch getUserStatuses');
            }
        }

        return results;
    },

    /** Mark users as offline if they've been inactive for too long (Self-healing job) */
    async cleanupZombieStatuses(): Promise<void> {
        const zombieCutoff = Date.now() - (15 * 60 * 1000);
        try {
            const result = await userRepository.createQueryBuilder()
                .update(User)
                .set({ is_online: false })
                .where('is_online = :isOnline', { isOnline: true })
                .andWhere('last_active_at < :cutoff', { cutoff: zombieCutoff })
                .execute();

            if (result.affected && result.affected > 0) {
                logger.info({ affected: result.affected }, '[USER-SERVICE] Cleaned up zombie online statuses');
            }
        } catch (error) {
            logger.error({ error }, '[USER-SERVICE] Failed to cleanup zombie statuses');
        }
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
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        const redis = getRedisClient();
        if (redis) {
            try {
                // Tier 1: Standard Profile (Hash)
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

                // Tier 2: Temp User (JSON) - Used for guests who just registered
                const tempJson = await redis.get(`temp_user:${userId}`);
                if (tempJson) {
                    try {
                        const tempData = JSON.parse(tempJson);
                        return {
                            id: userId,
                            username: tempData.username ?? 'Anonymous',
                            avatar: tempData.avatar ?? '/avatars/avatar1.webp',
                            gender: tempData.gender ?? 'unknown',
                            profile_completed: false,
                            is_claimed: false,
                            created_at: tempData.created_at ?? Date.now(),
                            country: tempData.country ?? 'UN',
                            country_name: tempData.country_name ?? 'Unknown',
                            last_ip: tempData.last_ip,
                            device_id: tempData.device_id,
                            last_active_at: Date.now()
                        };
                    } catch (e) {
                        logger.warn({ userId }, '[USER-SERVICE] Failed to parse temp_user JSON');
                    }
                }
            } catch (error) {
                logger.warn({ error, userId }, '[USER-SERVICE] Redis error getting profile');
            }
        }

        // Priority 3: Fallback to DB
        try {
            const user = await userRepository.findOneBy({ id: userId });
            if (!user) return null;

            return {
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                gender: user.gender,
                profile_completed: user.profile_completed,
                is_claimed: user.is_claimed,
                created_at: Number(user.created_at),
                country: user.country ?? 'UN',
                country_name: user.country_name ?? 'Unknown',
                last_ip: user.last_ip,
                device_id: user.device_id,
                last_active_at: Number(user.last_active_at)
            };
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
