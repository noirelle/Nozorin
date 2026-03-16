import { api } from '../../index';
import type { AdminLoginResponse, AdminStats } from './types';

export type { AdminLoginResponse };

export const admin = {
    login: (password: string, headers?: HeadersInit) => 
        api.post<AdminLoginResponse>('/api/admin/login', { password }, { headers }),
    
    refresh: (headers?: HeadersInit) => 
        api.post<AdminLoginResponse>('/api/admin/refresh', {}, { headers }),
    
    logout: (headers?: HeadersInit) => 
        api.post('/api/admin/logout', {}, { headers }),

    getStats: (headers?: HeadersInit) =>
        api.get<AdminStats>('/api/admin/get-status', { headers })
};
