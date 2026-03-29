// report.js – Token-based report page (replaces admin dashboard)

const DIM_KEYS  = ['ps', 'tr', 'vc', 'cc', 'sg'];
const DIM_NAMES = {
  ps: 'Pszichológiai Biztonság',
  tr: 'Csapatszerepek & Hatékonyság',
  vc: 'Értékek & Kultúra Illeszkedés',
  cc: 'Kommunikáció & Konfliktuskezelés',
  sg: 'Erősségek & Fejlődési Fókusz'
};
const DIM_ICONS = { ps: '🛡️', tr: '⚙️', vc: '🌐', cc: '💬', sg: '🌱' };
const OPEN_QS = {
  ps: 'Van olyan helyzet, amikor nem merted volna kimondani, amit gondolsz?',
  tr: 'Milyen szerep hiányzik ebből a csapatból?',
  vc: 'Mi az az érték, amit hiányolsz ebből a csapatból?',
  cc: 'Van olyan kimondatlan feszültség, amiről kellene beszélni?',
  sg: 'Milyen területen szeretnél fejlődni a következő 6 hónapban?'
};

let team = null;
let members = [];
let responses = [];
let radarChart = null;

// ─── Init ─────────────────────────────────────────────
const token = new URLSearchParams(window.location.search).get('token');

window.addEventListener('DOMContentLoaded', async () => {
  if (!token) return showError();

  try {
    // Fetch team by token
    const { data: teamData, error: tErr } = await supabaseClient
      .from('teams').select('*').eq('token', token).single();
    if (tErr || !teamData) return showError();
    team = teamData;

    document.getElementById('topBarText').textContent = `Team Pulse · ${team.name}`;
    document.getElementById('teamNameHeader').textContent = team.name;

    // Fetch members
    const { data: mData } = await supabaseClient
      .from('team_members').select('*').eq('team_id', team.id).order('email');
    members = mData || [];

    // Check completion
    const allDone = members.length > 0 && members.every(m => m.completed);

    if (!allDone) {
      showPending();
    } else {
      // Fetch responses
      const { data: rData } = await supabaseClient
        .from('responses').select('*').eq('team_id', team.id).order('submitted_at');
      responses = rData || [];
      showReport();
    }
  } catch (err) {
    console.error(err);
    showError();
  }
});

function showError() {
  document.getElementById('errorScreen').style.display = 'block';
}

function showPending() {
  const done = members.filter(m => m.completed).length;
  const total = members.length;

  document.getElementById('pendingMsg').textContent =
    `${done} / ${total} csapattag töltötte ki a kérdőívet. Ha mindenki kész, automatikusan elküldjük a riportot.`;

  const list = document.getElementById('memberStatusList');
  list.innerHTML = members.map(m => `
    <div class="member-status">
      <div class="status-dot ${m.completed ? 'done' : 'waiting'}"></div>
      <span style="flex:1;color:var(--white-dim);">${m.name || m.email}</span>
      <span style="font-size:0.75rem;color:var(--muted);">
        ${m.completed ? '✓ Kitöltve' : 'Várakozás…'}
      </span>
    </div>
  `).join('');

  document.getElementById('pendingScreen').style.display = 'block';
}

function showReport() {
  document.getElementById('reportScreen').style.display = 'block';
  renderStats();
  renderRadar();
  renderDeepDive();

  // Show stored insights if available
  if (team.insights) {
    document.getElementById('insightsArea').style.display = 'block';
    document.getElementById('insightsContent').innerHTML = formatInsights(team.insights);
    document.getElementById('insightsBtn').innerHTML = '✨ Insights újragenerálása';
  }
}

