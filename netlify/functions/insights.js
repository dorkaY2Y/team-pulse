// netlify/functions/insights.js
// Serverless function: fogadja az aggregált adatokat, hívja a Claude API-t,
// visszaadja a coaching insightokat – az API kulcs sosem kerül a böngészőbe.

const DIM_NAMES = {
  ps: 'Pszichológiai Biztonság',
  tr: 'Csapatszerepek & Hatékonyság',
  vc: 'Értékek & Kultúra Illeszkedés',
  cc: 'Kommunikáció & Konfliktuskezelés',
  sg: 'Erősségek & Fejlődési Fókusz'
};
const DIM_KEYS = ['ps', 'tr', 'vc', 'cc', 'sg'];

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY nincs beállítva a Netlify env vars-ban.' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { teamName, n, averages, openAnswers } = payload;

  const systemPrompt = `Te egy tapasztalt team coach vagy, aki coaching módszertannal dolgozik.
Kapsz egy csapat assessment eredményeit 5 dimenzión keresztül (1–7 skálán),
valamint a csapattagok nyílt válaszait.
Elemezd az eredményeket és adj coaching insightokat MAGYARUL.
Légy konkrét – azonosítsd a mintázatokat, feszültségpontokat és erőforrásokat.
Ne adj generic tanácsokat – adj specifikus, erre a csapatra szabott megfigyeléseket.
Formázd a választ Markdown-nal (## fejlécek, **kiemelések**).`;

  const userPrompt = `Csapat: ${teamName} | Kitöltők száma: ${n}

Dimenzió átlagok (1–7 skálán):
${DIM_KEYS.map(k => `– ${DIM_NAMES[k]}: ${averages[k]?.avg ?? 'N/A'} (szórás: ${averages[k]?.std ?? 'N/A'})`).join('\n')}

Nyílt válaszok (dimenzióként csoportosítva):
${openAnswers}

Kérlek adj:
## 1. Dimenzió elemzések
Minden dimenzióhoz egy coaching szempontú bekezdést: mit látsz, mi a mintázat, mi a tét.

## 2. Top 3 coaching fókusz
Prioritás sorrendben, indoklással – melyek a legfontosabb beavatkozási pontok.

## 3. Azonnali akció
Egyetlen mondat: mi az a dolog, amit MOST kellene megszólítani ebben a csapatban?`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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
    const insights = data.content[0].text;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ insights })
    };

  } catch (err) {
    console.error('Insights function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
