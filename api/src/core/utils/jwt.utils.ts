import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY!;
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY!;

export type UserType = 'guest' | 'authenticated';

export interface VisitorPayload {
    userId: string;
    userType: UserType;
    createdAt: number;
}

export interface RefreshTokenPayload {
    userId: string;
    tokenVersion?: number; // Optional: for invalidating all refresh tokens
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

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY as any });
};

/**
 * Generate a JWT Access Token for an existing user
 */
export const generateUserToken = (userId: string, expiresIn: string = JWT_ACCESS_EXPIRY): string => {
    const payload: VisitorPayload = {
        userId,
        userType: 'guest', // or 'authenticated' if we want to distinguish
        createdAt: Date.now(),
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
};

/**
 * Generate a Refresh Token
 */
export const generateRefreshToken = (userId: string): string => {
    const payload: RefreshTokenPayload = {
        userId
    };
    // Use refresh secret if available, otherwise fallback (for backward compatibility or simple setup)
    const secret = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
    return jwt.sign(payload, secret, { expiresIn: JWT_REFRESH_EXPIRY as any });
};

/**
 * Verify and decode a refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
    try {
        const secret = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
        return jwt.verify(token, secret) as RefreshTokenPayload;
    } catch (error) {
        return null;
    }
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
