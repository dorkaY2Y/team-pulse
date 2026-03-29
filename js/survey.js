// survey.js – Token-based survey flow
// Member opens survey.html?token=MEMBER_TOKEN → fills out → submits to Netlify function

const DIMENSIONS = [
  {
    key: 'ps',
    icon: '🛡️',
    title: 'Pszichológiai Biztonság',
    subtitle: 'Amy Edmondson · Harvard Business School',
    questions: [
      'Ebben a csapatban biztonságosan vállalhatok kockázatot anélkül, hogy negatív következményektől félnék.',
      'Ha hibázok ebben a csapatban, azt nem tartják ellenem.',
      'A csapat tagjai képesek nehéz, kényes témákat is felvetni.',
      'Könnyen kérhetek segítséget a csapatom többi tagjától.',
      'Nem ér hátrány azért, mert bátran véleményt nyilvánítok.',
      'A csapatban értéknek számít az eltérő nézőpont.',
      'Nyugodtan kifejezem a valódi véleményemet, még ha az szemben áll a többségével.',
      'Ha problémát látok, biztos vagyok benne, hogy érdemes szólni róla.'
    ],
    openQuestion: 'Van olyan helyzet, amikor nem merted volna kimondani, amit gondolsz? Mi tartott vissza?'
  },
  {
    key: 'tr',
    icon: '⚙️',
    title: 'Csapatszerepek & Hatékonyság',
    subtitle: 'J. Richard Hackman · Team Effectiveness Model',
    questions: [
      'Mindenki tisztában van azzal, hogy mi az ő szerepe és felelőssége a csapatban.',
      'A csapatban az erősségek és a feladatok összhangban vannak.',
      'Ha valaki túlterhelt, a csapat magától segít neki.',
      'A csapatnak van közös célja, amellyel mindenki azonosul.',
      'A döntéshozatal folyamata átlátható és igazságos a csapatban.',
      'A csapat képes megújulni és alkalmazkodni, ha megváltoznak a körülmények.',
      'Az én hozzájárulásom valóban számít a csapat eredményeiben.',
      'A csapat eredményeivel kapcsolatban mindenki egyforma felelősséget érez.'
    ],
    openQuestion: 'Milyen szerep hiányzik szerinted ebből a csapatból – akár informális, akár funkcionális értelemben?'
  },
  {
    key: 'vc',
    icon: '🌐',
    title: 'Értékek & Kultúra Illeszkedés',
    subtitle: 'Shalom Schwartz · Basic Human Values Theory',
    questions: [
      'A csapat által képviselt értékek egybeesnek a saját személyes értékeimmel.',
      'Azt érzem, hogy „én is ilyen vagyok, mint ez a csapat."',
      'A csapatban az együttműködést előnyben részesítik az egyéni versennyel szemben.',
      'A teljesítmény mellett az emberek jólléte is fontos értéknek számít ebben a csapatban.',
      'Az innováció és az új ötletek befogadása valóban értékelt dolog itt.',
      'A csapatban az igazságosság és az egyenlő bánásmód érvényesül.',
      'Azt érzem, hogy ugyanazért dolgozunk – nem csak a saját céljainkért.',
      'A csapat kultúrája olyan viselkedést erősít, amire büszke vagyok.'
    ],
    openQuestion: 'Mi az az érték, amit hiányolsz ebből a csapatból?'
  },
  {
    key: 'cc',
    icon: '💬',
    title: 'Kommunikáció & Konfliktuskezelés',
    subtitle: 'Thomas-Kilmann Conflict Mode Instrument',
    questions: [
      'A csapatban a konfliktusok nyíltan és konstruktívan kerülnek felszínre.',
      'Véleménykülönbség esetén képesek vagyunk kompromisszumot találni anélkül, hogy valaki veszítene.',
      'A visszajelzés kultúrája valódi és nem csak forma.',
      'Ha valakinek problémája van egy másikkal, közvetlenül szólnak egymásnak – nem kerülőúton.',
      'A csapatban a nehéz üzenetek is átadhatók tiszteletteljesen.',
      'Az érzelmi feszültség nem marad sokáig a felszín alatt – kezeljük.',
      'Mindenki hangja egyformán számít a megbeszéléseken.',
      'A kommunikációs stílusok közötti különbségek nem okoznak félreértéseket.'
    ],
    openQuestion: 'Van olyan kimondatlan feszültség a csapatban, amiről szerinted kellene beszélni?'
  },
  {
    key: 'sg',
    icon: '🌱',
    title: 'Erősségek & Fejlődési Fókusz',
    subtitle: 'VIA Institute on Character · Strengths-based Development',
    questions: [
      'Tudom, melyek az erősségeim, és ezeket rendszeresen használhatom a munkámban.',
      'A csapatban az erősségekre építünk, nem a hibák kijavítására fókuszálunk.',
      'Lehetőségem van fejlődni és tanulni ebben a csapatban.',
      'Azt érzem, hogy a munkámban „élek" – nem csak teljesítek.',
      'A csapat tagjai ismerik egymás erősségeit és támaszkodnak rájuk.',
      'A fejlődési lehetőségek igazságosan oszlanak el a csapatban.',
      'Az itt töltött idő hosszú távon is értékes a szakmai fejlődésem szempontjából.',
      'A csapatban bátorítják az egyéni ambíciót és a növekedési vágyat.'
    ],
    openQuestion: 'Milyen területen szeretnél leginkább fejlődni a következő 6 hónapban – és mit tehet ezért a csapat?'
  }
];

