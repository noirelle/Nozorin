import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: Redis | null = null;
let isRedisAvailable = false;

const REDISHOST = process.env.REDISHOST!;
const REDIS_PORT = process.env.REDIS_PORT!;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD!;

export const initRedis = (): void => {
    try {
        redisClient = new Redis({
            host: REDISHOST,
            port: REDIS_PORT,
            password: REDIS_PASSWORD || undefined,
            retryStrategy: (times) => {
                if (times > 3) {
                    console.error('[REDIS] Max retry attempts reached, falling back to in-memory storage');
                    isRedisAvailable = false;
                    return null; // Stop retrying
                }
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            connectTimeout: 5000,
        });

        redisClient.on('connect', () => {
            console.log('[REDIS] ✓ Connected to Redis');
            isRedisAvailable = true;
        });

        redisClient.on('error', (err) => {
            console.error('[REDIS] Connection error:', err.message);
            isRedisAvailable = false;
        });

        redisClient.on('close', () => {
            console.warn('[REDIS] Connection closed, using in-memory fallback');
            isRedisAvailable = false;
        });

    } catch (error) {
        console.error('[REDIS] Failed to initialize:', error);
        isRedisAvailable = false;
    }
};

export const getRedisClient = (): Redis | null => {
    return isRedisAvailable ? redisClient : null;
};

export const checkRedisAvailability = (): boolean => {
    return isRedisAvailable;
};

// Initialize on import
initRedis();
