// generate-report-background.js – Background function: generates AI insights + sends report email
// Netlify background function (name ends with -background) – runs up to 15 minutes

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_ANON_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const RESEND_KEY    = process.env.RESEND_API_KEY;
const SITE_URL      = process.env.URL || 'http://localhost:8888';
const FROM_EMAIL    = process.env.FROM_EMAIL || 'Team Pulse <onboarding@resend.dev>';

const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

const DIM_KEYS = ['ps', 'tr', 'vc', 'cc', 'sg'];
const DIM_NAMES = {
  ps: 'Pszichológiai Biztonság',
  tr: 'Csapatszerepek & Hatékonyság',
  vc: 'Értékek & Kultúra Illeszkedés',
  cc: 'Kommunikáció & Konfliktuskezelés',
  sg: 'Erősségek & Fejlődési Fókusz'
};

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: SB_HEADERS });
  if (!res.ok) throw new Error(`Supabase GET ${res.status}`);
  return res.json();
}

async function sbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...SB_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${res.status}`);
  return res.json();
}

function computeAverages(responses) {
  const result = {};
  DIM_KEYS.forEach(k => {
    const vals = [];
    responses.forEach(r => {
      for (let i = 1; i <= 8; i++) {
        const v = r[`${k}_${i}`];
        if (v != null) vals.push(v);
      }
    });
    if (!vals.length) return;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((a, b) => a + (b - avg) ** 2, 0) / vals.length);
    result[k] = { avg, std, min: Math.min(...vals), max: Math.max(...vals) };
  });
  return result;
}

exports.handler = async (event) => {
  try {
    const { teamId } = JSON.parse(event.body);
    if (!teamId) { console.error('No teamId'); return { statusCode: 400 }; }

    // Fetch team + responses
    const teams = await sbGet(`teams?id=eq.${teamId}&select=*`);
    if (!teams.length) { console.error('Team not found'); return { statusCode: 404 }; }
    const team = teams[0];

    const responses = await sbGet(`responses?team_id=eq.${teamId}&order=submitted_at.asc`);
    if (!responses.length) { console.error('No responses'); return { statusCode: 400 }; }

    // Compute averages
    const avgs = computeAverages(responses);

    // Collect open answers
    const openText = DIM_KEYS.map(k => {
      const lines = responses
        .filter(r => r[`${k}_open`])
        .map(r => `  – ${r[`${k}_open`]}`)
        .join('\n');
      return lines ? `${DIM_NAMES[k]}:\n${lines}` : null;
    }).filter(Boolean).join('\n\n');

    // Generate AI insights
    const insights = await generateInsights(team.name, responses.length, avgs, openText);

    // Save insights to team
    await sbPatch(`teams?id=eq.${teamId}`, { insights });

    // Send report email to leader
    const reportUrl = `${SITE_URL}/report?token=${team.token}`;
    await sendEmail(
      team.leader_email,
      `Team Pulse riport kész – ${team.name}`,
      reportEmailHtml(team, responses.length, avgs, insights, reportUrl)
    );

    console.log(`Report generated and sent for team: ${team.name}`);
    return { statusCode: 200 };

  } catch (err) {
    console.error('generate-report error:', err);
    return { statusCode: 500 };
  }
};

async function generateInsights(teamName, n, avgs, openText) {
  if (!ANTHROPIC_KEY) return 'AI elemzés nem elérhető (hiányzó API kulcs).';

  const systemPrompt = `Te egy tapasztalt team coach vagy, aki coaching módszertannal dolgozik.
