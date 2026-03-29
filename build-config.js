// build-config.js – Generates config.js from Netlify environment variables
// Only SUPABASE vars are needed client-side (API keys stay server-side)

const fs = require('fs');

const config = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ''
};

if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_ANON_KEY not set.');
}

const content = `// config.js – Auto-generated during build (do not edit)
const CONFIG = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync('config.js', content);
console.log('config.js generated successfully.');
