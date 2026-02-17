import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('[SUPABASE] Missing Supabase URL or Secret Key in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
