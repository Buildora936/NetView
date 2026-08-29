// ==========================================
// NetView
// supabase.js
// ==========================================

// Import Supabase client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================================
// Project Configuration
// ==========================================

const SUPABASE_URL = "https://vmgkugwhvmkxvavumxvd.supabase.co";

const SUPABASE_ANON_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtZ2t1Z3dodm1reHZhdnVteHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NjIyMTYsImV4cCI6MjEwMzUzODIxNn0.eA_uXX4-EBvfOjHFO77tQNz46e6B76cCkpve-QYotyA";

// ==========================================
// Create Client
// ==========================================

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {

            autoRefreshToken: true,

            persistSession: true,

            detectSessionInUrl: true

        },

        realtime: {

            params: {

                eventsPerSecond: 10

            }

        }

    }
);

// ==========================================
// Export
// ==========================================

export { SUPABASE_URL };
