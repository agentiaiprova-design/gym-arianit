// app.js — Arianit Ajdini

const STORAGE_KEY = 'gym_sessions_arianit_v1';

let activeSession = null;
let timerInterval = null;
let timerRemaining = 0;

// ── Storage ───────────────────────────────────────────────────────────────────

function getSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveSessions(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function initStorage() { if (!localStorage.getItem(STORAGE_KEY)) saveSessions(HISTORICAL_SESSIONS); }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d) { const [,m,dd] = d.split('-'); return `${dd}/${m}`; }

function fmtRest(sec) {
  if (!sec) return '';
  const m = Math.floor(sec / 60), s = sec % 60;
  return s ? `${m}'${s}"` : `${m}'`;
}

function fmtTimer(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtSets(sets) {
  if (!sets?.length) return '—';
  const groups = [];
  sets.forEach(s => {
    const label = s.weight != null && s.reps != null ? `${s.weight}×${s.reps}`
                : s.reps  != null                   ? `pc×${s.reps}`
                : s.duration || '✓';
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.count++;
    else groups.push({ label, count: 1 });
  });
  return groups.map(g => g.count > 1 ? `${g.label} ×${g.count}` : g.label).join(', ');
}

function getTarget(ex) {
  return {
    label: `${ex.sets}×${ex.reps}`,
    rest: ex.rest ? fmtRest(ex.rest) : null,
    nSets: ex.sets,
    restSec: ex.rest || 60,
  };
}

function getHistory(exId, workout, limit = 3) {
  return getSessions()
    .filter(s => s.workout === workout && s.exercises?.[exId])
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

function lastSessionOf(workout) {
  return getSessions()
    .filter(s => s.workout === workout)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}

// ── Audio beep ────────────────────────────────────────────────────────────────

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.3);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.3);
    });
  } catch(e) {}
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function startTimer(restSec) {
  stopTimer();
  timerRemaining = restSec;
  updateTimerDisplay();
  showTimer();
  timerInterval = setInterval(() => {
    timerRemaining--;
    updateTimerDisplay();
    if (timerRemaining <= 0) {
      stopTimer();
      playBeep();
      if (navigator.vibrate) navigator.vibrate([150, 80, 150, 80, 300]);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function skipTimer() { stopTimer(); hideTimer(); timerRemaining = 0; }

function updateTimerDisplay() {
  const numEl = document.getElementById('timer-num');
  const bar   = document.getElementById('timer-bar');
  if (numEl) numEl.textContent = fmtTimer(timerRemaining);
  if (bar)   bar.classList.toggle('urgent', timerRemaining > 0 && timerRemaining <= 10);
  if (timerRemaining <= 0) hideTimer();
}

function showTimer() { document.getElementById('timer-bar')?.classList.remove('hidden'); }
function hideTimer() {
  const bar = document.getElementById('timer-bar');
  if (bar) { bar.classList.add('hidden'); bar.classList.remove('urgent'); }
}

// ── Set toggle ────────────────────────────────────────────────────────────────

function toggleSet(exId, setIdx) {
  const row  = document.getElementById(`sr-${exId}-${setIdx}`);
  const chk  = document.getElementById(`chk-${exId}-${setIdx}`);
  const kgEl = document.getElementById(`kg-${exId}-${setIdx}`);
  const rpEl = document.getElementById(`rp-${exId}-${setIdx}`);
  if (!row) return;

  const wasDone = row.classList.contains('set-done');

  if (!wasDone) {
    const kg   = kgEl?.value !== '' ? parseFloat(kgEl.value) : null;
    const reps = rpEl?.value !== '' ? parseInt(rpEl.value)   : null;
    row.classList.add('set-done');
    if (kgEl) kgEl.readOnly = true;
    if (rpEl) rpEl.readOnly = true;
    if (chk)  chk.classList.add('checked');

    if (!activeSession.exercises[exId]) activeSession.exercises[exId] = [];
    activeSession.exercises[exId][setIdx] = { weight: kg, reps };

    const ex  = Object.values(WORKOUTS).flat().find(e => e.id === exId);
    const tgt = getTarget(ex);
    startTimer(tgt.restSec);

    const nextKg = document.getElementById(`kg-${exId}-${setIdx + 1}`);
    if (nextKg) setTimeout(() => {
      nextKg.focus();
      nextKg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  } else {
    row.classList.remove('set-done');
    if (kgEl) kgEl.readOnly = false;
    if (rpEl) rpEl.readOnly = false;
    if (chk)  chk.classList.remove('checked');
    if (activeSession?.exercises?.[exId]) activeSession.exercises[exId][setIdx] = null;
  }
}

// ── 1RM + Charts ──────────────────────────────────────────────────────────────

function est1RM(weight, reps) {
  if (!weight || !reps || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function getChartData(exId, workout) {
  return getSessions()
    .filter(s => s.workout === workout && s.exercises?.[exId])
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(s => {
      const sets = s.exercises[exId].filter(x => x?.weight != null && x?.reps > 0);
      if (!sets.length) return null;
      const best = Math.max(...sets.map(x => est1RM(x.weight, x.reps)));
      return { date: s.date, maxWeight: best };
    })
    .filter(Boolean);
}

function renderChart(data, title) {
  if (!data.length) return `<div class="chart-card"><div class="chart-title">${title}</div><div class="chart-empty">Nessun dato</div></div>`;
  if (data.length === 1) return `<div class="chart-card"><div class="chart-title">${title}</div><div class="chart-empty">~${data[0].maxWeight}kg — ${fmtDate(data[0].date)}</div></div>`;

  const W = 320, H = 120;
  const pad = { t: 14, r: 44, b: 22, l: 32 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const weights = data.map(d => d.maxWeight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 5;

  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * iW,
    y: pad.t + iH - ((d.maxWeight - minW) / range) * iH,
    ...d,
  }));

  const lineStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaStr = [
    `${pts[0].x.toFixed(1)},${pad.t + iH}`,
    ...pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
    `${pts[pts.length-1].x.toFixed(1)},${pad.t + iH}`,
  ].join(' ');

  const gId = `g${title.replace(/\W/g,'')}`;
  const dots = pts.map(p =>
    `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#00d68f" stroke="#111" stroke-width="1.5"/>`
  ).join('');

  const indices = new Set([0, data.length - 1]);
  if (data.length > 2) {
    const step = Math.ceil((data.length - 1) / 3);
    for (let i = step; i < data.length - 1; i += step) indices.add(i);
  }
  const xLabels = [...indices].sort((a,b)=>a-b).map(i => {
    const p = pts[i];
    return `<text x="${p.x.toFixed(1)}" y="${H - 2}" fill="#888" font-size="9" text-anchor="middle">${fmtDate(p.date)}</text>`;
  }).join('');

  const yLabels = `
    <text x="${pad.l - 4}" y="${(pad.t + iH + 3).toFixed(1)}" fill="#888" font-size="9" text-anchor="end">${minW}</text>
    <text x="${pad.l - 4}" y="${(pad.t + 3).toFixed(1)}" fill="#888" font-size="9" text-anchor="end">${maxW}</text>`;

  const last = pts[pts.length - 1];
  const callout = `<text x="${(last.x + 5).toFixed(1)}" y="${(last.y + 4).toFixed(1)}" fill="#00d68f" font-size="11" font-weight="700">~${last.maxWeight}kg</text>`;

  return `
    <div class="chart-card">
      <div class="chart-title">${title}</div>
      <svg viewBox="0 0 ${W} ${H}" class="chart-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${gId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00d68f" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#00d68f" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <polygon points="${areaStr}" fill="url(#${gId})"/>
        <polyline points="${lineStr}" fill="none" stroke="#00d68f" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}
        <g font-family="-apple-system,sans-serif">${xLabels}${yLabels}</g>
        ${callout}
      </svg>
    </div>`;
}

function renderStats() {
  const sessions = getSessions();
  const totalSets = sessions.reduce((n, s) =>
    n + Object.values(s.exercises).reduce((m, sets) => m + (sets?.length || 0), 0), 0);

  const fondGroup = [
    renderChart(getChartData('bench_press', 'A'), 'Bench Press — 1RM est.'),
    renderChart(getChartData('back_squat',  'C'), 'Back Squat — 1RM est.'),
    renderChart(getChartData('deadlift',    'B'), 'Stacco da Terra — 1RM est.'),
  ].join('');

  return `
    <div class="stats-section">
      <div class="stats-summary">
        <div class="stat-pill"><span class="stat-val">${sessions.length}</span><span class="stat-lbl">sessioni</span></div>
        <div class="stat-pill"><span class="stat-val">${totalSets}</span><span class="stat-lbl">serie totali</span></div>
        <div class="stat-pill"><span class="stat-val">4</span><span class="stat-lbl">allenamenti/sett</span></div>
      </div>
      <div class="stats-group-label">Fondamentali — 1RM stimato</div>
      ${fondGroup}
    </div>`;
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function renderCalendar() {
  const sessions = getSessions();
  const byDate = {};
  sessions.forEach(s => { if (!byDate[s.date]) byDate[s.date] = s; });

  const now = new Date();
  const months = [
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
    new Date(now.getFullYear(), now.getMonth(), 1),
  ];
  return months.map(m => renderMonth(m, byDate)).join('');
}

function renderMonth(monthStart, byDate) {
  const MONTH_NAMES = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                        'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  const year  = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  let startDow = new Date(year, month, 1).getDay();
  startDow = (startDow + 6) % 7;

  const todayStr = new Date().toISOString().split('T')[0];
  const headerCells = ['Lu','Ma','Me','Gi','Ve','Sa','Do']
    .map(d => `<div class="cal-dow">${d}</div>`).join('');

  let cells = '';
  for (let i = 0; i < startDow; i++) cells += '<div class="cal-cell cal-empty"></div>';
  for (let d = 1; d <= lastDay; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const s  = byDate[ds];
    const isToday = ds === todayStr ? ' cal-today' : '';
    const hasCls  = s ? ' cal-has-workout' : '';
    const onclick = s ? `onclick="navigate('session/${s.id}')"` : '';
    const badge   = s ? `<span class="cal-badge">${s.workout}</span>` : '';
    cells += `<div class="cal-cell${hasCls}${isToday}" ${onclick}><span class="cal-day">${d}</span>${badge}</div>`;
  }

  return `
    <div class="cal-month">
      <div class="cal-month-name">${MONTH_NAMES[month]} ${year}</div>
      <div class="cal-grid">${headerCells}${cells}</div>
    </div>`;
}

// ── Router ────────────────────────────────────────────────────────────────────

function navigate(path) { location.hash = path; }

window.addEventListener('hashchange', () => {
  const page = (location.hash.slice(1) || 'home').split('/')[0];
  if (page !== 'workout') stopTimer();
  render();
});

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ── Views ─────────────────────────────────────────────────────────────────────

function renderHome() {
  const cards = ['A', 'B', 'C', 'D'].map(w => {
    const labels = { A: 'Petto + Bicipiti', B: 'Schiena + Tricipiti', C: 'Gambe + Polpacci', D: 'Spalle + Dorsali' };
    const last = lastSessionOf(w);
    return `
      <button class="workout-card" onclick="navigate('workout/${w}')">
        <div class="wcard-label">Workout ${w}</div>
        <div class="wcard-preview">${labels[w]}</div>
        <div class="wcard-last">Ultimo: ${last ? fmtDate(last.date) : 'mai'}</div>
      </button>`;
  }).join('');

  return `
    <div class="view home-view">
      <header class="hdr hdr-flat">
        <span class="logo">GYM</span>
        <span class="badge">Arianit</span>
      </header>
      <div class="week-scheme">Ipertrofia — cedimento tecnico · rec. 1'–2'</div>
      <div class="workout-cards">${cards}</div>
      <button class="history-link" onclick="navigate('history')">Storico &amp; Grafici</button>
    </div>`;
}

function renderWorkout(w) {
  if (!activeSession || activeSession.workout !== w) {
    activeSession = { workout: w, exercises: {} };
  }

  const items = WORKOUTS[w].map((ex, idx) => {
    const tgt  = getTarget(ex);
    const hist = getHistory(ex.id, w, 3);
    const noteHtml = ex.note ? `<span class="ex-note">${ex.note}</span>` : '';
    const restHtml = tgt.rest ? ` · ${tgt.rest}` : '';

    const histRows = hist.length
      ? [...hist].reverse().map(s => `
          <div class="hist-row">
            <span class="hist-dt">${fmtDate(s.date)}</span>
            <span class="hist-sets">${fmtSets(s.exercises[ex.id])}</span>
          </div>`).join('')
      : '<div class="hist-empty">Nessuno storico</div>';

    const inputsHtml = `
      <div class="setlist" id="sets-${ex.id}">${buildSetRows(ex, tgt, w)}</div>
      <button class="add-set" onclick="addSet('${ex.id}','${w}')">+ Aggiungi set</button>`;

    return `
      <div class="ex-card" id="card-${ex.id}">
        <div class="ex-hdr" onclick="toggleEx('${ex.id}')">
          <div class="ex-left">
            <span class="ex-num">${idx + 1}</span>
            <div class="ex-meta">
              <span class="ex-name">${ex.name}</span>
              <span class="ex-tgt">${tgt.label}${restHtml}</span>
              ${noteHtml}
            </div>
          </div>
          <span class="ex-chev" id="chev-${ex.id}">˅</span>
        </div>
        <div class="ex-body open" id="body-${ex.id}">
          <div class="ex-hist">${histRows}</div>
          <div class="ex-inputs">${inputsHtml}</div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="view workout-view">
      <header class="hdr hdr-stack">
        <div class="hdr-main">
          <button class="back" onclick="leaveWorkout()">←</button>
          <span class="hdr-title">Workout ${w}</span>
          <span class="badge">Cappucci</span>
        </div>
        <div id="timer-bar" class="timer-bar hidden">
          <span class="timer-label">RECUPERO</span>
          <span class="timer-num" id="timer-num">0:00</span>
          <button class="timer-skip" onclick="skipTimer()">Salta ›</button>
        </div>
      </header>
      <div class="ex-list">${items}</div>
      <div class="save-bar">
        <button class="save-btn" onclick="saveWorkout('${w}')">Salva allenamento</button>
      </div>
    </div>`;
}

function buildSetRows(ex, tgt, workout) {
  const last = getSessions()
    .filter(s => s.workout === workout && s.exercises?.[ex.id])
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const lastSets = last ? last.exercises[ex.id] : [];
  let html = '';
  for (let i = 0; i < tgt.nSets; i++) html += makeSetRow(ex.id, i, lastSets[i]);
  return html;
}

function makeSetRow(exId, i, lastSet) {
  const kgPh  = lastSet?.weight != null ? lastSet.weight : '';
  const repPh = lastSet?.reps   != null ? lastSet.reps   : '';
  return `
    <div class="set-row" id="sr-${exId}-${i}">
      <span class="set-n">${i + 1}</span>
      <input type="number" inputmode="decimal" step="0.5" class="inp-kg"
             id="kg-${exId}-${i}" placeholder="${kgPh}">
      <span class="inp-lbl">kg</span>
      <input type="number" inputmode="numeric" class="inp-rp"
             id="rp-${exId}-${i}" placeholder="${repPh}">
      <span class="inp-lbl">reps</span>
      <button class="set-chk" id="chk-${exId}-${i}" onclick="toggleSet('${exId}',${i})"></button>
    </div>`;
}

function renderHistory() {
  return `
    <div class="view history-view">
      <header class="hdr hdr-flat">
        <button class="back" onclick="navigate('home')">←</button>
        <span class="hdr-title">Storico &amp; Grafici</span>
      </header>
      ${renderStats()}
      <div class="section-label">Calendario</div>
      <div class="cal-wrap">${renderCalendar()}</div>
    </div>`;
}

function renderSession(id) {
  const s = getSessions().find(x => x.id === id);
  if (!s) return `<div class="view"><div class="empty">Sessione non trovata</div></div>`;

  const rows = WORKOUTS[s.workout].map(ex => {
    const sets = s.exercises[ex.id];
    if (!sets) return '';
    return `
      <div class="detail-ex">
        <div class="detail-name">${ex.name}</div>
        <div class="detail-sets">${fmtSets(sets)}</div>
      </div>`;
  }).filter(Boolean).join('');

  return `
    <div class="view session-view">
      <header class="hdr hdr-flat">
        <button class="back" onclick="navigate('history')">←</button>
        <span class="hdr-title">${fmtDate(s.date)} — Workout ${s.workout}</span>
      </header>
      <div class="detail-list">${rows}</div>
    </div>`;
}

// ── Interactions ──────────────────────────────────────────────────────────────

function toggleEx(exId) {
  const body = document.getElementById(`body-${exId}`);
  const chev = document.getElementById(`chev-${exId}`);
  if (!body) return;
  const open = body.classList.toggle('open');
  chev.textContent = open ? '˅' : '›';
  if (open) setTimeout(() => body.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

function addSet(exId, workout) {
  const list = document.getElementById(`sets-${exId}`);
  if (!list) return;
  const idx = list.querySelectorAll('.set-row').length;
  const last = getSessions()
    .filter(s => s.workout === workout && s.exercises?.[exId])
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const lastSets = last?.exercises?.[exId] || [];
  const div = document.createElement('div');
  div.innerHTML = makeSetRow(exId, idx, lastSets[idx]);
  list.appendChild(div.firstElementChild);
}

function leaveWorkout() {
  const hasSets = activeSession && Object.values(activeSession.exercises).some(s => s?.length);
  if (hasSets && !confirm('Hai serie non salvate. Uscire?')) return;
  stopTimer(); activeSession = null; navigate('home');
}

function collectEx(ex, workout) {
  const list = document.getElementById(`sets-${ex.id}`);
  if (!list) return activeSession?.exercises?.[ex.id]?.filter(Boolean) || null;
  const sets = [];
  list.querySelectorAll('.set-row').forEach((_, i) => {
    const stored = activeSession?.exercises?.[ex.id]?.[i];
    const kgEl = document.getElementById(`kg-${ex.id}-${i}`);
    const rpEl = document.getElementById(`rp-${ex.id}-${i}`);
    const kg   = stored?.weight ?? (kgEl?.value !== '' ? parseFloat(kgEl?.value) : null);
    const reps = stored?.reps   ?? (rpEl?.value !== '' ? parseInt(rpEl?.value)   : null);
    if (kg !== null || reps !== null) sets.push({ weight: kg, reps });
  });
  return sets.length ? sets : null;
}

function saveWorkout(workout) {
  const data = {};
  let hasAny = false;
  WORKOUTS[workout].forEach(ex => {
    const sets = collectEx(ex, workout);
    if (sets) { data[ex.id] = sets; hasAny = true; }
  });
  if (!hasAny) { showToast('Nessun dato da salvare!'); return; }
  const today = new Date().toISOString().split('T')[0];
  const session = {
    id: `${today.replace(/-/g,'')}_${workout}_${Date.now()}`,
    date: today, workout, exercises: data,
  };
  const all = getSessions();
  all.push(session);
  saveSessions(all);
  stopTimer(); activeSession = null;
  showToast(`Workout ${workout} salvato! 💪`);
  setTimeout(() => navigate('home'), 900);
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  const hash  = location.hash.slice(1) || 'home';
  const parts = hash.split('/');
  const app   = document.getElementById('app');
  switch (parts[0]) {
    case 'workout': app.innerHTML = renderWorkout(parts[1] || 'A'); break;
    case 'history': app.innerHTML = renderHistory(); break;
    case 'session': app.innerHTML = renderSession(parts[1]); break;
    default:        app.innerHTML = renderHome();
  }
  window.scrollTo(0, 0);
}

function init() {
  initStorage();
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

document.addEventListener('DOMContentLoaded', init);
