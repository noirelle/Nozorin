import { getRedisClient, checkRedisAvailability } from '../config/redis';

const REDIS_TTL = process.env.REDIS_TTL ? parseInt(process.env.REDIS_TTL) : 604800; // 7 days in seconds

export interface SessionRecord {
    sessionId: string;
    userId: string; // The user who owns this history
    partnerId: string; // The UUID of the partner
    country: string;
    countryCode: string;
    partnerCountry?: string;
    partnerCountryCode?: string;
    connectionTime: number;
    disconnectionTime?: number;
    duration?: number; // in seconds
    disconnectReason?: 'user-action' | 'partner-disconnect' | 'error' | 'skip' | 'network' | 'answered-another';
    mode: 'chat' | 'video';
}

export interface SessionStart {
    sessionId: string;
    partnerId: string;
    country: string;
    countryCode: string;
    partnerCountry: string;
    partnerCountryCode: string;
    mode: 'chat' | 'video';
}

// In-memory fallback storage
class InMemoryHistoryStore {
    private store: Map<string, SessionRecord[]> = new Map();

    async saveSession(userId: string, session: SessionRecord): Promise<void> {
        const userHistory = this.store.get(userId) || [];
        userHistory.unshift(session); // Add to beginning

        // Keep only last 50 sessions per user
        if (userHistory.length > 50) {
            userHistory.splice(50);
        }

        this.store.set(userId, userHistory);
    }

    async getHistory(userId: string, limit: number = 20): Promise<SessionRecord[]> {
        const userHistory = this.store.get(userId) || [];
        return userHistory.slice(0, limit);
    }

    async clearHistory(userId: string): Promise<void> {
        this.store.delete(userId);
    }
}

const inMemoryStore = new InMemoryHistoryStore();

/**
 * History Service - Manages session tracking with Redis and in-memory fallback
 */
class HistoryService {
    private getStorageKey(userId: string): string {
        return `history:${userId}`;
    }

    /**
     * Start tracking a new session
     */
    async startSession(userId: string, sessionData: SessionStart): Promise<void> {
        const session: SessionRecord = {
            sessionId: sessionData.sessionId,
            userId,
            partnerId: sessionData.partnerId,
            country: sessionData.country,
            countryCode: sessionData.countryCode,
            partnerCountry: sessionData.partnerCountry,
            partnerCountryCode: sessionData.partnerCountryCode,
            connectionTime: Date.now(),
            mode: sessionData.mode,
        };

        console.log(`[HISTORY] Starting session for user ${userId}`);

        // Store temporarily until session ends
        const tempKey = `session:active:${userId}`;
        const sessionJson = JSON.stringify(session);

        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    await redis.setex(tempKey, 3600, sessionJson); // 1 hour expiry for active sessions
                    return;
                } catch (error) {
                    console.error('[HISTORY] Redis error, using in-memory fallback:', error);
                }
            }
        }

        // Fallback: store in memory (we'll use a separate map for active sessions)
        this.activeSessionsMemory.set(userId, session);
    }

    private activeSessionsMemory: Map<string, SessionRecord> = new Map();

    /**
     * End a session and save to history
     */
    async endSession(
        userId: string,
        disconnectReason?: SessionRecord['disconnectReason']
    ): Promise<void> {
        const tempKey = `session:active:${userId}`;
        let session: SessionRecord | null = null;

        // Retrieve active session
        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    const sessionJson = await redis.get(tempKey);
                    if (sessionJson) {
                        session = JSON.parse(sessionJson);
                        await redis.del(tempKey);
                    }
                } catch (error) {
                    console.error('[HISTORY] Redis error on endSession:', error);
                }
            }
        }

        // Fallback: check in-memory
        if (!session) {
            session = this.activeSessionsMemory.get(userId) || null;
            this.activeSessionsMemory.delete(userId);
        }

        if (!session) {
            console.warn(`[HISTORY] No active session found for user ${userId}`);
            return;
        }

        // Complete session data
        const now = Date.now();
        session.disconnectionTime = now;
        session.duration = Math.floor((now - session.connectionTime) / 1000); // in seconds
        session.disconnectReason = disconnectReason || 'user-action';

        console.log(`[HISTORY] Ending session for user ${userId}, duration: ${session.duration}s`);

        // Save to persistent history
        await this.saveToHistory(userId, session);
    }

    /**
     * Save session to user's history
     */
    private async saveToHistory(userId: string, session: SessionRecord): Promise<void> {
        const key = this.getStorageKey(userId);

        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    // Use a Redis list to store sessions
                    const sessionJson = JSON.stringify(session);

                    // Add to the beginning of the list
                    await redis.lpush(key, sessionJson);

                    // Trim to keep only last 50 sessions
                    await redis.ltrim(key, 0, 49);

                    // Set expiry
                    await redis.expire(key, REDIS_TTL);

                    console.log(`[HISTORY] Session saved to Redis for user ${userId}`);
                    return;
                } catch (error) {
                    console.error('[HISTORY] Redis save error, using fallback:', error);
                }
            }
        }

        // Fallback: in-memory
        await inMemoryStore.saveSession(userId, session);
        console.log(`[HISTORY] Session saved to in-memory store for user ${userId}`);
    }

    /**
     * Retrieve session history for a user
     */
    async getHistory(userId: string, limit: number = 20): Promise<SessionRecord[]> {
        const key = this.getStorageKey(userId);

        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    // Get from Redis list
                    const sessions = await redis.lrange(key, 0, limit - 1);
                    const parsed = sessions.map(s => JSON.parse(s) as SessionRecord);
                    console.log(`[HISTORY] Retrieved ${parsed.length} sessions from Redis for user ${userId}`);
                    return parsed;
                } catch (error) {
                    console.error('[HISTORY] Redis retrieval error, using fallback:', error);
                }
            }
        }

        // Fallback: in-memory
        const history = await inMemoryStore.getHistory(userId, limit);
        console.log(`[HISTORY] Retrieved ${history.length} sessions from in-memory for user ${userId}`);
        return history;
    }

    /**
     * Clear history for a user
     */
    async clearHistory(userId: string): Promise<void> {
        const key = this.getStorageKey(userId);

        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    await redis.del(key);
                    console.log(`[HISTORY] Cleared Redis history for user ${userId}`);
                    return;
                } catch (error) {
                    console.error('[HISTORY] Redis clear error:', error);
                }
            }
        }

        // Fallback: in-memory
        await inMemoryStore.clearHistory(userId);
        console.log(`[HISTORY] Cleared in-memory history for user ${userId}`);
    }

    /**
     * Get statistics about history
     */
    async getHistoryStats(userId: string): Promise<{
        totalSessions: number;
        totalDuration: number;
        averageDuration: number;
        countriesConnected: string[];
    }> {
        const history = await this.getHistory(userId, 100);

        const totalSessions = history.length;
        const totalDuration = history.reduce((sum, s) => sum + (s.duration || 0), 0);
        const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
        const countriesConnected = [...new Set(history.map(s => s.partnerCountryCode).filter(Boolean))];

        return {
            totalSessions,
            totalDuration,
            averageDuration,
            countriesConnected: countriesConnected as string[],
        };
    }
}

export const historyService = new HistoryService();
