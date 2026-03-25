// supabase-client.js – Initializes the Supabase client using config.js

const supabaseClient = supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY
);
