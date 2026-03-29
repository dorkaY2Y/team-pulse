// config.example.js – Copy to config.js for local development
// config.js is gitignored – never commit real credentials

const CONFIG = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJxxxxxx'
};

// Server-side env vars (set in Netlify dashboard, not here):
// ANTHROPIC_API_KEY – Claude API key for AI insights
// RESEND_API_KEY – Resend API key for email sending
// FROM_EMAIL – Sender email (e.g. "Team Pulse <noreply@yourdomain.com>")
