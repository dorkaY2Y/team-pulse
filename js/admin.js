// admin.js – Dashboard logic · Supabase read · AI insights via Netlify function

// ─── Auth guard ───────────────────────────────────────────
if (sessionStorage.getItem('tp_admin') !== 'true') {
  window.location.href = 'index.html';
}

function logout() {
  sessionStorage.removeItem('tp_admin');
  window.location.href = 'index.html';
}

// ─── Constants ────────────────────────────────────────────
const DIM_KEYS  = ['ps', 'tr', 'vc', 'cc', 'sg'];
const DIM_NAMES = {
  ps: 'Pszichológiai Biztonság',
  tr: 'Csapatszerepek & Hatékonyság',
  vc: 'Értékek & Kultúra Illeszkedés',
  cc: 'Kommunikáció & Konfliktuskezelés',
  sg: 'Erősségek & Fejlődési Fókusz'
};
const DIM_ICONS = { ps: '🛡️', tr: '⚙️', vc: '🌐', cc: '💬', sg: '🌱' };
const OPEN_QS   = {
  ps: 'Van olyan helyzet, amelyben nem merted volna kimondani, amit gondolsz?',
  tr: 'Milyen szerep hiányzik ebből a csapatból?',
  vc: 'Mi az az érték, amit hiányolsz ebből a csapatból?',
  cc: 'Van olyan kimondatlan feszültség, amiről kellene beszélni?',
  sg: 'Milyen területen szeretnél fejlődni a következő 6 hónapban?'
};

// ─── State ────────────────────────────────────────────────
let currentTeamId   = null;
let currentTeamName = '';
let currentResponses = [];
let radarChart = null;

// ─── Init ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', loadTeamList);

async function loadTeamList() {
  const { data } = await supabaseClient
    .from('teams')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  const sel = document.getElementById('teamSelect');
  sel.innerHTML = '<option value="">— Válassz csapatot —</option>';
  if (data) {
    data.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      sel.appendChild(opt);
    });
  }
}

async function createTeam() {
  const inp  = document.getElementById('newTeamName');
  const name = inp.value.trim();
  if (!name) { inp.focus(); return; }

  const { data, error } = await supabaseClient
    .from('teams')
    .insert([{ name }])
    .select()
    .single();

  if (error) { alert('Hiba: ' + error.message); return; }
  inp.value = '';
  await loadTeamList();
  document.getElementById('teamSelect').value = data.id;
  await loadTeam();
}

async function loadTeam() {
  const teamId = document.getElementById('teamSelect').value;
  if (!teamId) {
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
    currentTeamId = null;
    return;
  }

  currentTeamId = teamId;
  const opt = document.querySelector(`#teamSelect option[value="${teamId}"]`);
  currentTeamName = opt ? opt.textContent : '';
  document.getElementById('teamNameDisplay').textContent = currentTeamName;

  const { data, error } = await supabaseClient
    .from('responses')
    .select('*')
    .eq('team_id', teamId)
    .order('submitted_at', { ascending: true });

  if (error) { alert('Hiba: ' + error.message); return; }
  currentResponses = data || [];

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('dashboardContent').style.display = 'block';
  document.getElementById('insightsArea').style.display = 'none';

  renderStats();
  renderRadar();
  renderDeepDive();
}

