'use client';

import { useState, useEffect } from 'react';
import { DesktopProfileLayout } from '@/features/profile/components/DesktopProfileLayout';
import { MobileProfileLayout } from '@/features/profile/components/MobileProfileLayout';

const ProfilePage = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isMobile) {
        return <MobileProfileLayout />;
    }

    return <DesktopProfileLayout />;
};

export default ProfilePage;
