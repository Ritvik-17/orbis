import { createClient } from '@supabase/supabase-js';

// Replace these with your project's details
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // Supabase project URL
// const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY; // Public API key
// const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Service Role Key

export const supabase = createClient(supabaseUrl,SUPABASE_ANON_KEY);
