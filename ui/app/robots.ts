import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin-panel/',
                    '/api/',
                    '/_next/',
                ],
            },
        ],
        sitemap: 'https://nozorin.com/sitemap.xml',
    };
}
