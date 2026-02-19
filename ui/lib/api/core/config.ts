/**
 * Gets the base API URL depending on the environment (server-side vs client-side).
 * - Server-side: Prioritizes INTERNAL_API_URL for container-to-container communication.
 * - Client-side: Uses NEXT_PUBLIC_API_URL for browser-to-server communication.
 */
export const getBaseApiUrl = (): string => {
    // If we're on the server
    if (typeof window === 'undefined') {
        // 1. Prioritize explicit internal URL
        if (process.env.INTERNAL_API_URL) return process.env.INTERNAL_API_URL;

        // 2. If NEXT_PUBLIC_API_URL is set and is NOT localhost, use it (likely production)
        const publicUrl = process.env.NEXT_PUBLIC_API_URL;
        if (publicUrl && !publicUrl.includes('localhost') && !publicUrl.includes('127.0.0.1')) {
            return publicUrl;
        }

        // 3. Fallback: In Docker Compose, the API service is reachable at http://api:3001
        return 'http://api:3001';
    }

    // If we're on the client
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};
