'use client';

import { useState, useEffect } from 'react';
import { DesktopAppLayout } from '@/features/social/components/DesktopAppLayout';
import { MobileAppLayout } from '@/features/social/components/MobileAppLayout';

export default function AppPage() {
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
        return <MobileAppLayout />;
    }

    return <DesktopAppLayout />;
}
