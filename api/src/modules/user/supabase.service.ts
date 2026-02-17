import { supabase } from '../../core/config/supabase.config';

export interface UserProfileSync {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    country?: string | null;
    city?: string | null;
    timezone?: string | null;
    is_claimed?: boolean;
    is_anonymous?: boolean;
}

export const supabaseService = {
    async syncProfile(profile: UserProfileSync) {
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    ...profile,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('[SUPABASE] Profile sync error:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error('[SUPABASE] Unexpected sync error:', error);
            return { success: false, error };
        }
    }
};
