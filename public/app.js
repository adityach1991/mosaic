const SUBJECTS = {
  'English': [
    'Reading Comprehension (tone, inference, central idea, vocab)',
    'Literary/Narrative passages',
    'Opinion/Editorial style passages',
    'Rhetoric & style analysis (irony, satire, metaphor, allusion)',
    'Cross-cultural narratives & comparative themes',
    'Science communication op-eds (risk, uncertainty, ethics)',
    'Economic policy editorials (growth vs equity, welfare tradeoffs)',
    'Environmental policy (climate, biodiversity, energy justice)',
    'Technology & society (AI, privacy, platforms, misinformation)',
    'Constitutional themes in literature (liberty, equality, fraternity)',
    'Authorial stance, bias, and subtle framing cues',
  ],
  'Current Affairs & GK': [
    'International Relations & Conflicts',
    'Indian Economy & Surveys',
    'Union Budget & Fiscal Policy',
    'International Organisations & Summits (UN, G20, BRICS, SCO)',
    'Indian Polity & Institutions (ECI, CAG, NITI Aayog, RBI)',
    'Recent Supreme Court Judgments & Constitutional Developments',
    'Space & Science (ISRO missions, Nobel/awards, breakthroughs)',
    'Energy Transition & Climate Commitments (renewables, net zero)',
    'Foreign Trade & FTAs (RCEP, IPEF, export policy)',
    'Public Health Policy (programs, vaccination, AMR)',
    'Data Protection & Privacy (DPDP Act, surveillance, platforms)',
    'Sports Governance & Major Events',
    'Indices & Rankings (HDI, EoDB, GHI) and issuing bodies',
    'Awards, Appointments & Obituaries (global & national)'
  ],
  'Legal Reasoning': [
    'Legal Doctrines (Mens rea, Res Ipsa, Volenti, Estoppel)',
    'Constitutional Law (FRs, Basic Structure, Free Speech, Privacy)',
    'Criminal Law (culpable homicide vs murder, defenses, attempt)',
    'Tort Law (negligence, strict/absolute liability, nuisance)',
    'Contract Law (consideration, privity, frustration, misrepresentation)',
    'Evidence (confessions, circumstantial evidence, burden & standards)',
    'Administrative Law (natural justice, legitimate expectation)',
    'Data Protection & Tech Law (DPDP Act, intermediaries, consent)',
    'Environmental Law (polluter pays, precautionary, public trust)',
    'IPR (copyright, fair dealing, patents—non-obviousness)',
    'Landmark Cases (Kesavananda, Puttaswamy, Shreya Singhal)'
  ],
  'Logical Reasoning': [
    'Constitutional & Philosophical debates (free speech, privacy vs surveillance, populism)',
    'Public Policy dilemmas',
    'Ethical dilemmas',
    'Causal reasoning & alternative explanations',
    'Assumptions (necessary vs sufficient) & negation test',
    'Strengthen/Weaken with data and edge cases',
    'Flaw identification & method of reasoning',
    'Parallel reasoning & principle matching',
    'Paradox resolution & plan critique'
  ],
  'Quantitative Techniques': [
    'Data Interpretation (Tables, Graphs, Pie charts, Surveys)',
    'Multi-series time trends (YoY, QoQ, CAGR)',
    'Percentages, Ratios, Weighted Averages',
    'Profit/Loss with taxes & discounts',
    'Simple vs Compound Interest comparisons',
    'Speed-Time-Distance & relative motion',
    'Work-Time/Pipes & cisterns (combined rates)',
    'Mixtures & alligation; dilution problems',
    'Venn diagrams (2-set/3-set counts)',
    'Median/Mode (grouped data), estimation & rounding traps'
  ],
};

const subjectEl = document.getElementById('subject');
const subtopicEl = document.getElementById('subtopic');
const customTopicEl = document.getElementById('customTopic');
const articleUrlEl = document.getElementById('articleUrl');
const toneRow = document.getElementById('toneRow');
const toneEl = document.getElementById('tone');
const sheetEl = document.getElementById('sheet');
const countEl = document.getElementById('count');
const genBtn = document.getElementById('generateBtn');
const exportBtn = document.getElementById('exportBtn');
const passageEl = document.getElementById('passage');
const questionsEl = document.getElementById('questions');

let currentPayload = null;
let isExporting = false;

// Prefill default Google Sheet URL if empty (user can change it)
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/19BRy-4V0UhqHWrZIEiOqLC-xxKcMi_x9p7z4nXqKM_Q/edit?gid=0';
if (!sheetEl.value || !sheetEl.value.trim()) {
  sheetEl.value = DEFAULT_SHEET_URL;
}

