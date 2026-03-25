// admin.js – Dashboard logic, Supabase read, Claude API call

// Auth guard
if (sessionStorage.getItem('tp_admin') !== 'true') {
  window.location.href = 'index.html';
}

function logout() {
  sessionStorage.removeItem('tp_admin');
  window.location.href = 'index.html';
}

// ─── Constants ──────────────────────────────────────────
const DIM_KEYS = ['ps', 'tr', 'vc', 'cc', 'sg'];
const DIM_NAMES = {
  ps: 'Pszichológiai Biztonság',
  tr: 'Csapatszerepek & Hatékonyság',
  vc: 'Értékek & Kultúra Illeszkedés',
  cc: 'Kommunikáció & Konfliktuskezelés',
  sg: 'Erősségek & Fejlődési Fókusz'
};
const DIM_ICONS = { ps: '🛡️', tr: '⚙️', vc: '🌐', cc: '💬', sg: '🌱' };
const OPEN_QUESTIONS = {
  ps: 'Van olyan helyzet, amelyben nem merted volna kimondani, amit gondolsz? Mi tartott vissza?',
  tr: 'Milyen szerep hiányzik szerinted ebből a csapatból?',
  vc: 'Mi az az érték, amit hiányolsz ebből a csapatból?',
  cc: 'Van olyan kimondatlan feszültség a csapatban, amiről szerinted kellene beszélni?',
  sg: 'Milyen területen szeretnél leginkább fejlődni a következő 6 hónapban?'
};

let currentTeamId = null;
let currentTeamName = '';
let currentResponses = [];
let radarChart = null;
let anonymize = false;

// ─── Init ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', loadTeamList);

async function loadTeamList() {
  const { data, error } = await supabaseClient
    .from('teams')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  const select = document.getElementById('teamSelect');
  select.innerHTML = '<option value="">— Válassz csapatot —</option>';

  if (data) {
    data.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      select.appendChild(opt);
    });
  }
}

async function createTeam() {
  const nameInput = document.getElementById('newTeamName');
  const name = nameInput.value.trim();
  if (!name) { alert('Add meg a csapat nevét!'); return; }

  const { data, error } = await supabaseClient
    .from('teams')
    .insert([{ name }])
    .select()
    .single();

  if (error) { alert('Hiba: ' + error.message); return; }

  nameInput.value = '';
  await loadTeamList();

  // Select the new team
  document.getElementById('teamSelect').value = data.id;
  await loadTeam();
}

async function loadTeam() {
  const teamId = document.getElementById('teamSelect').value;
  if (!teamId) {
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
    return;
  }

  currentTeamId = teamId;

  // Get team name
  const teamOpt = document.querySelector(`#teamSelect option[value="${teamId}"]`);
  currentTeamName = teamOpt ? teamOpt.textContent : '';

  // Fetch responses
  const { data, error } = await supabaseClient
    .from('responses')
    .select('*')
    .eq('team_id', teamId)
    .order('submitted_at', { ascending: true });

  if (error) { alert('Hiba a betöltésnél: ' + error.message); return; }

  currentResponses = data || [];

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('dashboardContent').style.display = 'block';
  document.getElementById('insightsArea').style.display = 'none';

  renderOverview();
  renderRadar();
  renderDeepDive();
}

// ─── Copy survey link ────────────────────────────────────
function copyLink() {
  if (!currentTeamId) { alert('Először válassz csapatot!'); return; }
  const base = window.location.href.replace('admin/dashboard.html', '').replace(/admin\/$/, '');
  const link = `${base}survey.html?team=${currentTeamId}`;
  navigator.clipboard.writeText(link)
    .then(() => alert('Link vágólapra másolva:\n' + link))
    .catch(() => prompt('Másold ki a linket:', link));
}

// ─── Section 1: Overview ─────────────────────────────────
function renderOverview() {
  const n = currentResponses.length;

  document.getElementById('statGrid').innerHTML = `
    <div class="stat-card">
      <div class="label">Kitöltők száma</div>
      <div class="value">${n}</div>
    </div>
    <div class="stat-card">
      <div class="label">Utolsó kitöltés</div>
      <div class="value" style="font-size:1.1rem;padding-top:6px;">
        ${n > 0 ? formatDate(currentResponses[n - 1].submitted_at) : '—'}
      </div>
    </div>
    <div class="stat-card">
      <div class="label">Csapat neve</div>
      <div class="value" style="font-size:1rem;padding-top:6px;">${currentTeamName}</div>
    </div>
  `;

  const memberList = document.getElementById('memberList');
  if (n === 0) {
    memberList.innerHTML = '<li style="color:var(--muted);font-size:0.88rem;">Még nincs kitöltés.</li>';
    return;
  }
  memberList.innerHTML = currentResponses.map(r => `
    <li>
      <span>${r.member_name}</span>
      <span class="member-date">${formatDate(r.submitted_at)}</span>
    </li>
  `).join('');
}

