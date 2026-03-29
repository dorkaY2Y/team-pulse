// create-team.js – Creates team + members, sends invite emails via Resend
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const RESEND_KEY   = process.env.RESEND_API_KEY;
const SITE_URL     = process.env.URL || 'http://localhost:8888';
const FROM_EMAIL   = process.env.FROM_EMAIL || 'Team Pulse <onboarding@resend.dev>';

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

async function sb(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: opts.method || 'GET',
    headers: { ...SB_HEADERS, ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function sendEmail(to, subject, html, replyTo) {
  if (!RESEND_KEY) { console.warn('RESEND_API_KEY not set, skipping email to', to); return; }
  const payload = { from: FROM_EMAIL, to, subject, html };
  if (replyTo) payload.reply_to = replyTo;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) console.error(`Email failed for ${to}:`, await res.text());
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond(200, {});
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const { teamName, leaderName, leaderEmail, memberEmails } = JSON.parse(event.body);

    if (!teamName?.trim() || !leaderName?.trim() || !leaderEmail?.trim() || !memberEmails?.length) {
      return respond(400, { error: 'Kérlek tölts ki minden mezőt és adj meg legalább egy email címet.' });
    }

    // Dedupe and clean emails
    const emails = [...new Set(memberEmails.map(e => e.trim().toLowerCase()).filter(Boolean))];
    if (emails.length === 0) return respond(400, { error: 'Adj meg legalább egy érvényes email címet.' });

    // Create team
    const teamToken = crypto.randomUUID();
    const [team] = await sb('teams', {
      method: 'POST',
      body: { name: teamName.trim(), leader_name: leaderName.trim(), leader_email: leaderEmail.trim().toLowerCase(), token: teamToken }
    });

    // Create members
    const members = emails.map(email => ({
      team_id: team.id,
      email,
      token: crypto.randomUUID()
    }));
    const created = await sb('team_members', { method: 'POST', body: members });

    // Send invite emails to members
    const reportUrl = `${SITE_URL}/report?token=${teamToken}`;
    for (const m of created) {
      const surveyUrl = `${SITE_URL}/survey?token=${m.token}`;
      await sendEmail(m.email,
        `Meghívó: ${teamName} csapatfelmérés – Team Pulse`,
        inviteHtml(teamName, leaderName, surveyUrl),
        leaderEmail.trim().toLowerCase()
      );
    }

    // Send confirmation to leader
    await sendEmail(leaderEmail.trim().toLowerCase(),
      `Team Pulse – Csapatod létrehozva: ${teamName}`,
      confirmHtml(teamName, created.length, reportUrl)
    );

    return respond(200, { success: true, teamToken, memberCount: created.length });

  } catch (err) {
    console.error('create-team error:', err);
    return respond(500, { error: err.message });
  }
};

// ─── Email templates ─────────────────────────────────────

function inviteHtml(teamName, leaderName, surveyUrl) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="font-family:'Exo',system-ui,sans-serif;font-weight:900;font-size:1.4rem;color:#F2F2F0;margin-bottom:4px;">TEAM PULSE</div>
    <div style="height:2px;width:40px;background:#DED114;margin-bottom:32px;"></div>

    <p style="color:#F2F2F0;font-size:1rem;line-height:1.7;margin-bottom:8px;">Szia!</p>
    <p style="color:rgba(242,242,240,0.7);font-size:0.95rem;line-height:1.7;margin-bottom:24px;">
      <strong style="color:#F2F2F0;">${leaderName}</strong> meghívott, hogy töltsd ki a
      <strong style="color:#DED114;">${teamName}</strong> csapat felmérését.
    </p>

    <p style="color:rgba(242,242,240,0.4);font-size:0.8rem;margin-bottom:24px;">
      5 dimenzió &nbsp;·&nbsp; 40 kérdés &nbsp;·&nbsp; kb. 15 perc
    </p>

    <a href="${surveyUrl}" style="display:inline-block;background:#DED114;color:#111;font-family:'Exo',system-ui,sans-serif;font-weight:700;font-size:0.9rem;padding:14px 32px;border-radius:8px;text-decoration:none;">
      Kitöltés megkezdése →
    </a>

    <p style="color:rgba(242,242,240,0.25);font-size:0.72rem;margin-top:40px;border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;">
      Ez az email a Team Pulse csapatfelmérő rendszerből érkezett.<br>
      Ha nem ismered a feladót, nyugodtan hagyd figyelmen kívül.
    </p>
  </div>
</body></html>`;
}

function confirmHtml(teamName, memberCount, reportUrl) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="font-family:'Exo',system-ui,sans-serif;font-weight:900;font-size:1.4rem;color:#F2F2F0;margin-bottom:4px;">TEAM PULSE</div>
    <div style="height:2px;width:40px;background:#DED114;margin-bottom:32px;"></div>

    <p style="color:#F2F2F0;font-size:1.1rem;line-height:1.7;margin-bottom:8px;">
      ✓ Csapatod sikeresen létrehozva!
    </p>

    <div style="background:rgba(222,209,20,0.08);border:1px solid rgba(222,209,20,0.15);border-radius:10px;padding:20px;margin:20px 0;">
      <div style="color:#DED114;font-family:'Exo',system-ui,sans-serif;font-weight:700;font-size:1rem;">${teamName}</div>
      <div style="color:rgba(242,242,240,0.5);font-size:0.85rem;margin-top:6px;">Meghívók kiküldve: <strong style="color:#F2F2F0;">${memberCount} fő</strong></div>
    </div>

    <p style="color:rgba(242,242,240,0.7);font-size:0.9rem;line-height:1.7;margin-bottom:24px;">
      Ha mindenki kitöltötte a kérdőívet, automatikusan elküldjük neked a riportot AI coaching elemzéssel.
      Addig is nyomon követheted a haladást:
    </p>

    <a href="${reportUrl}" style="display:inline-block;background:#DED114;color:#111;font-family:'Exo',system-ui,sans-serif;font-weight:700;font-size:0.9rem;padding:14px 32px;border-radius:8px;text-decoration:none;">
      Riport megtekintése →
    </a>

    <p style="color:rgba(242,242,240,0.25);font-size:0.72rem;margin-top:40px;border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;">
      Mentsd meg ezt az emailt – a riport linkje csak itt és az automatikus riport emailben található.
    </p>
  </div>
</body></html>`;
}