// ─── Stats ────────────────────────────────────────────
function renderStats() {
  const n = responses.length;
  const avgs = computeAverages();
  const dimAvgs = DIM_KEYS.map(k => avgs[k]?.avg || 0).filter(v => v > 0);
  const overall = dimAvgs.length ? (dimAvgs.reduce((a, b) => a + b, 0) / dimAvgs.length).toFixed(2) : '—';
  const last = n > 0 ? fmtDate(responses[n - 1].submitted_at) : '—';

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
      <div class="stat-value" style="font-size:1.1rem;">${team.name}</div>
      <div class="stat-sub">&nbsp;</div>
    </div>
  `;

  const tbody = document.getElementById('membersBody');
  if (n === 0) {
    tbody.innerHTML = '<tr><td colspan="2" style="color:var(--muted);text-align:center;padding:20px;">Még nincs kitöltés.</td></tr>';
    return;
  }
  tbody.innerHTML = responses.map(r => `
    <tr>
      <td>${r.member_name}</td>
      <td style="color:var(--muted);font-size:0.75rem;">${fmtDate(r.submitted_at)}</td>
    </tr>
  `).join('');
}

// ─── Radar ────────────────────────────────────────────
function renderRadar() {
  const avgs = computeAverages();

  // Score bars
  const scoresList = document.getElementById('scoresList');
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

  // Radar chart
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
        label: team.name,
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
          ticks: { stepSize: 1, color: 'rgba(255,255,255,0.3)', backdropColor: 'transparent', font: { size: 9 } },
          grid: { color: 'rgba(255,255,255,0.07)' },
          angleLines: { color: 'rgba(255,255,255,0.07)' },
          pointLabels: { color: 'rgba(242,242,240,0.6)', font: { size: 11, family: 'Exo', weight: '600' } }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// ─── Deep dive ────────────────────────────────────────
function renderDeepDive() {
  const avgs = computeAverages();
  const container = document.getElementById('dimDeepDive');
  container.innerHTML = '';

  DIM_KEYS.forEach(k => {
    const stats = avgs[k];
    const opens = responses.filter(r => r[`${k}_open`]).map(r => ({ name: r.member_name, text: r[`${k}_open`] }));
    const scoreText = stats
      ? `Átlag <strong style="color:var(--yellow)">${stats.avg.toFixed(2)}</strong> &nbsp;·&nbsp; σ ${stats.std.toFixed(2)} &nbsp;·&nbsp; ${stats.min}–${stats.max}`
      : '<span style="color:var(--muted)">Nincs adat</span>';

    const acc = document.createElement('div');
    acc.className = 'dim-accordion';
    acc.innerHTML = `
      <div class="dim-accordion__header" onclick="toggleAccordion(this)">
        <div class="dim-accordion__title">
          ${DIM_ICONS[k]} <span>${DIM_NAMES[k]}</span>
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
              ${opens.map(a => `<li><span class="open-name">${a.name}</span>${a.text}</li>`).join('')}
            </ul>
          </div>
        ` : '<div style="color:var(--muted);font-size:0.82rem;margin-top:12px;">Nincs nyílt válasz ehhez a dimenzióhoz.</div>'}
      </div>
    `;
    container.appendChild(acc);
  });
}

function toggleAccordion(header) {
  const body = header.nextElementSibling;
  const chevron = header.querySelector('.chevron');
  const isOpen = body.classList.toggle('open');
  chevron.classList.toggle('open', isOpen);
  chevron.textContent = isOpen ? '▾' : '▸';
}

function buildHeatmap(dimKey) {
  if (!responses.length) return '<div style="color:var(--muted);font-size:0.82rem;">Nincs adat.</div>';

  const headerCells = Array.from({ length: 8 }, (_, i) => `<th>K${i + 1}</th>`).join('');
  const bodyRows = responses.map(r => {
    const cells = Array.from({ length: 8 }, (_, i) => {
      const val = r[`${dimKey}_${i + 1}`];
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

// ─── AI Insights ──────────────────────────────────────
async function regenerateInsights() {
  if (!responses.length) { alert('Nincs elegendő adat.'); return; }

  const btn = document.getElementById('insightsBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Claude elemez…';

  const avgs = computeAverages();
  const openText = DIM_KEYS.map(k => {
    const lines = responses.filter(r => r[`${k}_open`]).map(r => `  – ${r[`${k}_open`]}`).join('\n');
    return lines ? `${DIM_NAMES[k]}:\n${lines}` : null;
  }).filter(Boolean).join('\n\n');

  const payload = {
    teamName: team.name,
    n: responses.length,
    averages: Object.fromEntries(
      DIM_KEYS.map(k => [k, avgs[k] ? { avg: avgs[k].avg.toFixed(2), std: avgs[k].std.toFixed(2) } : null])
    ),
    openAnswers: openText || 'Nem érkeztek nyílt válaszok.'
  };

  try {
    const res = await fetch('/.netlify/functions/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('AI endpoint error');
    const data = await res.json();

    document.getElementById('insightsArea').style.display = 'block';
    document.getElementById('insightsContent').innerHTML = formatInsights(data.insights);
    document.getElementById('insightsArea').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Save insights to team
    await supabaseClient.from('teams').update({ insights: data.insights }).eq('id', team.id);

  } catch (err) {
    console.error(err);
    alert('AI hiba: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ Insights újragenerálása';
  }
}

function formatInsights(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// ─── Helpers ──────────────────────────────────────────
function computeAverages() {
  const result = {};
  if (!responses.length) return result;
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

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
}
