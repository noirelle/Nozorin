import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AdminState {
    adminToken: string | null;
    isAdminAuthenticated: boolean;
    isAdminChecked: boolean;
    setAdminToken: (token: string | null) => void;
    adminLogout: () => void;
    setAdminChecked: (checked: boolean) => void;
}

const ADMIN_TOKEN_KEY = 'nz_token_admin';

const customStorage = {
    getItem: (_name: string) => {
        if (typeof window === 'undefined') return null;
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (token) {
            return JSON.stringify({
                state: {
                    adminToken: token,
                    isAdminAuthenticated: true,
                },
                version: 0,
            });
        }
        return null;
    },
    setItem: (_name: string, value: string) => {
        if (typeof window === 'undefined') return;
        try {
            const parsed = JSON.parse(value);
            const state = parsed.state as AdminState;
            if (state.adminToken) {
                localStorage.setItem(ADMIN_TOKEN_KEY, state.adminToken);
            } else {
                localStorage.removeItem(ADMIN_TOKEN_KEY);
            }
        } catch {}
    },
    removeItem: (_name: string) => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(ADMIN_TOKEN_KEY);
    },
};

export const useAdminStore = create<AdminState>()(
    persist(
        (set) => ({
            adminToken: null,
            isAdminAuthenticated: false,
            isAdminChecked: false,

            setAdminToken: (token) => set({ 
                adminToken: token, 
                isAdminAuthenticated: !!token 
            }),

            adminLogout: () => set({ 
                adminToken: null, 
                isAdminAuthenticated: false 
            }),

            setAdminChecked: (checked) => set({ isAdminChecked: checked }),
        }),
        {
            name: 'nz_token_admin',
            storage: createJSONStorage(() => customStorage),
            partialize: (state) => ({ 
                adminToken: state.adminToken,
                isAdminAuthenticated: state.isAdminAuthenticated
            }),
        }
    )
);
