/**
 * Gets the base API URL depending on the environment (server-side vs client-side).
 * - Server-side: Prioritizes INTERNAL_API_URL for container-to-container communication.
 * - Client-side: Uses NEXT_PUBLIC_API_URL for browser-to-server communication.
 */
export const getBaseApiUrl = (): string => {
    // If we're on the server
    if (typeof window === 'undefined') {
        const publicUrl = process.env.NEXT_PUBLIC_API_URL;
        if (publicUrl && !publicUrl.includes('localhost') && !publicUrl.includes('127.0.0.1')) {
            return publicUrl;
        }
        return 'http://api:3001';
    }

    // If we're on the client
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};
