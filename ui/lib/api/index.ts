import { apiRequest } from './core/apiRequest';

export * from './core/types';
export * from './core/config';
export * from './core/headers';
export * from './core/apiRequest';
export * from './core/auth';
export * from './core/proxy';
export * from './core/handler';
export * from './endpoints/auth';
export * from './endpoints/friends';

export const api = {
    get: <T>(endpoint: string, options: RequestInit = {}) =>
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),

    post: <T, R = any>(endpoint: string, body: R, options: RequestInit = {}) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        }),

    put: <T, R = any>(endpoint: string, body: R, options: RequestInit = {}) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        }),

    delete: <T>(endpoint: string, options: RequestInit = {}) =>
        apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
