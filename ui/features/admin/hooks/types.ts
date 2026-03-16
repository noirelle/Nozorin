import { Dispatch, SetStateAction } from 'react';
import { UserListItem } from '@/lib/api/endpoints/admin/types';

// --- Admin Auth Types ---

export interface AdminAuthState {
    isLoading: boolean;
    error: string | null;
}

export interface UseAdminAuthStateReturn extends AdminAuthState {
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<string | null>>;
}

// --- Users Management Types ---

export interface UsersManagementState {
    users: UserListItem[];
    total: number;
    page: number;
    limit: number;
    isLoading: boolean;
    searchTerm: string;
    genderFilter: string;
    statusFilter: string;
    activeSinceFilter: string;
    isFilterModalOpen: boolean;
    debouncedSearch: string;
}

export interface UseUsersManagementStateReturn extends UsersManagementState {
    setUsers: Dispatch<SetStateAction<UserListItem[]>>;
    setTotal: Dispatch<SetStateAction<number>>;
    setPage: Dispatch<SetStateAction<number>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    setSearchTerm: Dispatch<SetStateAction<string>>;
    setGenderFilter: Dispatch<SetStateAction<string>>;
    setStatusFilter: Dispatch<SetStateAction<string>>;
    setActiveSinceFilter: Dispatch<SetStateAction<string>>;
    setIsFilterModalOpen: Dispatch<SetStateAction<boolean>>;
    setDebouncedSearch: Dispatch<SetStateAction<string>>;
}
