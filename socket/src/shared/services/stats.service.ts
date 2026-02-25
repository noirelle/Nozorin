import { getRedisClient, checkRedisAvailability } from '../../core/config/redis.config';
import { logger } from '../../core/logger';

let totalConnections = 0;
let peopleOnline = 0;
let matchesToday = 0;
let lastResetDate = new Date().toDateString();

const loadFromRedis = async () => {
    if (!checkRedisAvailability()) return;
    const redis = getRedisClient();
    if (!redis) return;

    try {
        const storedMatches = await redis.get('stats:matchesToday');
        const storedTotal = await redis.get('stats:totalConnections');
        if (storedMatches) matchesToday = parseInt(storedMatches, 10);
        if (storedTotal) totalConnections = parseInt(storedTotal, 10);
        logger.info({ matchesToday, totalConnections }, '[STATS] Initialized from Redis');
    } catch (err) {
        logger.error({ err }, '[STATS] Failed to load from Redis');
    }
};

const checkReset = async () => {
    const currentDate = new Date().toDateString();
    if (currentDate !== lastResetDate) {
        matchesToday = 0;
        lastResetDate = currentDate;
        if (checkRedisAvailability()) {
            const redis = getRedisClient();
            await redis?.set('stats:matchesToday', '0');
        }
        logger.info({}, '[STATS] Daily match count reset at midnight');
    }
};



// Initial load
loadFromRedis();
setInterval(checkReset, 60_000);

export const statsService = {
    incrementTotalConnections(): void {
        totalConnections++;
        if (checkRedisAvailability()) {
            getRedisClient()?.incr('stats:totalConnections').catch(() => { });
        }
    },

    incrementMatchesToday(): void {
        matchesToday++;
        if (checkRedisAvailability()) {
            getRedisClient()?.incr('stats:matchesToday').catch(() => { });
        }
    },

    setOnlineUsers(count: number): void {
        peopleOnline = count;
    },

    getStats() {
        return {
            total_connections: totalConnections,
            people_online: peopleOnline,
            matches_today: matchesToday
        };
    },
};

