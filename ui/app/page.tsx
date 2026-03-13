import { headers } from 'next/headers';
import HomeClient from '../sections/HomeClient';
import { BrowserGuard } from '@/components/BrowserGuard';
import { isInAppBrowser } from '@/utils/browser';

export default async function Home() {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent');
    const isRestricted = isInAppBrowser(userAgent);

    if (isRestricted) {
        return <BrowserGuard userAgent={userAgent} />;
    }

    return <HomeClient />;
}
