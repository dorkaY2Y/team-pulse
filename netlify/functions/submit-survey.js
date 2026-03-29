// submit-survey.js – Saves survey response, checks completion, triggers report

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const SITE_URL     = process.env.URL || 'http://localhost:8888';

const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function respond(code, body) {
  return { statusCode: code, headers: CORS, body: JSON.stringify(body) };
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: SB_HEADERS });
  if (!res.ok) throw new Error(`Supabase GET ${res.status}`);
  return res.json();
}

async function sbPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST', headers: { ...SB_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Supabase POST ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH', headers: { ...SB_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${res.status}: ${await res.text()}`);
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond(200, {});
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const { memberToken, memberName, answers } = JSON.parse(event.body);

    if (!memberToken || !memberName?.trim()) {
      return respond(400, { error: 'Hiányzó adatok.' });
    }

    // 1. Look up member by token
    const members = await sbGet(`team_members?token=eq.${memberToken}&select=*`);
    if (!members.length) return respond(404, { error: 'Érvénytelen link.' });
    const member = members[0];

    if (member.completed) return respond(409, { error: 'Ezt a kérdőívet már kitöltötted.' });

    // 2. Get team info
    const teams = await sbGet(`teams?id=eq.${member.team_id}&select=*`);
    if (!teams.length) return respond(404, { error: 'Csapat nem található.' });
    const team = teams[0];

    // 3. Build response record
    const record = { team_id: team.id, member_name: memberName.trim() };
    const dimKeys = ['ps', 'tr', 'vc', 'cc', 'sg'];
    for (const dk of dimKeys) {
      for (let i = 1; i <= 8; i++) {
        record[`${dk}_${i}`] = answers?.[dk]?.[`q${i}`] || null;
      }
      record[`${dk}_open`] = answers?.[dk]?.open || null;
    }

    // 4. Insert response
    await sbPost('responses', record);

    // 5. Mark member as completed
    await sbPatch(`team_members?token=eq.${memberToken}`, {
      completed: true,
      name: memberName.trim(),
      completed_at: new Date().toISOString()
    });

    // 6. Check if all members completed
    const pending = await sbGet(`team_members?team_id=eq.${team.id}&completed=eq.false`);

    if (pending.length === 0) {
      // All done! Update team status
      await sbPatch(`teams?id=eq.${team.id}`, { status: 'complete' });

      // Trigger background report generation
      try {
        fetch(`${SITE_URL}/.netlify/functions/generate-report-background`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: team.id })
        }); // fire and forget
      } catch (e) {
        console.error('Failed to trigger report:', e);
      }
    }

    return respond(200, { success: true, allComplete: pending.length === 0 });

  } catch (err) {
    console.error('submit-survey error:', err);
    return respond(500, { error: err.message });
  }
};
