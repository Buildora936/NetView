// ==========================================
// NetView
// supabase.js
// ==========================================

// Import Supabase client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================================
// Project Configuration
// ==========================================

const SUPABASE_URL = "https://orgkcanbzcgetduanvhd.supabase.co";

const SUPABASE_ANON_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ2tjYW5iemNnZXRkdWFudmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODE5MDUsImV4cCI6MjA5NjI1NzkwNX0.hRFtHctWNzbnaSEPzjqAIg2AseVbXs3EphcPTWsrWf4";

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
