
import { getRedisClient, checkRedisAvailability } from '../../core/config/redis.config';

import { Stats } from './stats.types';

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

    getStats(): Stats {
        return { ...this.stats };
    }
}


export const statsService = new StatsService();
