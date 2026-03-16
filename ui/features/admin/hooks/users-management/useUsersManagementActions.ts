'use client';

import { useCallback, useEffect, useRef } from 'react';
import { admin } from '@/lib/api';
import { UseUsersManagementStateReturn } from '../types';

export const useUsersManagementActions = (state: UseUsersManagementStateReturn) => {
    const {
        page,
        setPage,
        limit,
        debouncedSearch,
        genderFilter,
        statusFilter,
        activeSinceFilter,
        setUsers,
        setTotal,
        setIsLoading,
        searchTerm,
        setDebouncedSearch
    } = state;

    // 1. Debounce Search logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, setDebouncedSearch, setPage]);

    // 2. Fetch Users logic
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await admin.listUsers({
                page,
                limit,
                search: debouncedSearch,
                gender: genderFilter,
                is_claimed: statusFilter,
                active_since: activeSinceFilter === 'all' ? undefined : activeSinceFilter
            });
            if (result.data) {
                setUsers(result.data.users);
                setTotal(result.data.total);
            }
        } catch (err) {
            console.error('[ADMIN] Error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedSearch, genderFilter, statusFilter, activeSinceFilter, setIsLoading, setUsers, setTotal]);

    const hasFetched = useRef(false);

    // 3. Trigger fetch on dependency changes
    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchUsers();
            return;
        }

        fetchUsers();
    }, [fetchUsers]);

    return {
        fetchUsers,
    };
};
