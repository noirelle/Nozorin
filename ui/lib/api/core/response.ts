import { NextResponse } from 'next/server';
import { StandardApiResponse } from './types';

export function successResponse<T>(data: T, message: string = 'Success', status: number = 200) {
    return NextResponse.json<StandardApiResponse<T>>({
        status: 'success',
        message,
        data
    }, { status });
}

export function errorResponse(message: string, error?: string | any, status: number = 500) {
    return NextResponse.json<StandardApiResponse<null>>({
        status: 'error',
        message,
        error: error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Unknown error')
    }, { status });
}
