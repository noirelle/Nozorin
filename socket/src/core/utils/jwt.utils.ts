import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export type UserType = 'guest' | 'authenticated';

export interface VisitorPayload {
    userId: string;
    userType: UserType;
    createdAt: number;
}

export interface RefreshTokenPayload {
    userId: string;
    tokenVersion?: number;
}

export const verifyVisitorToken = (token: string): VisitorPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as VisitorPayload;
    } catch {
        return null;
    }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
    try {
        const secret = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
        return jwt.verify(token, secret) as RefreshTokenPayload;
    } catch {
        return null;
    }
};

export const getUserIdFromToken = (token: string): string | null => {
    const payload = verifyVisitorToken(token) as any;
    return payload?.userId || payload?.user_id || null;
};
