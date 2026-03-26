// build-config.js – Generates config.js from Netlify environment variables
// Required env vars: SUPABASE_URL, SUPABASE_ANON_KEY
// Optional env vars: ANTHROPIC_API_KEY, ADMIN_PASSWORD

const fs = require('fs');

const config = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'y2y2024'
};

if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_ANON_KEY not set. Dashboard will not work.');
}

const content = `// config.js – Auto-generated during build (do not edit)
const CONFIG = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync('config.js', content);
console.log('config.js generated successfully.');
