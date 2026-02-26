import { UserProfile } from '../../../../types/user';

export interface GuestRegistrationRequest {
    username: string;
    gender: string;
    agreed: boolean;
    session_id: string;
    device_id: string;
    footprint?: any;
}

export interface GuestRegistrationResponse {
    user: UserProfile;
    is_new: boolean;
}

export interface AnonymousLoginRequest {
    chatIdentityId: string;
}

export interface AnonymousLoginResponse {
    id: string;
    token: string;
    expiresIn: string;
    chatIdentityLinked: boolean;
    requestId: string;
    profile: {
        username: string;
        displayName: string;
        avatar: string;
        country_name: string | null;
        city: string | null;
        timezone: string | null;
    };
}
