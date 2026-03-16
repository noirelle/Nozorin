'use client';

import { useState } from 'react';
import { UserListItem } from '@/lib/api/endpoints/admin/types';
import { UseUsersManagementStateReturn } from '../types';

export const useUsersManagementState = () => {
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeSinceFilter, setActiveSinceFilter] = useState('all');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    return {
        users,
        setUsers,
        total,
        setTotal,
        page,
        setPage,
        limit,
        isLoading,
        setIsLoading,
        searchTerm,
        setSearchTerm,
        genderFilter,
        setGenderFilter,
        statusFilter,
        setStatusFilter,
        activeSinceFilter,
        setActiveSinceFilter,
        isFilterModalOpen,
        setIsFilterModalOpen,
        debouncedSearch,
        setDebouncedSearch,
    };
};