// ─── State ────────────────────────────────────────────
let currentDim = 0;
let memberName = '';
let memberToken = '';
let teamName = '';
let answers = {};
let memberEmail = '';

// ─── URL params ───────────────────────────────────────
const params = new URLSearchParams(window.location.search);
memberToken = params.get('token') || '';

window.addEventListener('DOMContentLoaded', async () => {
  if (!memberToken) {
    showInvalidLink();
    return;
  }

  try {
    // Fetch member info by token
    const { data: member, error } = await supabaseClient
      .from('team_members')
      .select('*, teams(*)')
      .eq('token', memberToken)
      .single();

    if (error || !member) {
      showInvalidLink();
      return;
    }

    if (member.completed) {
      showAlreadyCompleted();
      return;
    }

    teamName = member.teams?.name || '';
    memberEmail = member.email || '';
    memberName = memberEmail;
    const el = document.getElementById('headerTeamName');
    const bar = document.getElementById('teamNameBar');
    if (el) el.textContent = teamName;
    if (bar) bar.textContent = `Team Pulse · ${teamName}`;

  } catch (e) {
    console.error(e);
    showInvalidLink();
  }
});

function showInvalidLink() {
  document.querySelector('.welcome-card__body').innerHTML =
    '<strong style="color:#e55;">Érvénytelen link.</strong><br>Kérd el a csapatvezetődtől a helyes kitöltési linket.';
  const btn = document.querySelector('.welcome-card .btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; }
}

function showAlreadyCompleted() {
  document.querySelector('.welcome-card__body').innerHTML =
    '<strong style="color:#50d090;">Ezt a kérdőívet már kitöltötted.</strong><br>Köszönjük a válaszaidat! A csapatvezetőd megkapja a riportot, ha mindenki kitöltötte.';
  const btn = document.querySelector('.welcome-card .btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; }
  const nameInput = document.getElementById('memberNameInput');
  if (nameInput) nameInput.parentElement.style.display = 'none';
}

// ─── Start ────────────────────────────────────────────
function startSurvey() {
  if (!memberToken) {
    alert('Érvénytelen link – hiányzik a token.');
    return;
  }
  document.getElementById('screen-welcome').style.display = 'none';
  document.getElementById('screen-survey').style.display = 'block';
  renderDimension(0);
}

// ─── Render dimension ─────────────────────────────────
function renderDimension(dimIndex) {
  const dim = DIMENSIONS[dimIndex];
  const saved = answers[dim.key] || {};
  currentDim = dimIndex;

  const pct = Math.round(((dimIndex + 1) / DIMENSIONS.length) * 100);
  document.getElementById('progressLabel').textContent = `Dimenzió ${dimIndex + 1} / ${DIMENSIONS.length}`;
  document.getElementById('progressFill').style.width = pct + '%';

  document.getElementById('btnBack').disabled = dimIndex === 0;
  document.getElementById('btnNext').textContent =
    dimIndex === DIMENSIONS.length - 1 ? '✓ Beküldés' : 'Következő →';

  const container = document.getElementById('dimensionContainer');
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'survey-card fade-up';

  const hdr = document.createElement('div');
  hdr.className = 'dim-header';
  hdr.innerHTML = `
    <div class="dim-icon-big">${dim.icon}</div>
    <div class="dim-header-text">
      <h2>${dim.title}</h2>
      <div class="sub">${dim.subtitle}</div>
    </div>
  `;
  card.appendChild(hdr);

  dim.questions.forEach((qText, i) => {
    const qNum = i + 1;
    const key = `q${qNum}`;
    const selected = saved[key] || null;

    const block = document.createElement('div');
    block.className = 'question-block';
    block.innerHTML = `
      <div class="question-text">
        <span class="q-num">${qNum}</span>${qText}
      </div>
      <div class="likert-outer">
        <div class="likert-scale" id="likert_${dim.key}_${qNum}">
          ${[1,2,3,4,5,6,7].map(v => `
            <button
              class="likert-btn${selected === v ? ' selected' : ''}"
              data-dim="${dim.key}" data-q="${qNum}" data-val="${v}"
              onclick="selectAnswer('${dim.key}',${qNum},${v})"
              type="button">${v}</button>
          `).join('')}
        </div>
        <div class="likert-ends">
          <span>Egyáltalán nem jellemző</span>
          <span>Teljes mértékben jellemző</span>
        </div>
      </div>
    `;
    card.appendChild(block);
  });

  const openBlock = document.createElement('div');
  openBlock.className = 'open-block';
  openBlock.innerHTML = `
    <div class="open-label">${dim.openQuestion}</div>
    <textarea id="open_${dim.key}" placeholder="Opcionális – oszd meg gondolataidat…" rows="3">${saved.open || ''}</textarea>
  `;
  card.appendChild(openBlock);

  container.appendChild(card);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Answer selection ─────────────────────────────────
function selectAnswer(dimKey, qNum, val) {
  if (!answers[dimKey]) answers[dimKey] = {};
  answers[dimKey][`q${qNum}`] = val;

  const btns = document.querySelectorAll(`#likert_${dimKey}_${qNum} .likert-btn`);
  btns.forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.val) === val);
  });
}

