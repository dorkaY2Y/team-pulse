// survey.js – Survey logic, Supabase write

const DIMENSIONS = [
  {
    key: 'ps',
    title: 'Dimenzió 1: Pszichológiai Biztonság',
    subtitle: 'Tudományos alap: Amy Edmondson, Harvard Business School',
    questions: [
      'Ebben a csapatban biztonságosan vállalhatok kockázatot anélkül, hogy azt félnék, negatív következményei lesznek.',
      'Ha hibázok ebben a csapatban, azt nem tartják ellenem.',
      'A csapat tagjai képesek nehéz, kényes témákat is felvetni.',
      'Könnyen kérhetek segítséget a csapatom többi tagjától.',
      'Senki sem utasítana vissza vagy büntetne meg azért, mert merészen véleményt nyilvánítok.',
      'A csapatban értéknek számít az eltérő nézőpont.',
      'Nyugodtan kifejezem a valódi véleményemet, még ha az szemben áll a többségével.',
      'Ha problémát látok, biztos vagyok benne, hogy érdemes szólni róla.'
    ],
    openQuestion: 'Van olyan helyzet, amelyben nem merted volna kimondani, amit gondolsz? Mi tartott vissza?'
  },
  {
    key: 'tr',
    title: 'Dimenzió 2: Csapatszerepek & Hatékonyság',
    subtitle: 'Tudományos alap: J. Richard Hackman, team effectiveness model',
    questions: [
      'Mindenki tisztában van azzal, hogy mi az ő szerepe és felelőssége a csapatban.',
      'A csapatban az erősségek és a feladatok összhangban vannak.',
      'Ha valaki túlterhelt, a csapat automatikusan segít neki.',
      'A csapatnak van közös célja, amellyel mindenki azonosul.',
      'A döntéshozatal folyamata átlátható és igazságos a csapatban.',
      'A csapat képes megújulni és alkalmazkodni, ha megváltoznak a körülmények.',
      'Az én hozzájárulásom valóban számít a csapat eredményeiben.',
      'A csapat eredményeivel kapcsolatban mindenki egyforma felelősséget érez.'
    ],
    openQuestion: 'Milyen szerep hiányzik szerinted ebből a csapatból – akár emberi, akár funkcionális értelemben?'
  },
  {
    key: 'vc',
    title: 'Dimenzió 3: Értékek & Kultúra Illeszkedés',
    subtitle: 'Tudományos alap: Shalom Schwartz, Basic Human Values Theory',
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
    title: 'Dimenzió 4: Kommunikáció & Konfliktuskezelés',
    subtitle: 'Tudományos alap: Thomas-Kilmann Conflict Mode Instrument',
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
    title: 'Dimenzió 5: Erősségek & Fejlődési Fókusz',
    subtitle: 'Tudományos alap: VIA Institute on Character / Strengths-based development',
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

// State
let currentDim = 0;
let memberName = '';
let teamId = '';
let answers = {}; // { ps: { q1: 3, q2: 5, ..., open: '...' }, ... }

// Parse URL params
const params = new URLSearchParams(window.location.search);
teamId = params.get('team') || '';
const memberFromUrl = params.get('member') || '';

// Pre-fill member name if in URL
window.addEventListener('DOMContentLoaded', () => {
  if (memberFromUrl) {
    document.getElementById('memberNameInput').value = memberFromUrl;
  }
  // Load team name
  if (teamId) loadTeamName();
});

async function loadTeamName() {
  try {
    const { data } = await supabaseClient
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .single();
    if (data) {
      document.getElementById('teamNameDisplay').textContent = data.name;
    }
  } catch (e) {
    // silently ignore
  }
}

function startSurvey() {
  memberName = document.getElementById('memberNameInput').value.trim();
  if (!memberName) {
    alert('Kérlek add meg a nevedet a folytatáshoz!');
    return;
  }
  if (!teamId) {
    alert('Érvénytelen link – hiányzik a csapat azonosítója.');
    return;
  }
  document.getElementById('screen-welcome').style.display = 'none';
  document.getElementById('screen-survey').style.display = 'block';
  renderDimension(0);
}

function renderDimension(dimIndex) {
  const dim = DIMENSIONS[dimIndex];
  const savedAnswers = answers[dim.key] || {};
  currentDim = dimIndex;

  // Progress
  document.getElementById('progressLabel').textContent = `${dimIndex + 1}/5 dimenzió – ${dim.title.split(': ')[1]}`;
  document.getElementById('progressFill').style.width = `${((dimIndex + 1) / 5) * 100}%`;

  // Back/Next buttons
  document.getElementById('btnBack').disabled = dimIndex === 0;
  document.getElementById('btnNext').textContent = dimIndex === 4 ? 'Beküldés ✓' : 'Következő →';

  // Render questions
  const container = document.getElementById('dimensionContainer');
  container.innerHTML = '';
  container.classList.remove('fade-in');
  void container.offsetWidth; // reflow to restart animation
  container.classList.add('fade-in');

  const card = document.createElement('div');
  card.className = 'survey-card';
  card.innerHTML = `
    <h2>${dim.title}</h2>
    <div class="dim-subtitle">${dim.subtitle}</div>
    <div class="questions-list"></div>
    <div class="open-question-wrap">
      <div class="open-question-label">💬 ${dim.openQuestion}</div>
      <textarea id="open_${dim.key}" placeholder="Opcionális – oszd meg gondolataidat…" rows="3">${savedAnswers.open || ''}</textarea>
    </div>
  `;

  const qList = card.querySelector('.questions-list');
  dim.questions.forEach((qText, i) => {
    const qNum = i + 1;
    const fieldKey = `q${qNum}`;
    const selected = savedAnswers[fieldKey] || null;

    const item = document.createElement('div');
    item.className = 'question-item';
    item.innerHTML = `
      <div class="question-text"><strong>${qNum}.</strong> ${qText}</div>
      <div class="likert-wrap">
        <div class="likert-labels">
          <span>Egyáltalán nem jellemző</span>
          <span>Teljes mértékben jellemző</span>
        </div>
        <div class="likert-buttons" id="likert_${dim.key}_${qNum}">
          ${[1,2,3,4,5,6,7].map(v => `
            <button class="likert-btn ${selected === v ? 'selected' : ''}"
              data-dim="${dim.key}" data-q="${qNum}" data-val="${v}"
              onclick="selectAnswer('${dim.key}', ${qNum}, ${v})">
              ${v}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    qList.appendChild(item);
  });

  container.appendChild(card);
}

function selectAnswer(dimKey, qNum, val) {
  if (!answers[dimKey]) answers[dimKey] = {};
  answers[dimKey][`q${qNum}`] = val;

  // Update UI
  const buttons = document.querySelectorAll(`#likert_${dimKey}_${qNum} .likert-btn`);
  buttons.forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.val) === val);
  });
}

