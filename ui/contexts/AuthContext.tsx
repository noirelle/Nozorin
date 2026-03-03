'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@/hooks';
import { GlobalLoader } from '@/components/GlobalLoader';
import { WelcomeScreen } from '@/features/auth/components/WelcomeScreen';
import { UserProfile } from '@/types/user';

interface AuthContextType {
    user: UserProfile | null;
    isChecked: boolean;
    isChecking: boolean;
    refreshUser: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isImageReady, setIsImageReady] = useState(false);
    const { isChecking, user, isChecked, refreshUser } = useUser();

    // Preload user avatar to prevent blink
    useEffect(() => {
        if (user?.avatar) {
            const img = new Image();
            img.src = user.avatar;

            const handleLoad = () => {
                if ('decode' in img) {
                    img.decode()
                        .then(() => setIsImageReady(true))
                        .catch(() => setIsImageReady(true));
                } else {
                    setIsImageReady(true);
                }
            };

            if (img.complete) {
                handleLoad();
            } else {
                img.onload = handleLoad;
                img.onerror = () => setIsImageReady(true);
            }
        } else if (isChecked && !user) {
            setIsImageReady(true);
        }
    }, [user?.avatar, isChecked, user]);

    const shouldShowLoader = isChecking || (user?.avatar && !isImageReady);

    if (shouldShowLoader) {
        return <GlobalLoader />;
    }

    if (isChecked && !user) {
        return <WelcomeScreen onSuccess={refreshUser} />;
    }

    return (
        <AuthContext.Provider value={{ user, isChecked, isChecking, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
