import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://nozorin.com';
    const lastModified = new Date();

    return [
        {
            url: baseUrl,
            lastModified,
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/app`,
            lastModified,
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/app/voice`,
            lastModified,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/app/explore`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/app/profile`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];
}