// ─── Section 2: Radar chart ──────────────────────────────
function renderRadar() {
  const n = currentResponses.length;
  const avgs = computeAverages();

  // Scores list
  const scoresList = document.getElementById('scoresList');
  scoresList.innerHTML = DIM_KEYS.map(k => {
    const avg = avgs[k] ? avgs[k].avg.toFixed(2) : '—';
    const pct = avgs[k] ? ((avgs[k].avg - 1) / 6) * 100 : 0;
    return `
      <li>
        <span style="min-width:22px;">${DIM_ICONS[k]}</span>
        <span style="flex:1;font-size:0.82rem;">${DIM_NAMES[k]}</span>
        <div class="score-bar-wrap"><div class="score-bar-fill" style="width:${pct}%"></div></div>
        <span class="score-num">${avg}</span>
      </li>
    `;
  }).join('');

  // Radar chart
  const labels = DIM_KEYS.map(k => DIM_NAMES[k].split(' & ')[0].split(': ')[0]);
  const data = DIM_KEYS.map(k => avgs[k] ? avgs[k].avg : 0);

  if (radarChart) radarChart.destroy();

  const ctx = document.getElementById('radarChart').getContext('2d');
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: DIM_KEYS.map(k => {
        const name = DIM_NAMES[k];
        // Wrap long labels
        return name.length > 18 ? name.match(/.{1,18}(\s|$)/g).map(s => s.trim()) : name;
      }),
      datasets: [{
        label: currentTeamName,
        data,
        backgroundColor: 'rgba(222,209,20,0.15)',
        borderColor: '#DED114',
        borderWidth: 2,
        pointBackgroundColor: '#DED114',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 1,
          max: 7,
          ticks: {
            stepSize: 1,
            color: '#666',
            backdropColor: 'transparent',
            font: { size: 10 }
          },
          grid: { color: 'rgba(255,255,255,0.08)' },
          angleLines: { color: 'rgba(255,255,255,0.08)' },
          pointLabels: {
            color: '#aaa',
            font: { size: 11, family: 'Exo' }
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// ─── Section 3: Deep dive ────────────────────────────────
function renderDeepDive() {
  const avgs = computeAverages();
  const container = document.getElementById('dimDeepDive');
  container.innerHTML = '';

  DIM_KEYS.forEach(k => {
    const stats = avgs[k];
    const openAnswers = currentResponses
      .filter(r => r[`${k}_open`])
      .map(r => ({ name: r.member_name, text: r[`${k}_open`] }));

    const card = document.createElement('div');
    card.className = 'dim-deep-card';

    const scoreText = stats
      ? `Átlag: <strong style="color:#DED114">${stats.avg.toFixed(2)}</strong> &nbsp;|&nbsp; Szórás: ${stats.std.toFixed(2)} &nbsp;|&nbsp; Min: ${stats.min} &nbsp; Max: ${stats.max}`
      : '<span style="color:var(--muted)">Nincs adat</span>';

    card.innerHTML = `
      <div class="dim-deep-header" onclick="toggleDeep(this)">
        <h3>${DIM_ICONS[k]} ${DIM_NAMES[k]}</h3>
        <div style="display:flex;align-items:center;gap:16px;">
          <span style="font-size:0.82rem;color:var(--muted);">${scoreText}</span>
          <span style="color:var(--muted);font-size:1.1rem;">▸</span>
        </div>
      </div>
      <div class="dim-deep-body">
        ${renderHeatmap(k)}
        ${openAnswers.length > 0 ? `
          <div style="margin-top:20px;">
            <div style="font-size:0.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">
              Nyílt válaszok – ${OPEN_QUESTIONS[k]}
            </div>
            <ul class="open-answer-list">
              ${openAnswers.map(a => `
                <li>
                  <span class="answer-name">${a.name}</span>
                  ${a.text}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : '<div style="color:var(--muted);font-size:0.85rem;margin-top:12px;">Nincs nyílt válasz.</div>'}
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleDeep(header) {
  const body = header.nextElementSibling;
  const arrow = header.querySelector('span:last-child');
  body.classList.toggle('open');
  arrow.textContent = body.classList.contains('open') ? '▾' : '▸';
}

function renderHeatmap(dimKey) {
  if (currentResponses.length === 0) return '';

  const rows = currentResponses.map(r => {
    const scores = [];
    for (let i = 1; i <= 8; i++) {
      scores.push(r[`${dimKey}_${i}`]);
    }
    return { name: r.member_name, scores };
  });

  const headerCells = Array.from({length: 8}, (_, i) => `<th>K${i+1}</th>`).join('');

  const bodyRows = rows.map(row => {
    const cells = row.scores.map(s => {
      if (!s) return '<td>—</td>';
      const cls = s <= 3 ? 'heat-low' : s <= 5 ? 'heat-mid' : 'heat-high';
      return `<td><span class="heat-cell ${cls}">${s}</span></td>`;
    }).join('');
    return `<tr><td style="color:#ccc;font-size:0.82rem;white-space:nowrap;">${row.name}</td>${cells}</tr>`;
  }).join('');

  return `
    <div style="overflow-x:auto;">
      <table class="heatmap-table">
        <thead><tr><th>Név</th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
}

// ─── Section 4: AI Coaching Insights ────────────────────
async function generateInsights() {
  if (currentResponses.length === 0) {
    alert('Nincs elegendő adat az elemzéshez.');
    return;
  }

  const btn = document.getElementById('insightsBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Elemzés folyamatban…';

  const avgs = computeAverages();
  const n = currentResponses.length;

  // Build open answers text
  const openAnswers = DIM_KEYS.map(k => {
    const answers = currentResponses
      .filter(r => r[`${k}_open`])
      .map(r => `  - ${r[`${k}_open`]}`)
      .join('\n');
    return answers ? `${DIM_NAMES[k]}:\n${answers}` : null;
  }).filter(Boolean).join('\n\n');

  const systemPrompt = `Te egy tapasztalt team coach vagy, aki Y2Y módszertannal dolgozik.
Kapsz egy csapat assessment eredményeit 5 dimenzión keresztül (1-7 skálán),
valamint a csapattagok nyílt válaszait.
Elemezd az eredményeket és adj coaching insightokat MAGYARUL.
Légy konkrét, ne általánosíts. Azonosítsd a mintázatokat, a feszültségpontokat és az erőforrásokat.
Ne adj generic tanácsokat – adj specifikus, a csapatra szabott megfigyeléseket.`;

  const userPrompt = `Csapat neve: ${currentTeamName}
Kitöltők száma: ${n}

Dimenzió átlagok (1-7 skála):
- Pszichológiai Biztonság: ${avgs.ps ? avgs.ps.avg.toFixed(2) : 'N/A'} (szórás: ${avgs.ps ? avgs.ps.std.toFixed(2) : 'N/A'})
- Csapatszerepek & Hatékonyság: ${avgs.tr ? avgs.tr.avg.toFixed(2) : 'N/A'} (szórás: ${avgs.tr ? avgs.tr.std.toFixed(2) : 'N/A'})
- Értékek & Kultúra Illeszkedés: ${avgs.vc ? avgs.vc.avg.toFixed(2) : 'N/A'} (szórás: ${avgs.vc ? avgs.vc.std.toFixed(2) : 'N/A'})
- Kommunikáció & Konfliktuskezelés: ${avgs.cc ? avgs.cc.avg.toFixed(2) : 'N/A'} (szórás: ${avgs.cc ? avgs.cc.std.toFixed(2) : 'N/A'})
- Erősségek & Fejlődési Fókusz: ${avgs.sg ? avgs.sg.avg.toFixed(2) : 'N/A'} (szórás: ${avgs.sg ? avgs.sg.std.toFixed(2) : 'N/A'})

Nyílt válaszok (dimenzióként csoportosítva):
${openAnswers || 'Nem érkeztek nyílt válaszok.'}

Kérlek adj:
1. Minden dimenzióhoz egy coaching szempontú bekezdést (mit látsz, mi a mintázat, mi a tét)
2. Top 3 javasolt fókusztéma a coaching folyamathoz (prioritás sorrendben, indoklással)
3. Egy mondat: mi az a dolog, amit MOST kellene megszólítani ebben a csapatban?`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || response.statusText);
    }

    const data = await response.json();
    const text = data.content[0].text;

    document.getElementById('insightsArea').style.display = 'block';
    document.getElementById('insightsContent').innerHTML = formatInsights(text);

  } catch (err) {
    alert('Hiba az AI elemzésnél: ' + err.message);
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ Insights újragenerálása';
  }
}

function formatInsights(text) {
  // Convert markdown-ish text to HTML
  return text
    .split('\n')
    .map(line => {
      if (/^#{1,3}\s/.test(line)) {
        return `<h3>${line.replace(/^#+\s/, '')}</h3>`;
      }
      if (/^\d+\.\s/.test(line)) {
        return `<p><strong>${line}</strong></p>`;
      }
      if (line.trim() === '') return '<br>';
      return `<p>${line}</p>`;
    })
    .join('');
}

// ─── Stats helpers ────────────────────────────────────────
function computeAverages() {
  const result = {};
  if (currentResponses.length === 0) return result;

  DIM_KEYS.forEach(k => {
    const allScores = [];
    currentResponses.forEach(r => {
      for (let i = 1; i <= 8; i++) {
        const val = r[`${k}_${i}`];
        if (val != null) allScores.push(val);
      }
    });
    if (allScores.length === 0) return;

    const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const variance = allScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / allScores.length;
    result[k] = {
      avg,
      std: Math.sqrt(variance),
      min: Math.min(...allScores),
      max: Math.max(...allScores)
    };
  });

  return result;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
}
