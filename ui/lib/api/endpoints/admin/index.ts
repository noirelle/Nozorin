import { api } from '../../index';
import type { AdminLoginResponse, AdminStats, UsersListResponse } from './types';

export type { AdminLoginResponse };

export const admin = {
    login: (password: string, headers?: HeadersInit) => 
        api.post<AdminLoginResponse>('/api/admin/login', { password }, { headers }),
    
    refresh: (headers?: HeadersInit) => 
        api.post<AdminLoginResponse>('/api/admin/refresh', {}, { headers }),
    
    logout: (headers?: HeadersInit) => 
        api.post('/api/admin/logout', {}, { headers }),

    getStats: (headers?: HeadersInit) =>
        api.get<AdminStats>('/api/admin/get-status', { headers }),

    listUsers: (params: { page: number; limit: number; gender?: string; is_claimed?: string; search?: string; active_since?: string }, headers?: HeadersInit) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, value.toString());
            }
        });
        return api.get<UsersListResponse>(`/api/admin/users?${query.toString()}`, { headers });
    },

    getUserDetails: (userId: string, headers?: HeadersInit) =>
        api.get<any>(`/api/admin/users/${userId}`, { headers })
};
