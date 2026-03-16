'use client';

import { useMemo } from 'react';
import { useUsersManagementState } from './useUsersManagementState';
import { useUsersManagementActions } from './useUsersManagementActions';
import { useUsersManagementListeners } from './useUsersManagementListeners';

export const useUsersManagement = () => {
    const state = useUsersManagementState();

    const actions = useUsersManagementActions(state);

    useUsersManagementListeners({
        setUsers: state.setUsers
    });

    const totalPages = useMemo(() =>
        Math.ceil(state.total / state.limit),
        [state.total, state.limit]);

    return {
        // State
        users: state.users,
        total: state.total,
        page: state.page,
        limit: state.limit,
        isLoading: state.isLoading,
        searchTerm: state.searchTerm,
        genderFilter: state.genderFilter,
        statusFilter: state.statusFilter,
        activeSinceFilter: state.activeSinceFilter,
        isFilterModalOpen: state.isFilterModalOpen,
        selectedUserId: state.selectedUserId,
        isDetailModalOpen: state.isDetailModalOpen,

        // Setter Actions
        setPage: state.setPage,
        setSearchTerm: state.setSearchTerm,
        setGenderFilter: state.setGenderFilter,
        setStatusFilter: state.setStatusFilter,
        setActiveSinceFilter: state.setActiveSinceFilter,
        setIsFilterModalOpen: state.setIsFilterModalOpen,
        setSelectedUserId: state.setSelectedUserId,
        setIsDetailModalOpen: state.setIsDetailModalOpen,

        // Business Actions
        fetchUsers: actions.fetchUsers,

        // Derived
        totalPages,
    };
};