Kapsz egy csapat assessment eredményeit 5 dimenzión keresztül (1–7 skálán),
valamint a csapattagok nyílt válaszait.
Elemezd az eredményeket és adj coaching insightokat MAGYARUL.
Légy konkrét – azonosítsd a mintázatokat, feszültségpontokat és erőforrásokat.
Ne adj generic tanácsokat – adj specifikus, erre a csapatra szabott megfigyeléseket.
Formázd a választ Markdown-nal (## fejlécek, **kiemelések**).`;

  const userPrompt = `Csapat: ${teamName} | Kitöltők száma: ${n}

Dimenzió átlagok (1–7 skálán):
${DIM_KEYS.map(k => `– ${DIM_NAMES[k]}: ${avgs[k]?.avg?.toFixed(2) ?? 'N/A'} (szórás: ${avgs[k]?.std?.toFixed(2) ?? 'N/A'})`).join('\n')}

Nyílt válaszok (dimenzióként csoportosítva):
${openText || 'Nem érkeztek nyílt válaszok.'}

Kérlek adj:
## 1. Dimenzió elemzések
Minden dimenzióhoz egy coaching szempontú bekezdést: mit látsz, mi a mintázat, mi a tét.

## 2. Top 3 coaching fókusz
Prioritás sorrendben, indoklással – melyek a legfontosabb beavatkozási pontok.

## 3. Azonnali akció
Egyetlen mondat: mi az a dolog, amit MOST kellene megszólítani ebben a csapatban?`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Anthropic API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

async function sendEmail(to, subject, html) {
  if (!RESEND_KEY) { console.warn('RESEND_API_KEY not set'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
  });
  if (!res.ok) console.error(`Email failed:`, await res.text());
}

function reportEmailHtml(team, n, avgs, insights, reportUrl) {
  const dimRows = DIM_KEYS.map(k => {
    const a = avgs[k];
    const avg = a ? a.avg.toFixed(2) : '—';
    return `<tr><td style="padding:8px 12px;color:rgba(242,242,240,0.7);font-size:0.85rem;border-bottom:1px solid rgba(255,255,255,0.06);">${DIM_NAMES[k]}</td><td style="padding:8px 12px;color:#DED114;font-weight:700;font-size:0.95rem;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06);">${avg}</td></tr>`;
  }).join('');

  // Convert markdown insights to basic HTML
  const insightsHtml = insights
    .replace(/^### (.+)$/gm, '<h4 style="color:#DED114;font-size:0.85rem;margin:18px 0 6px;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color:#DED114;font-size:0.9rem;margin:22px 0 8px;">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F2F2F0;">$1</strong>')
    .replace(/\n\n/g, '</p><p style="color:rgba(242,242,240,0.7);font-size:0.88rem;line-height:1.75;margin-bottom:8px;">')
    .replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="font-family:'Exo',system-ui,sans-serif;font-weight:900;font-size:1.4rem;color:#F2F2F0;margin-bottom:4px;">TEAM PULSE</div>
    <div style="height:2px;width:40px;background:#DED114;margin-bottom:32px;"></div>

    <p style="color:#F2F2F0;font-size:1.1rem;line-height:1.5;margin-bottom:4px;">
      Riport kész: <strong style="color:#DED114;">${team.name}</strong>
    </p>
    <p style="color:rgba(242,242,240,0.5);font-size:0.85rem;margin-bottom:24px;">
      ${n} kitöltő &nbsp;·&nbsp; ${new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <thead><tr><th style="text-align:left;padding:8px 12px;color:rgba(242,242,240,0.35);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.1);">Dimenzió</th><th style="text-align:right;padding:8px 12px;color:rgba(242,242,240,0.35);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.1);">Átlag</th></tr></thead>
      <tbody>${dimRows}</tbody>
    </table>

    <div style="background:rgba(222,209,20,0.06);border:1px solid rgba(222,209,20,0.12);border-radius:10px;padding:24px;margin-bottom:28px;">
      <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#DED114;margin-bottom:14px;">AI Coaching Insights</div>
      <p style="color:rgba(242,242,240,0.7);font-size:0.88rem;line-height:1.75;margin-bottom:8px;">${insightsHtml}</p>
    </div>

    <a href="${reportUrl}" style="display:inline-block;background:#DED114;color:#111;font-family:'Exo',system-ui,sans-serif;font-weight:700;font-size:0.9rem;padding:14px 32px;border-radius:8px;text-decoration:none;">
      Teljes interaktív riport →
    </a>

    <p style="color:rgba(242,242,240,0.25);font-size:0.72rem;margin-top:40px;border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;">
      Ez egy automatikus riport a Team Pulse rendszerből.
    </p>
  </div>
</body></html>`;
}