function saveOpenAnswer() {
  const dim = DIMENSIONS[currentDim];
  if (!answers[dim.key]) answers[dim.key] = {};
  const ta = document.getElementById(`open_${dim.key}`);
  if (ta) answers[dim.key].open = ta.value.trim();
}

// ─── Validation ───────────────────────────────────────
function validateCurrentDimension() {
  const dim = DIMENSIONS[currentDim];
  const saved = answers[dim.key] || {};
  const missing = dim.questions.map((_, i) => i + 1).filter(n => !saved[`q${n}`]);

  if (missing.length > 0) {
    const firstMissing = document.getElementById(`likert_${dim.key}_${missing[0]}`);
    if (firstMissing) {
      firstMissing.animate(
        [{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],
        {duration:300}
      );
      firstMissing.scrollIntoView({behavior:'smooth', block:'center'});
    }
    return false;
  }
  return true;
}

// ─── Navigation ───────────────────────────────────────
function goNext() {
  saveOpenAnswer();
  if (!validateCurrentDimension()) return;

  if (currentDim < DIMENSIONS.length - 1) {
    renderDimension(currentDim + 1);
  } else {
    submitSurvey();
  }
}

function goPrev() {
  saveOpenAnswer();
  if (currentDim > 0) renderDimension(currentDim - 1);
}

// ─── Submit via Netlify function ──────────────────────
async function submitSurvey() {
  document.getElementById('screen-survey').style.display = 'none';
  document.getElementById('screen-submitting').style.display = 'block';

  try {
    const res = await fetch('/.netlify/functions/submit-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberToken,
        memberName,
        answers
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Hiba a beküldésnél.');

    window.location.href = 'thank-you.html';

  } catch (err) {
    console.error(err);
    document.getElementById('screen-submitting').innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <div style="font-size:2rem;margin-bottom:16px;">⚠️</div>
        <div style="font-family:'Exo',sans-serif;font-weight:700;font-size:1.1rem;color:#111;margin-bottom:8px;">
          Hiba a beküldésnél
        </div>
        <div style="color:#888;font-size:0.85rem;margin-bottom:24px;">${err.message}</div>
        <button class="btn" style="background:var(--yellow);color:#111;font-family:'Exo',sans-serif;font-weight:700;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;"
          onclick="location.reload()">Újrapróbálás</button>
      </div>
    `;
  }
}
