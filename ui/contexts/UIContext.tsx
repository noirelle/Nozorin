'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIContextType {
    isMobile: boolean;
    isMounted: boolean;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                // Ensure sidebar is conceptually open or reset on desktop
                setIsSidebarOpen(false);
            }
            setIsMounted(true);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const setSidebarOpen = (isOpen: boolean) => setIsSidebarOpen(isOpen);

    return (
        <UIContext.Provider value={{
            isMobile,
            isMounted,
            isSidebarOpen,
            toggleSidebar,
            setSidebarOpen
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