// ─── Copy survey link ─────────────────────────────────────
function copyLink() {
  if (!currentTeamId) { alert('Először válassz csapatot!'); return; }
  const base = window.location.href.replace(/admin\/dashboard\.html.*$/, '');
  const link = `${base}survey.html?team=${currentTeamId}`;
  navigator.clipboard.writeText(link)
    .then(() => showToast('🔗 Link vágólapra másolva!'))
    .catch(() => prompt('Másold ki:', link));
}

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position:'fixed', bottom:'24px', right:'24px', zIndex:'9999',
    background:'var(--yellow)', color:'#111', padding:'10px 18px',
    borderRadius:'8px', fontFamily:'Exo,sans-serif', fontWeight:'700',
    fontSize:'0.85rem', boxShadow:'0 4px 16px rgba(0,0,0,0.3)',
    animation:'fadeUp 0.3s ease'
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ─── Stats row ────────────────────────────────────────────
function renderStats() {
  const n = currentResponses.length;
  const avgs = computeAverages();

  // Overall avg across all dims
  const dimAvgs = DIM_KEYS.map(k => avgs[k]?.avg || 0).filter(v => v > 0);
  const overall = dimAvgs.length ? (dimAvgs.reduce((a, b) => a + b, 0) / dimAvgs.length).toFixed(2) : '—';

  const last = n > 0 ? fmtDate(currentResponses[n - 1].submitted_at) : '—';

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Kitöltők</div>
      <div class="stat-value">${n}</div>
      <div class="stat-sub">válasz beérkezett</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Összátlag</div>
      <div class="stat-value">${overall}</div>
      <div class="stat-sub">/ 7.00 pontig</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Utolsó kitöltés</div>
      <div class="stat-value" style="font-size:1.3rem;">${last}</div>
      <div class="stat-sub">&nbsp;</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Csapat</div>
      <div class="stat-value" style="font-size:1.1rem;letter-spacing:-0.01em;">${currentTeamName}</div>
      <div class="stat-sub">&nbsp;</div>
    </div>
  `;

  // Members table
  const tbody = document.getElementById('membersBody');
  if (!tbody) return;
  if (n === 0) {
    tbody.innerHTML = '<tr><td colspan="2" style="color:var(--muted);text-align:center;padding:20px;">Még nincs kitöltés.</td></tr>';
    return;
  }
  tbody.innerHTML = currentResponses.map(r => `
    <tr>
      <td>${r.member_name}</td>
      <td style="color:var(--muted);font-size:0.75rem;">${fmtDate(r.submitted_at)}</td>
    </tr>
  `).join('');
}

// ─── Radar chart + Score bars ─────────────────────────────
function renderRadar() {
  const avgs = computeAverages();

  // Score bars
  const scoresList = document.getElementById('scoresList');
  if (scoresList) {
    scoresList.innerHTML = DIM_KEYS.map(k => {
      const a = avgs[k];
      const avg = a ? a.avg.toFixed(2) : '—';
      const pct = a ? ((a.avg - 1) / 6) * 100 : 0;
      return `
        <div class="score-row">
          <div class="score-icon">${DIM_ICONS[k]}</div>
          <div class="score-name">${DIM_NAMES[k]}</div>
          <div class="score-track"><div class="score-fill" style="width:${pct}%"></div></div>
          <div class="score-num">${avg}</div>
        </div>
      `;
    }).join('');
  }

  // Radar
  const data = DIM_KEYS.map(k => avgs[k]?.avg || 0);
  if (radarChart) radarChart.destroy();

  const ctx = document.getElementById('radarChart')?.getContext('2d');
  if (!ctx) return;

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: DIM_KEYS.map(k => {
        const n = DIM_NAMES[k];
        return n.length > 16 ? n.replace(' & ', '\n& ').split('\n') : n;
      }),
      datasets: [{
        label: currentTeamName,
        data,
        backgroundColor: 'rgba(222,209,20,0.12)',
        borderColor: '#DED114',
        borderWidth: 2.5,
        pointBackgroundColor: '#DED114',
        pointBorderColor: '#111',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0, max: 7,
          ticks: {
            stepSize: 1,
            color: 'rgba(255,255,255,0.3)',
            backdropColor: 'transparent',
            font: { size: 9 }
          },
          grid:       { color: 'rgba(255,255,255,0.07)' },
          angleLines: { color: 'rgba(255,255,255,0.07)' },
          pointLabels: {
            color: 'rgba(242,242,240,0.6)',
            font: { size: 11, family: 'Exo', weight: '600' }
          }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// ─── Deep dive (accordion per dimension) ─────────────────
function renderDeepDive() {
  const avgs = computeAverages();
  const container = document.getElementById('dimDeepDive');
  container.innerHTML = '';

  DIM_KEYS.forEach((k, idx) => {
    const stats = avgs[k];
    const opens = currentResponses
      .filter(r => r[`${k}_open`])
      .map(r => ({ name: r.member_name, text: r[`${k}_open`] }));

    const scoreText = stats
      ? `Átlag <strong style="color:var(--yellow)">${stats.avg.toFixed(2)}</strong> &nbsp;·&nbsp; σ ${stats.std.toFixed(2)} &nbsp;·&nbsp; ${stats.min}–${stats.max}`
      : '<span style="color:var(--muted)">Nincs adat</span>';

    const acc = document.createElement('div');
    acc.className = 'dim-accordion';
    acc.innerHTML = `
      <div class="dim-accordion__header" onclick="toggleAccordion(this)">
        <div class="dim-accordion__title">
          ${DIM_ICONS[k]}
          <span>${DIM_NAMES[k]}</span>
          <span class="pill pill--dim" style="font-size:0.6rem;">${opens.length} nyílt válasz</span>
        </div>
        <div class="dim-accordion__meta">
          <span>${scoreText}</span>
          <span class="chevron">▸</span>
        </div>
      </div>
      <div class="dim-accordion__body" id="acc_body_${k}">
        ${buildHeatmap(k)}
        ${opens.length > 0 ? `
          <div style="margin-top:20px;">
            <div class="label-caps" style="margin-bottom:12px;">${OPEN_QS[k]}</div>
            <ul class="open-answers">
              ${opens.map(a => `
                <li>
                  <span class="open-name">${a.name}</span>
                  ${a.text}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : '<div style="color:var(--muted);font-size:0.82rem;margin-top:12px;">Nincs nyílt válasz ehhez a dimenzióhoz.</div>'}
      </div>
    `;
    container.appendChild(acc);
  });
}

function toggleAccordion(header) {
  const body    = header.nextElementSibling;
  const chevron = header.querySelector('.chevron');
  const isOpen  = body.classList.toggle('open');
  chevron.classList.toggle('open', isOpen);
  chevron.textContent = isOpen ? '▾' : '▸';
}

function buildHeatmap(dimKey) {
  if (!currentResponses.length) return '<div style="color:var(--muted);font-size:0.82rem;">Nincs adat.</div>';

  const headerCells = Array.from({length:8}, (_,i) => `<th>K${i+1}</th>`).join('');
  const bodyRows = currentResponses.map(r => {
    const cells = Array.from({length:8}, (_,i) => {
      const val = r[`${dimKey}_${i+1}`];
      if (!val) return '<td><span class="heat-cell heat-null">—</span></td>';
      const cls = val <= 2 ? 'heat-1' : val <= 3 ? 'heat-3' : val <= 4 ? 'heat-4' : val <= 5 ? 'heat-5' : 'heat-6';
      return `<td><span class="heat-cell ${cls}">${val}</span></td>`;
    }).join('');
    return `<tr>
      <td style="color:var(--white-dim);font-size:0.78rem;white-space:nowrap;padding-right:8px;">${r.member_name}</td>
      ${cells}
    </tr>`;
  }).join('');

  return `
    <div class="heatmap-wrap">
      <table class="heatmap-table">
        <thead><tr><th>Név</th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
}

