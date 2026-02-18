
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getRedisClient } from '../config/redis.config';

const JWT_SECRET = process.env.JWT_SECRET || "";

interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    let jwtUser = null;
    if (token) {
        try {
            jwtUser = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            // Token invalid or expired, proceed to check session cookie
        }
    }

    if (jwtUser && typeof jwtUser !== 'string') {
        (req as AuthRequest).user = {
            ...(jwtUser as any),
            id: (jwtUser as any).userId || (jwtUser as any).id
        };
        return next();
    }

    // Fallback: Check for nz_sid cookie
    const cookieHeader = req.headers.cookie;

    if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);

        const sid = cookies['nz_sid'];
        if (sid) {
            const redis = getRedisClient();
            if (redis) {
                try {
                    const userId = await redis.get(`session:${sid}`);
                    if (userId) {
                        // Found session, treating as authenticated guest
                        (req as AuthRequest).user = {
                            userId,
                            id: userId,
                            userType: 'guest',
                            createdAt: Date.now()
                        };
                        return next();
                    }
                } catch (e) {
                    console.error('[AUTH] Redis session check error:', e);
                }
            }
        }
    }

    return res.sendStatus(401);
};
