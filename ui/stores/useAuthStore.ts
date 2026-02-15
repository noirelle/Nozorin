import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile } from '../types/user';

export interface AuthState {
    user: UserProfile | null;
    token: string | null;
    isAuthenticated: boolean;
    location: any | null;
    isChecked: boolean; // Tracking session validation status for current page load
    login: (token: string, user: UserProfile) => void;
    logout: () => void;
    updateUser: (updates: Partial<UserProfile>) => void;
    setToken: (token: string) => void;
    setLocation: (location: any) => void;
    setChecked: (checked: boolean) => void;
}

const TOKEN_KEY = 'nz_token';
const USER_ID_KEY = 'nz_user_id';
const LOCATION_KEY = 'nz_location';

// Custom storage adapter that syncs ONLY with individual localStorage keys
// and does NOT persist the main 'auth-storage' blob.
const customStorage = {
    getItem: (name: string) => {
        if (typeof window === 'undefined') return null;

        // Try to recover location
        const storedLocation = localStorage.getItem(LOCATION_KEY);
        let location = null;
        if (storedLocation) {
            try { location = JSON.parse(storedLocation); } catch (e) { }
        }

        // Try to recover token
        const token = localStorage.getItem(TOKEN_KEY);

        // Try to recover user_id (though we can't fully reconstruct user from just ID)
        const userId = localStorage.getItem(USER_ID_KEY);

        if (token || location) {
            return JSON.stringify({
                state: {
                    token: token || null,
                    user: userId ? { id: userId } as UserProfile : null,
                    isAuthenticated: !!token,
                    location: location || null
                },
                version: 0
            });
        }

        return null;
    },
    setItem: (name: string, value: string) => {
        if (typeof window === 'undefined') return;

        try {
            const parsed = JSON.parse(value);
            const state = parsed.state as AuthState;

            if (state.token) {
                localStorage.setItem(TOKEN_KEY, state.token);
            } else {
                localStorage.removeItem(TOKEN_KEY);
            }

            if (state.user?.id) {
                localStorage.setItem(USER_ID_KEY, state.user.id);
            } else {
                localStorage.removeItem(USER_ID_KEY);
            }

            if (state.location) {
                localStorage.setItem(LOCATION_KEY, JSON.stringify(state.location));
            } else {
                localStorage.removeItem(LOCATION_KEY);
            }
        } catch (e) {
            console.error('Error parsing auth state for sync', e);
        }
    },
    removeItem: (name: string) => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_ID_KEY);
        localStorage.removeItem(LOCATION_KEY);
    }
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            location: null,
            isChecked: false,

            login: (token, user) => set({
                token,
                user,
                isAuthenticated: true,
                isChecked: true
            }),

            logout: () => set((state: AuthState) => ({
                user: null,
                token: null,
                isAuthenticated: false,
                location: null,
                isChecked: false
            })),

            updateUser: (updates) => set((state) => ({
                user: state.user ? { ...state.user, ...updates } : null
            })),

            setToken: (token) => set({ token }),
            setLocation: (location: any) => set({ location }),
            setChecked: (checked: boolean) => set({ isChecked: checked })
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => customStorage),
            partialize: (state: AuthState) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: !!state.token,
                location: state.location
                // isChecked is intentionally omitted so it resets on reload
            }),
        }
    )
);
