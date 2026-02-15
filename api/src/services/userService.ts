
import { getRedisClient, checkRedisAvailability } from '../config/redis';
import { CreateUserDto, UserProfile } from '../types';
import geoip from 'geoip-lite';
import { v4 as uuidv4 } from 'uuid';

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
// In-memory fallback for profiles
const userProfilesMemory = new Map<string, UserProfile>();

// Temporary cache for guest users before token confirmation (5 min TTL ideally)
const tempUserCache = new Map<string, UserProfile>();
// In-memory fallback for sessions
const sessionMemory = new Map<string, string>();

class UserService {

    /**
     * Save user footprint
     */
    async saveUserFootprint(userId: string, data: any) {
        if (checkRedisAvailability()) {
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
    }

    /**
     * Map a socket ID to a User ID (from JWT)
     */
    setUserForSocket(socketId: string, userId: string): string | undefined {
        const oldSocketId = userToSocketMap.get(userId);

        // Cleanup old mapping if it exists for this socket
        const prevUserIdForSocket = socketToUserMap.get(socketId);
        if (prevUserIdForSocket && prevUserIdForSocket !== userId) {
            userToSocketMap.delete(prevUserIdForSocket);
        }

        socketToUserMap.set(socketId, userId);
        userToSocketMap.set(userId, socketId);

        // Update status as online
        this.updateUserStatus(userId, true);

        return oldSocketId;
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
            // Only update status and clear mapping if this is still the active socket for the user
            // This prevents an old session's disconnect from killing a newly established session (takeover)
            if (userToSocketMap.get(userId) === socketId) {
                this.updateUserStatus(userId, false);
                userToSocketMap.delete(userId);
            }
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

    /**
     * Resolve location from IP
     */
    resolveLocation(ip: string): { country?: string; city?: string; region?: string; lat?: number; lon?: number; timezone?: string } {
        const geo = geoip.lookup(ip);
        if (geo) {
            return {
                country: geo.country,
                city: geo.city,
                region: geo.region,
                lat: geo.ll ? geo.ll[0] : undefined,
                lon: geo.ll ? geo.ll[1] : undefined,
                timezone: geo.timezone
            };
        }
        return {};
    }

    /**
     * Check if IP has an existing user
     */
    async getUserByIp(ip: string): Promise<string | null> {
        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    return await redis.get(`ip:${ip}`);
                } catch (error) {
                    console.error('[USER] Redis error checking IP:', error);
                }
            }
        }
        return null;
    }

    /**
     * Get user profile by ID
     */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    const data = await redis.hgetall(`user:${userId}`);
                    if (Object.keys(data).length === 0) return null;

                    // Parse boolean and number fields
                    return {
                        id: userId,
                        username: data.username,
                        avatar: data.avatar,
                        gender: data.gender,
                        profile_completed: data.profile_completed === 'true',
                        is_claimed: data.is_claimed === 'true',
                        created_at: parseInt(data.created_at || '0'),
                        country: data.country,
                        city: data.city,
                        region: data.region,
                        lat: data.lat ? parseFloat(data.lat) : undefined,
                        lon: data.lon ? parseFloat(data.lon) : undefined,
                        timezone: data.timezone
                    } as UserProfile;
                } catch (error) {
                    console.error('[USER] Redis error getting profile:', error);
                }
            }
        }
        return userProfilesMemory.get(userId) || null;
    }

    /**
     * Get temporary user (before token)
     */
    getTempUser(userId: string): UserProfile | undefined {
        return tempUserCache.get(userId);
    }

    /**
     * Create a new guest user (WITHOUT saving to main storage yet)
     */
    async createGuestUser(data: CreateUserDto): Promise<UserProfile> {
        const userId = uuidv4();
        const { gender, agreed, ip } = data;

        // Resolve location
        const location = this.resolveLocation(ip);

        // Generate random avatar
        const avatarIndex = Math.floor(Math.random() * 5) + 1;
        const avatar = `/avatars/avatar${avatarIndex}.webp`;

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
            ...location
        };

        // Cache temporarily so token endpoint can find it
        tempUserCache.set(userId, newUser);

        // Don't save to Redis/Main Memory yet
        return newUser;
    }
    async saveUserProfile(user: UserProfile) {
        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    await redis.hmset(`user:${user.id}`, {
                        username: user.username,
                        avatar: user.avatar,
                        gender: user.gender,
                        profile_completed: user.profile_completed.toString(),
                        is_claimed: user.is_claimed.toString(),
                        created_at: user.created_at.toString(),
                        ...(user.country && { country: user.country }),
                        ...(user.city && { city: user.city }),
                        ...(user.region && { region: user.region }),
                        ...(user.lat && { lat: user.lat.toString() }),
                        ...(user.lon && { lon: user.lon.toString() }),
                        ...(user.timezone && { timezone: user.timezone })
                    });

                    // Register existence
                    await this.registerUser(user.id);
                } catch (error) {
                    console.error('[USER] Redis error saving profile:', error);
                }
            }
        }
        userProfilesMemory.set(user.id, user);
    }

    /**
     * Save session (Redis with fallback)
     */
    async saveSession(sid: string, userId: string, ttlSeconds: number = 86400) {
        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    await redis.setex(`session:${sid}`, ttlSeconds, userId);
                    return; // Successfully saved to Redis
                } catch (error) {
                    console.error('[USER] Redis error saving session:', error);
                }
            }
        }
        // Fallback to memory
        sessionMemory.set(sid, userId);
        // Clean up memory session after TTL (approximate)
        setTimeout(() => {
            sessionMemory.delete(sid);
        }, ttlSeconds * 1000);
    }

    /**
     * Get session (Redis with fallback)
     */
    async getSession(sid: string): Promise<string | null> {
        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    const userId = await redis.get(`session:${sid}`);
                    if (userId) return userId;
                } catch (error) {
                    console.error('[USER] Redis error getting session:', error);
                }
            }
        }
        return sessionMemory.get(sid) || null;
    }
}

export const userService = new UserService();
