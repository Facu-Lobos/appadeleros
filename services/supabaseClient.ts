
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        "Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) not set. " +
        "Database features will be disabled. The app will run with in-memory data."
    );
}

// Export the client so it can be used throughout the app.
// The conditional export handles cases where env vars are not set,
// allowing the app to run without a database connection for development or testing.
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;

