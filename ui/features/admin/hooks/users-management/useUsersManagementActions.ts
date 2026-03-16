'use client';

import { useCallback, useEffect, useRef } from 'react';
import { admin } from '@/lib/api';
import { UseUsersManagementStateReturn } from '../types';

// Singleton to track last fetch hash across remounts
let globalLastFetchHash = '';

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
        // Skip if searchTerm hasn't changed from debouncedSearch (prevents double fetch on mount)
        if (searchTerm === debouncedSearch) return;

        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, debouncedSearch, setDebouncedSearch, setPage]);

    // 2. Fetch Users logic
    const fetchUsers = useCallback(async () => {
        const currentHash = JSON.stringify({
            page,
            limit,
            search: debouncedSearch,
            gender: genderFilter,
            status: statusFilter,
            active_since: activeSinceFilter
        });

        // Skip if we already started/finished a fetch with these exact parameters
        if (globalLastFetchHash === currentHash) return;
        
        globalLastFetchHash = currentHash;
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
            globalLastFetchHash = ''; // Reset on error to allow retry
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedSearch, genderFilter, statusFilter, activeSinceFilter, setIsLoading, setUsers, setTotal]);

    // 3. Trigger fetch on dependency changes
    useEffect(() => {
        fetchUsers();
        
        return () => {
            // Delay clearing the hash to allow for remounts during layout switches (isMobile changes)
            // This ensures navigating away and back still triggers a fresh fetch, 
            // but immediate remounts don't.
            setTimeout(() => {
                globalLastFetchHash = '';
            }, 100);
        };
    }, [fetchUsers]);

    return {
        fetchUsers,
    };
};