// ─── AI Coaching Insights (via Netlify Function) ──────────
async function generateInsights() {
  if (!currentResponses.length) {
    alert('Nincs elegendő adat az elemzéshez.');
    return;
  }

  const btn = document.getElementById('insightsBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Claude elemez…';

  const avgs = computeAverages();
  const n    = currentResponses.length;

  // Collect open answers per dimension
  const openText = DIM_KEYS.map(k => {
    const lines = currentResponses
      .filter(r => r[`${k}_open`])
      .map(r => `  – ${r[`${k}_open`]}`)
      .join('\n');
    return lines ? `${DIM_NAMES[k]}:\n${lines}` : null;
  }).filter(Boolean).join('\n\n');

  const payload = {
    teamName: currentTeamName,
    n,
    averages: Object.fromEntries(
      DIM_KEYS.map(k => [k, avgs[k] ? { avg: avgs[k].avg.toFixed(2), std: avgs[k].std.toFixed(2) } : null])
    ),
    openAnswers: openText || 'Nem érkeztek nyílt válaszok.'
  };

  try {
    // Try Netlify function first (production), fall back to direct API (local dev)
    let text;
    const fnRes = await fetch('/.netlify/functions/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (fnRes.ok) {
      const json = await fnRes.json();
      text = json.insights;
    } else if (typeof CONFIG !== 'undefined' && CONFIG.ANTHROPIC_API_KEY) {
      // Local dev fallback – direct browser call
      text = await callAnthropicDirect(payload);
    } else {
      throw new Error('Nincs elérhető AI endpoint.');
    }

    document.getElementById('insightsArea').style.display = 'block';
    document.getElementById('insightsContent').innerHTML = formatInsights(text);
    document.getElementById('insightsArea').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error(err);
    alert('AI hiba: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ Insights újragenerálása';
  }
}

async function callAnthropicDirect(payload) {
  const { teamName, n, averages, openAnswers } = payload;

  const system = `Te egy tapasztalt team coach vagy, aki Y2Y módszertannal dolgozik.
Kapsz egy csapat assessment eredményeit 5 dimenzión keresztül (1–7 skálán), valamint a csapattagok nyílt válaszait.
Elemezd az eredményeket és adj coaching insightokat MAGYARUL.
Légy konkrét – azonosítsd a mintázatokat, feszültségpontokat és erőforrásokat.
Ne adj generic tanácsokat – adj specifikus, erre a csapatra szabott megfigyeléseket.`;

  const user = `Csapat: ${teamName} | Kitöltők: ${n}

Dimenzió átlagok (1–7):
${DIM_KEYS.map(k => `– ${DIM_NAMES[k]}: ${averages[k]?.avg ?? 'N/A'} (σ ${averages[k]?.std ?? 'N/A'})`).join('\n')}

Nyílt válaszok:
${openAnswers}

Kérlek adj:
1. Minden dimenzióhoz coaching szempontú bekezdést (mit látsz, mi a mintázat, mi a tét)
2. Top 3 javasolt fókusztéma prioritás sorrendben, indoklással
3. Egy mondat: mi az a dolog, amit MOST kellene megszólítani ebben a csapatban?`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }]
    })
  });

  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.error?.message || res.statusText);
  }
  const data = await res.json();
  return data.content[0].text;
}

function formatInsights(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h3>$1</h3>')
    .replace(/^# (.+)$/gm,   '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// ─── Stats helpers ────────────────────────────────────────
function computeAverages() {
  const result = {};
  if (!currentResponses.length) return result;

  DIM_KEYS.forEach(k => {
    const vals = [];
    currentResponses.forEach(r => {
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

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('hu-HU', { year:'numeric', month:'short', day:'numeric' });
}
