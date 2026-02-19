import { api } from '../../index';
import type {
    AnonymousLoginRequest,
    AnonymousLoginResponse,
    GuestRegistrationRequest,
    GuestRegistrationResponse
} from './types';

export type {
    AnonymousLoginRequest,
    AnonymousLoginResponse,
    GuestRegistrationRequest,
    GuestRegistrationResponse
};

export const auth = {
    anonymousLogin: (data: AnonymousLoginRequest, headers?: HeadersInit) =>
        api.post<AnonymousLoginResponse>('/api/auth/anonymous', data, { headers }),

    guestRegistration: (data: GuestRegistrationRequest, headers?: HeadersInit) =>
        api.post<GuestRegistrationResponse>('/api/auth/guest', data, { headers }),

    refreshToken: (headers?: HeadersInit) =>
        api.post<{ token: string }>('/api/auth/refresh', {}, { headers }),
};
