import Redis from 'ioredis';
import { logger } from '../logger';

const REDISHOST = process.env.REDISHOST || 'redis';
const REDISPORT = parseInt(process.env.REDISPORT || '6379', 10);
const REDISPASSWORD = process.env.REDISPASSWORD || process.env.REDIS_PASSWORD || 'root';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

export const initRedis = (): Redis | null => {
    if (redisClient) return redisClient;

    try {
        redisClient = new Redis({
            host: REDISHOST,
            port: REDISPORT,
            password: REDISPASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });

        redisClient.on('connect', () => {
            isRedisAvailable = true;
            logger.info({ host: REDISHOST, port: REDISPORT }, '[REDIS] Connected');
        });

        redisClient.on('error', (err) => {
            isRedisAvailable = false;
            logger.warn({ err }, '[REDIS] Connection error');
        });

        return redisClient;
    } catch (err) {
        logger.error({ err }, '[REDIS] Initialization failed');
        return null;
    }
};

export const getRedisClient = (): Redis | null => {
    if (!redisClient && !isRedisAvailable) {
        return initRedis();
    }
    return redisClient;
};

export const checkRedisAvailability = (): boolean => isRedisAvailable;