function saveOpenAnswer() {
  const dim = DIMENSIONS[currentDim];
  if (!answers[dim.key]) answers[dim.key] = {};
  const textarea = document.getElementById(`open_${dim.key}`);
  if (textarea) answers[dim.key].open = textarea.value.trim();
}

function validateCurrentDimension() {
  const dim = DIMENSIONS[currentDim];
  const saved = answers[dim.key] || {};
  const missing = [];
  dim.questions.forEach((_, i) => {
    if (!saved[`q${i+1}`]) missing.push(i + 1);
  });
  if (missing.length > 0) {
    alert(`Kérlek válaszolj az összes kérdésre! (Hiányzó: ${missing.join(', ')}. kérdés)`);
    return false;
  }
  return true;
}

function goNext() {
  saveOpenAnswer();
  if (!validateCurrentDimension()) return;

  if (currentDim < DIMENSIONS.length - 1) {
    renderDimension(currentDim + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    submitSurvey();
  }
}

function goPrev() {
  saveOpenAnswer();
  if (currentDim > 0) {
    renderDimension(currentDim - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

async function submitSurvey() {
  document.getElementById('screen-survey').style.display = 'none';
  document.getElementById('screen-submitting').style.display = 'block';

  // Build the record
  const record = {
    team_id: teamId,
    member_name: memberName
  };

  DIMENSIONS.forEach(dim => {
    const saved = answers[dim.key] || {};
    dim.questions.forEach((_, i) => {
      record[`${dim.key}_${i+1}`] = saved[`q${i+1}`] || null;
    });
    record[`${dim.key}_open`] = saved.open || null;
  });

  try {
    const { error } = await supabaseClient.from('responses').insert([record]);
    if (error) throw error;
    window.location.href = '../thank-you.html';
  } catch (err) {
    console.error(err);
    document.getElementById('screen-submitting').innerHTML = `
      <p style="color:#e55;text-align:center;padding:40px;">
        Hiba történt a beküldés során: ${err.message}<br><br>
        <button class="btn btn--outline" onclick="location.reload()" style="color:#555;border-color:#ddd;">Újrapróbálás</button>
      </p>
    `;
  }
}
