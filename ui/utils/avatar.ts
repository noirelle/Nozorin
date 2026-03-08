/**
 * Constructs a DiceBear avatar URL from a seed string.
 * Uses the 'adventurer' style for friendly, unique avatars.
 */
export const getAvatarUrl = (seed?: string | null): string => {
    if (!seed) return '';

    // If it's already a full URL, return as-is (backward compat)
    if (seed.startsWith('http') || seed.startsWith('/avatars')) {
        return seed;
    }

    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
};
