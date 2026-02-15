import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'a3f9c1e2b47d8e9f0a1b2c3d4e5f67890123456789abcdef0123456789abcd';
const JWT_EXPIRY = '30d'; // 30 days for visitor tokens

export type UserType = 'guest' | 'authenticated';

export interface VisitorPayload {
    userId: string;
    userType: UserType;
    createdAt: number;
}

/**
 * Generate a JWT token for a visitor
 */
export const generateVisitorToken = (userType: UserType = 'guest'): string => {
    const payload: VisitorPayload = {
        userId: uuidv4(),
        userType,
        createdAt: Date.now(),
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

/**
 * Generate a JWT token for an existing user
 */
export const generateUserToken = (userId: string, expiresIn: string = JWT_EXPIRY): string => {
    const payload: VisitorPayload = {
        userId,
        userType: 'guest', // or 'authenticated' if we want to distinguish
        createdAt: Date.now(),
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
};

/**
 * Verify and decode a visitor token
 */
export const verifyVisitorToken = (token: string): VisitorPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as VisitorPayload;
        return decoded;
    } catch (error) {
        console.error('[JWT] Token verification failed:', error);
        return null;
    }
};

/**
 * Extract user ID from token
 */
export const getUserIdFromToken = (token: string): string | null => {
    const payload = verifyVisitorToken(token);
    return payload?.userId || null;
};
