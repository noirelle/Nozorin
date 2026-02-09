import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'nozorin-secret-key-change-in-production';
const JWT_EXPIRY = '30d'; // 30 days

export type UserType = 'guest' | 'authenticated';

interface VisitorPayload {
    userId: string;
    userType: UserType;
    createdAt: number;
}

export async function POST() {
    try {
        const payload: VisitorPayload = {
            userId: uuidv4(),
            userType: 'guest',
            createdAt: Date.now(),
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

        return NextResponse.json({ token }, { status: 200 });
    } catch (error) {
        console.error('Error generating visitor token:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}
