
import { getRedisClient, checkRedisAvailability } from '../../core/config/redis.config';
import { CreateUserDto, UserProfile } from '../../shared/types/user.types';
import { getGeoInfo } from '../../core/utils/ip.utils';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../core/config/database.config';
import { User } from './user.entity';
import { Friend } from '../friend/friend.entity';
import { FriendRequest } from '../friend/friend-request.entity';

const STATUS_TTL = 3600; // 1 hour for status if not updated

export interface UserStatus {
    is_online: boolean;
    last_seen: number;
}

class UserService {
    private userRepository = AppDataSource.getRepository(User);
    private friendRepository = AppDataSource.getRepository(Friend);
    private requestRepository = AppDataSource.getRepository(FriendRequest);

    /**
     * Get friendship status between two users
     */
    async getFriendshipStatus(userId: string, targetId: string): Promise<'none' | 'friends' | 'pending_sent' | 'pending_received'> {
        try {
            // Check if already friends
            const isFriend = await this.friendRepository.findOne({
                where: { user_id: userId, friend_id: targetId }
            });

            if (isFriend) return 'friends';

            // Check if there is a pending request from user to target
            const sentRequest = await this.requestRepository.findOne({
                where: { sender_id: userId, receiver_id: targetId, status: 'pending' }
            });

            if (sentRequest) return 'pending_sent';

            // Check if there is a pending request from target to user
            const receivedRequest = await this.requestRepository.findOne({
                where: { sender_id: targetId, receiver_id: userId, status: 'pending' }
            });

            if (receivedRequest) return 'pending_received';

        } catch (error) {
            console.error('[USER] Error checking friendship status:', error);
        }

        return 'none';
    }

    /**
     * Save user footprint
     */
    async saveUserFootprint(userId: string, data: any) {
        const redis = getRedisClient();
        if (redis) {
            try {
                const footprintKey = `user:footprint:${userId}`;
                await redis.hmset(footprintKey, data);
            } catch (error) {
                console.error('[USER] Redis error saving footprint:', error);
            }
        }
    }

    /**
     * Update user online status and last seen
     */
    async updateUserStatus(userId: string, isOnline: boolean) {
        const status: UserStatus = {
            is_online: isOnline,
            last_seen: Date.now()
        };

        const redis = getRedisClient();
        if (redis) {
            try {
                await redis.setex(`user:status:${userId}`, STATUS_TTL, JSON.stringify(status));
            } catch (error) {
                console.error('[USER] Redis error updating status:', error);
            }
        }
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

        return { is_online: false, last_seen: 0 };
    }

    /**
     * Set user as active/registered
     */
    async registerUser(userId: string) {
        const redis = getRedisClient();
        if (redis) {
            try {
                // Set a key to indicate user existence, matching JWT expiry (30 days)
                await redis.set(`user:exists:${userId}`, '1', 'EX', 30 * 24 * 60 * 60);
                // Also mark as online
                await this.updateUserStatus(userId, true);
            } catch (error) {
                console.error('[USER] Redis error registering user:', error);
            }
        }
    }

    /**
     * Check if a user is registered/known
     */
    async isUserRegistered(userId: string): Promise<boolean> {
        const redis = getRedisClient();
        if (redis) {
            try {
                const exists = await redis.get(`user:exists:${userId}`);
                return !!exists;
            } catch (error) {
                console.error('[USER] Redis error checking user existence:', error);
            }
        }
        return false;
    }

    /**
     * Deactivate user (set offline and update last active)
     */
    async deactivateUser(userId: string) {
        console.log(`[USER] Deactivating user: ${userId}`);
        await this.updateUserStatus(userId, false);

        try {
            await this.userRepository.update(userId, {
                last_active_at: Date.now()
            });
        } catch (error) {
            console.error('[USER] DB error updating last_active_at:', error);
        }
    }


