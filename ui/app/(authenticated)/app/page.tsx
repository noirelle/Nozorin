'use client';

import { DesktopHomeLayout } from '@/features/home/components/DesktopHomeLayout';
import { MobileHomeLayout } from '@/features/home/components/MobileHomeLayout';
import { useIsMobile } from '@/hooks';

export default function AppPage() {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <MobileHomeLayout />;
    }

    return <DesktopHomeLayout />;
}

