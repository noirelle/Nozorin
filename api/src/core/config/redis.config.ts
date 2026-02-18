import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: Redis | null = null;
let isRedisAvailable = false;
let hasInitialized = false;

const REDISHOST = process.env.REDISHOST!;
const REDISPORT = parseInt(process.env.REDISPORT!, 10);
const REDISPASSWORD = process.env.REDISPASSWORD!;

export const initRedis = (): void => {
    if (hasInitialized) return;
    hasInitialized = true;

    try {
        redisClient = new Redis({
            host: REDISHOST,
            port: REDISPORT,
            password: REDISPASSWORD,
            retryStrategy: () => null,
            maxRetriesPerRequest: 0,
            enableOfflineQueue: false,
            lazyConnect: true,
            connectTimeout: 5000,
        });

        redisClient.connect()
            .then(() => {
                console.log('[REDIS] ✓ Connected');
                isRedisAvailable = true;
            })
            .catch((err) => {
                console.error('[REDIS] Initial connection failed:', err.message);
                isRedisAvailable = false;
                redisClient?.disconnect();
                redisClient = null;
            });

        redisClient.on('close', () => {
            console.warn('[REDIS] Connection closed');
            isRedisAvailable = false;
        });

    } catch (error) {
        console.error('[REDIS] Initialization failed:', error);
        isRedisAvailable = false;
        redisClient = null;
    }
};

export const getRedisClient = (): Redis | null => {
    return isRedisAvailable ? redisClient : null;
};

export const checkRedisAvailability = (): boolean => {
    return isRedisAvailable;
};

initRedis();