    /**
     * Resolve location from IP
     */
    async resolveLocation(ip: string): Promise<{ country?: string; country_name?: string }> {
        const geo = getGeoInfo(ip);
        if (geo) {
            return {
                country: geo.country,
                country_name: geo.country_name
            };
        }
        return {};
    }

    /**
     * Check if IP has an existing user
     */
    async getUserByIp(ip: string): Promise<string | null> {
        const redis = getRedisClient();
        if (redis) {
            try {
                return await redis.get(`ip:${ip}`);
            } catch (error) {
                console.error('[USER] Redis error checking IP:', error);
            }
        }
        return null;
    }

    /**
     * Get user profile by ID
     */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
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
                    } as UserProfile;
                }
            } catch (error) {
                console.error('[USER] Redis error getting profile:', error);
            }
        }

        try {
            const user = await this.userRepository.findOneBy({ id: userId });
            if (user) return user as UserProfile;
        } catch (error) {
            console.error('[USER] DB error getting profile:', error);
        }

        return null;
    }

    /**
     * Get temporary user (before token)
     */
    /**
     * Get temporary user (before token)
     */
    async getTempUser(userId: string): Promise<UserProfile | undefined> {
        const redis = getRedisClient();
        if (redis) {
            try {
                const data = await redis.get(`temp_user:${userId}`);
                if (data) {
                    return JSON.parse(data);
                }
            } catch (error) {
                console.error('[USER] Redis error getting temp user:', error);
            }
        }
        return undefined;
    }

    /**
     * Find an existing guest profile that hasn't been claimed yet
     */
    async findExistingGuest(ip: string, deviceId?: string, fingerprint?: string): Promise<UserProfile | null> {
        try {
            // Priority 1: Device ID match (Strongest, survives IP change)
            if (deviceId) {
                const user = await this.userRepository.findOne({
                    where: { device_id: deviceId, is_claimed: false },
                    order: { last_active_at: 'DESC' }
                });
                if (user) return user as UserProfile;
            }

            // Priority 2: IP + Fingerprint match (Fallback for cleared storage)
            // survives Local Storage clear, but prevents Same-Network collision
            if (fingerprint && fingerprint.length > 5) {
                console.log(`[USER] Attempting recovery via Fingerprint: ${fingerprint.substring(0, 8)}... IP: ${ip}`);
                const user = await this.userRepository.findOne({
                    where: { last_ip: ip, fingerprint: fingerprint, is_claimed: false },
                    order: { last_active_at: 'DESC' }
                });

                if (user) {
                    console.log(`[USER] Found potential match by fingerprint: ${user.id}`);
                    // Safety: Ensure we aren't hijacking an ACTIVE session from another device
                    // (e.g. if fingerprint collision occurred, which is rare but possible)
                    const status = await this.getUserStatus(user.id);
                    if (!status.is_online) {
                        console.log(`[USER] Recovery successful for ${user.id}`);
                        return user as UserProfile;
                    } else {
                        console.log(`[USER] Match found but user is ONLINE. Denying recovery.`);
                    }
                } else {
                    console.log(`[USER] No match found for Fingerprint + IP.`);
                }
            }

            // If neither matches, return null -> New User.

        } catch (error) {
            console.error('[USER] DB error finding existing guest:', error);
        }
        return null;
    }

    /**
     * Create a new guest user (WITHOUT saving to main storage yet)
     */
    async createGuestUser(data: CreateUserDto): Promise<UserProfile> {
        const userId = uuidv4();
        const { gender, agreed, ip } = data;

        // Resolve location
        const location = await this.resolveLocation(ip);

        // Generate random avatar
        const avatarIndex = Math.floor(Math.random() * 5) + 1;
        const avatar = `/avatars/avatar-${avatarIndex}.webp`;

        // Generate random username
        const adjectives = ['Happy', 'Lucky', 'Sunny', 'Cool', 'Fast', 'Smart'];
        const nouns = ['Tiger', 'Panda', 'Eagle', 'Fox', 'Wolf', 'Bear'];
        const randomNum = Math.floor(Math.random() * 1000);
        const username = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${randomNum}`;

        const newUser: UserProfile = {
            id: userId,
            username,
            avatar,
            gender,
            profile_completed: true,
            is_claimed: false,
            created_at: Date.now(),
            last_active_at: Date.now(),
            last_ip: ip,
            device_id: data.device_id,
            ...location,
            fingerprint: data.fingerprint
        };

        // Cache temporarily so token endpoint can find it
        const redis = getRedisClient();
        if (redis) {
            try {
                await redis.setex(`temp_user:${userId}`, 300, JSON.stringify(newUser));
            } catch (error) {
                console.error('[USER] Redis error caching temp user:', error);
            }
        }

        // Don't save to DB/Redis yet
        return newUser;
    }

    async saveUserProfile(userProfile: UserProfile) {
        userProfile.last_active_at = Date.now();
        try {
            const user = this.userRepository.create(userProfile);
            await this.userRepository.save(user);
            console.log(`[USER] Profile saved/updated in DB: ${user.id} | FP: ${user.fingerprint ? 'Yes' : 'No'}`);
        } catch (error) {
            console.error('[USER] DB error saving profile:', error);
        }
    }

    /**
     * Specifically cache user profile to Redis (used on /me request)
     */
    async cacheUserProfile(userProfile: UserProfile) {
        const redis = getRedisClient();
        if (!redis) return;

        try {
            await redis.hmset(`user:${userProfile.id}`, {
                username: userProfile.username,
                avatar: userProfile.avatar,
                gender: userProfile.gender,
                profile_completed: userProfile.profile_completed.toString(),
                is_claimed: userProfile.is_claimed.toString(),
                created_at: userProfile.created_at.toString(),
                ...(userProfile.country && { country: userProfile.country }),
                ...(userProfile.country_name && { country_name: userProfile.country_name }),
                ...(userProfile.last_ip && { last_ip: userProfile.last_ip }),
                ...(userProfile.device_id && { device_id: userProfile.device_id }),
                ...(userProfile.fingerprint && { fingerprint: userProfile.fingerprint }),
                last_active_at: (userProfile.last_active_at || Date.now()).toString()
            });

            // Ensure user is registered in the set of users if needed
            await this.registerUser(userProfile.id);
            console.log(`[USER] Profile cached in Redis: ${userProfile.id}`);
        } catch (error) {
            console.error('[USER] Redis error caching profile:', error);
        }
    }

    /**
     * Save session (Redis with fallback)
     */
    async saveSession(sid: string, userId: string, ttlSeconds: number = 86400) {
        const redis = getRedisClient();
        if (redis) {
            try {
                await redis.setex(`session:${sid}`, ttlSeconds, userId);
            } catch (error) {
                console.error('[USER] Redis error saving session:', error);
            }
        }
    }

    /**
     * Get session (Redis with fallback)
     */
    async getSession(sid: string): Promise<string | null> {
        const redis = getRedisClient();
        if (redis) {
            try {
                const userId = await redis.get(`session:${sid}`);
                if (userId) return userId;
            } catch (error) {
                console.error('[USER] Redis error getting session:', error);
            }
        }
        return null;
    }

    /**
     * Clean up ghost users (unclaimed profiles inactive for X days)
     */
    async cleanupGhostUsers(olderThanDays: number = 7) {
        const threshold = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
        try {
            const result = await this.userRepository
                .createQueryBuilder()
                .delete()
                .from(User)
                .where('is_claimed = :isClaimed', { isClaimed: false })
                .andWhere('last_active_at < :threshold', { threshold })
                .execute();

            if (result.affected && result.affected > 0) {
                console.log(`[USER] 🧹 Cleaned up ${result.affected} ghost users older than ${olderThanDays} days`);
            }
        } catch (error) {
            console.error('[USER] ❌ Error cleaning up ghost users:', error);
        }
    }
}

export const userService = new UserService();
