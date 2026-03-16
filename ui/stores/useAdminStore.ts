import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminState {
    adminToken: string | null;
    isAdminAuthenticated: boolean;
    isAdminChecked: boolean;
    setAdminToken: (token: string | null) => void;
    adminLogout: () => void;
    setAdminChecked: (checked: boolean) => void;
}

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
            name: 'admin-auth-storage',
            partialize: (state) => ({ 
                adminToken: state.adminToken,
                isAdminAuthenticated: state.isAdminAuthenticated
            }),
        }
    )
);