function fillSubtopics() {
  const subj = subjectEl.value;
  const items = SUBJECTS[subj] || [];
  subtopicEl.innerHTML = '';
  for (const s of items) {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    subtopicEl.appendChild(opt);
  }
  toneRow.style.display = subj === 'English' ? 'flex' : 'none';
}

subjectEl.addEventListener('change', fillSubtopics);
fillSubtopics();

genBtn.addEventListener('click', async () => {
  genBtn.disabled = true; exportBtn.disabled = true;
  questionsEl.innerHTML = '';
  passageEl.value = '';
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: subjectEl.value,
        subtopic: subtopicEl.value,
        customTopic: (customTopicEl?.value || '').trim() || undefined,
        articleUrl: (articleUrlEl?.value || '').trim() || undefined,
        questionsPerPassage: Number(countEl.value) || 10,
        tone: toneEl.value || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Generation failed');
    currentPayload = normalizePayload(data);
    renderPayload(currentPayload);
    exportBtn.disabled = false;
  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    genBtn.disabled = false;
  }
});

exportBtn.addEventListener('click', async () => {
  if (isExporting) return;
  if (!currentPayload) return;
  const sheetUrlOrId = sheetEl.value.trim();
  if (!sheetUrlOrId) { alert('Please paste Google Sheet link'); return; }
  // sync UI -> payload
  currentPayload.passage = passageEl.value.trim();
  const qs = readQuestionsFromUI();
  if (!Array.isArray(qs) || qs.length === 0) {
    alert('Please add at least one question before exporting.');
    return;
  }
  // filter out empty questions defensively
  const filtered = qs.filter(q => String(q.question || '').trim().length > 0);
  if (filtered.length === 0) {
    alert('All questions are empty. Please fill them before exporting.');
    return;
  }
  currentPayload.questions = filtered;

  exportBtn.disabled = true;
  isExporting = true;
  try {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrlOrId, payload: currentPayload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Export failed');
    alert('Exported to Google Sheets successfully!');
  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    exportBtn.disabled = false;
    isExporting = false;
  }
});

function normalizePayload(data) {
  return {
    passage: String(data.passage || ''),
    questions: (Array.isArray(data.questions) ? data.questions : []).map(q => ({
      question: String(q.question || ''),
      options: (Array.isArray(q.options) ? q.options : []).slice(0,4).map(x => String(x)),
      correct_index: Number.isInteger(q.correct_index) ? q.correct_index : 0,
      explanation: String(q.explanation || ''),
    })),
  };
}

function renderPayload(payload) {
  passageEl.value = payload.passage || '';
  questionsEl.innerHTML = '';
  payload.questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'qcard';
    card.dataset.index = String(idx);
    card.innerHTML = `
      <div class="qhead">
        <div>Question ${idx + 1}</div>
        <div class="actions">
          <button class="btn-secondary removeBtn" title="Remove this question">Remove</button>
        </div>
      </div>
      <textarea class="qtext" rows="5">${escapeHtml(q.question)}</textarea>
      <div class="opts"></div>
      <div>
        <label class="muted">Explanation</label>
        <textarea class="qexp" rows="4">${escapeHtml(q.explanation || '')}</textarea>
      </div>
    `;
    const opts = card.querySelector('.opts');
    for (let i=0;i<4;i++) {
      const row = document.createElement('div');
      row.className = 'opt';
      row.innerHTML = `
        <input type="radio" name="correct-${idx}" ${i===q.correct_index?'checked':''} />
        <input class="qopt" value="${escapeHtml(q.options[i] || '')}" />
      `;
      opts.appendChild(row);
    }
    questionsEl.appendChild(card);

    // Remove handler
    const removeBtn = card.querySelector('.removeBtn');
    removeBtn.addEventListener('click', () => {
      card.remove();
      // re-number remaining cards' headers
      Array.from(document.querySelectorAll('.qcard')).forEach((c, i) => {
        c.querySelector('.qhead > div').textContent = `Question ${i + 1}`;
      });
    });
  });
}

function readQuestionsFromUI() {
  const cards = Array.from(document.querySelectorAll('.qcard'));
  return cards.map((card, idx) => {
    const question = card.querySelector('.qtext').value.trim();
    const opts = Array.from(card.querySelectorAll('.qopt')).map(i => i.value.trim());
    // Find which radio is checked within this card (independent of name)
    const radios = Array.from(card.querySelectorAll('input[type=radio]'));
    let ri = radios.findIndex(r => r.checked);
    const correct_index = (ri >= 0 && ri < 4) ? ri : 0;
    const explanation = card.querySelector('.qexp').value.trim();
    return { question, options: opts, correct_index, explanation };
  });
}

function escapeHtml(s) {
  return (s || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}
