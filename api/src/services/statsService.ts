
import { getRedisClient, checkRedisAvailability } from '../config/redis';

interface Stats {
    peopleOnline: number;
    matchesToday: number;
    totalConnections: number;
}

class StatsService {
    private stats: Stats = {
        peopleOnline: 0,
        matchesToday: 0,
        totalConnections: 0,
    };

    private lastResetDate = new Date().toDateString();

    constructor() {
        // Initialize from Redis if available
        this.loadFromRedis();

        // Reset daily matches at midnight
        setInterval(() => this.checkReset(), 60000); // Check every minute
    }

    private async loadFromRedis() {
        if (!checkRedisAvailability()) return;
        const redis = getRedisClient();
        if (!redis) return;

        try {
            // Load persistent counts
            const matchesToday = await redis.get('stats:matchesToday');
            const totalConnections = await redis.get('stats:totalConnections');

            if (matchesToday) this.stats.matchesToday = parseInt(matchesToday);
            if (totalConnections) this.stats.totalConnections = parseInt(totalConnections);

            // For peopleOnline, we might want to reset it or sync it, 
            // but usually it's better to start from 0 on a fresh server boot 
            // unless we heartbeat nodes.
            // For now, we'll let it be managed by the connection events.

            console.log('[STATS] Initialized from Redis:', this.stats);
        } catch (err) {
            console.error('[STATS] Error loading stats from Redis:', err);
        }
    }

    private async checkReset() {
        const currentDate = new Date().toDateString();
        if (currentDate !== this.lastResetDate) {
            this.stats.matchesToday = 0;
            this.lastResetDate = currentDate;

            if (checkRedisAvailability()) {
                const redis = getRedisClient();
                await redis?.set('stats:matchesToday', '0');
            }
            console.log('[STATS] Daily match count reset at midnight');
        }
    }

    setOnlineUsers(count: number) {
        this.stats.peopleOnline = count;
        console.log(`[STATS] Online users: ${this.stats.peopleOnline}`);
    }

    incrementOnlineUsers() {
        this.stats.peopleOnline++;
        console.log(`[STATS] Online users: ${this.stats.peopleOnline}`);
    }

    decrementOnlineUsers() {
        if (this.stats.peopleOnline > 0) {
            this.stats.peopleOnline--;
        }
        console.log(`[STATS] Online users: ${this.stats.peopleOnline}`);
    }

    incrementMatchesToday() {
        this.stats.matchesToday++;

        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            redis?.incr('stats:matchesToday').catch(err => console.error('[STATS] Redis INCR error:', err));
        }
        console.log(`[STATS] Pairs matched today: ${this.stats.matchesToday}`);
    }

    incrementTotalConnections() {
        this.stats.totalConnections++;

        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            redis?.incr('stats:totalConnections').catch(err => console.error('[STATS] Redis INCR error:', err));
        }
        console.log(`[STATS] Total connections: ${this.stats.totalConnections}`);
    }

    getStats(): Stats {
        return { ...this.stats };
    }
}

export const statsService = new StatsService();
