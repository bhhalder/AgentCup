/**
 * Agent Cup — Leaderboard App
 *
 * State is persisted in localStorage under the key "agentcup".
 * No external dependencies.
 */

// ── State ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agentcup';

function defaultState() {
  return {
    teams: [],        // [{ id, name }]
    criteria: [],     // [{ id, name, weight }]
    scores: {},       // { teamId: { criteriaId: number } }
    scoreMin: 0,
    scoreMax: 10,
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to handle older stored states missing new fields
      return Object.assign(defaultState(), parsed);
    }
  } catch (_) { /* ignore parse errors */ }
  return defaultState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── ID helpers ───────────────────────────────────────────────────────────────

let _idCounter = Date.now();
function nextId() {
  return String(++_idCounter);
}

// ── Tab navigation ───────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const panelId = 'tab-' + btn.dataset.tab;
    document.getElementById(panelId).classList.add('active');

    if (btn.dataset.tab === 'scores') renderScoreTable();
    if (btn.dataset.tab === 'rankings') renderRankings();
  });
});

// ── Configure — Teams ────────────────────────────────────────────────────────

const teamInput   = document.getElementById('teamInput');
const addTeamBtn  = document.getElementById('addTeamBtn');
const teamList    = document.getElementById('teamList');

addTeamBtn.addEventListener('click', addTeam);
teamInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTeam(); });

function addTeam() {
  const name = teamInput.value.trim();
  if (!name) return flash(teamInput);
  if (state.teams.some(t => t.name.toLowerCase() === name.toLowerCase())) {
    return flash(teamInput, 'duplicate');
  }
  const team = { id: nextId(), name };
  state.teams.push(team);
  // Initialise score slots
  state.criteria.forEach(c => {
    if (!state.scores[team.id]) state.scores[team.id] = {};
    state.scores[team.id][c.id] = null;
  });
  saveState();
  teamInput.value = '';
  renderTeams();
}

function renderTeams() {
  teamList.innerHTML = '';
  if (!state.teams.length) {
    teamList.innerHTML = '<li class="empty-state">No teams yet.</li>';
    return;
  }
  state.teams.forEach((team, idx) => {
    const li = document.createElement('li');
    li.dataset.id = team.id;
    li.innerHTML = `
      <span class="item-label" data-field="name">${escHtml(team.name)}</span>
      <span class="item-badge">#${idx + 1}</span>
      <button class="btn-icon edit-btn" title="Edit name">✏️</button>
      <button class="btn-icon del-btn" title="Remove">🗑</button>`;
    li.querySelector('.edit-btn').addEventListener('click', () => startInlineEdit(li, team, 'team'));
    li.querySelector('.del-btn').addEventListener('click', () => removeTeam(team.id));
    teamList.appendChild(li);
  });
}

function removeTeam(id) {
  state.teams = state.teams.filter(t => t.id !== id);
  delete state.scores[id];
  saveState();
  renderTeams();
}

// ── Configure — Criteria ─────────────────────────────────────────────────────

const criteriaInput   = document.getElementById('criteriaInput');
const criteriaWeight  = document.getElementById('criteriaWeight');
const addCriteriaBtn  = document.getElementById('addCriteriaBtn');
const criteriaList    = document.getElementById('criteriaList');

addCriteriaBtn.addEventListener('click', addCriteria);
criteriaInput.addEventListener('keydown', e => { if (e.key === 'Enter') addCriteria(); });

function addCriteria() {
  const name   = criteriaInput.value.trim();
  const weight = Math.max(1, Math.min(10, parseInt(criteriaWeight.value, 10) || 1));
  if (!name) return flash(criteriaInput);
  if (state.criteria.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    return flash(criteriaInput, 'duplicate');
  }
  const crit = { id: nextId(), name, weight };
  state.criteria.push(crit);
  // Initialise score slots for all teams
  state.teams.forEach(t => {
    if (!state.scores[t.id]) state.scores[t.id] = {};
    state.scores[t.id][crit.id] = null;
  });
  saveState();
  criteriaInput.value = '';
  criteriaWeight.value = '1';
  renderCriteria();
}

function renderCriteria() {
  criteriaList.innerHTML = '';
  if (!state.criteria.length) {
    criteriaList.innerHTML = '<li class="empty-state">No criteria yet.</li>';
    return;
  }
  state.criteria.forEach(crit => {
    const li = document.createElement('li');
    li.dataset.id = crit.id;
    li.innerHTML = `
      <span class="item-label" data-field="name">${escHtml(crit.name)}</span>
      <span class="item-badge">×${crit.weight}</span>
      <button class="btn-icon edit-btn" title="Edit">✏️</button>
      <button class="btn-icon del-btn" title="Remove">🗑</button>`;
    li.querySelector('.edit-btn').addEventListener('click', () => startInlineEdit(li, crit, 'criteria'));
    li.querySelector('.del-btn').addEventListener('click', () => removeCriteria(crit.id));
    criteriaList.appendChild(li);
  });
}

function removeCriteria(id) {
  state.criteria = state.criteria.filter(c => c.id !== id);
  Object.values(state.scores).forEach(row => delete row[id]);
  saveState();
  renderCriteria();
}

// ── Inline editing ────────────────────────────────────────────────────────────

function startInlineEdit(li, item, type) {
  const labelEl = li.querySelector('[data-field="name"]');
  const original = item.name;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'inline-edit';
  input.value = original;
  input.maxLength = 60;
  labelEl.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const val = input.value.trim();
    if (val && val !== original) {
      item.name = val;
      saveState();
    }
    if (type === 'team') renderTeams();
    else renderCriteria();
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { input.blur(); }
    if (e.key === 'Escape') { input.value = original; input.blur(); }
  });
}

// ── Configure — Score range ───────────────────────────────────────────────────

const scoreMinInput = document.getElementById('scoreMin');
const scoreMaxInput = document.getElementById('scoreMax');
const saveRangeBtn  = document.getElementById('saveRangeBtn');
const rangeMsg      = document.getElementById('rangeMsg');

function populateRangeInputs() {
  scoreMinInput.value = state.scoreMin;
  scoreMaxInput.value = state.scoreMax;
}

saveRangeBtn.addEventListener('click', () => {
  const min = parseInt(scoreMinInput.value, 10);
  const max = parseInt(scoreMaxInput.value, 10);
  if (isNaN(min) || isNaN(max) || min >= max) {
    rangeMsg.textContent = '⚠ Min must be less than Max.';
    rangeMsg.style.color = '#f87171';
    return;
  }
  state.scoreMin = min;
  state.scoreMax = max;
  saveState();
  rangeMsg.textContent = '✓ Saved';
  rangeMsg.style.color = '#4ade80';
  setTimeout(() => { rangeMsg.textContent = ''; }, 2000);
});

// ── Reset ─────────────────────────────────────────────────────────────────────

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset all data? This cannot be undone.')) return;
  state = defaultState();
  saveState();
  renderAll();
});

// ── Scores Tab ────────────────────────────────────────────────────────────────

function renderScoreTable() {
  const wrapper = document.getElementById('scoreTableWrapper');
  if (!state.teams.length || !state.criteria.length) {
    wrapper.innerHTML = '<p class="empty-state">Add teams and criteria in the <strong>Configure</strong> tab first.</p>';
    return;
  }

  let html = '<div class="score-table-scroll"><table class="score-table"><thead><tr><th>Team</th>';
  state.criteria.forEach(c => {
    html += `<th>${escHtml(c.name)}<br/><span style="font-weight:400;font-size:.75rem">×${c.weight}</span></th>`;
  });
  html += '<th>Weighted Total</th></tr></thead><tbody>';

  state.teams.forEach(team => {
    if (!state.scores[team.id]) state.scores[team.id] = {};
    html += `<tr><td>${escHtml(team.name)}</td>`;
    let total = 0;
    state.criteria.forEach(crit => {
      const val = state.scores[team.id][crit.id];
      const displayVal = (val !== null && val !== undefined) ? val : '';
      html += `<td><input
        class="score-cell"
        type="number"
        min="${state.scoreMin}"
        max="${state.scoreMax}"
        step="0.5"
        value="${escAttr(String(displayVal))}"
        data-team="${escAttr(team.id)}"
        data-crit="${escAttr(crit.id)}"
      /></td>`;
      if (val !== null && val !== undefined && val !== '') {
        total += parseFloat(val) * crit.weight;
      }
    });
    html += `<td class="score-total">${formatScore(total)}</td></tr>`;
  });

  html += '</tbody></table></div>';
  wrapper.innerHTML = html;

  // Attach change listeners
  wrapper.querySelectorAll('.score-cell').forEach(input => {
    input.addEventListener('change', handleScoreChange);
    input.addEventListener('blur', handleScoreChange);
  });
}

function handleScoreChange(e) {
  const input = e.target;
  const teamId = input.dataset.team;
  const critId = input.dataset.crit;
  const raw    = input.value.trim();

  if (raw === '') {
    if (!state.scores[teamId]) state.scores[teamId] = {};
    state.scores[teamId][critId] = null;
    saveState();
    updateRowTotal(teamId);
    return;
  }

  let val = parseFloat(raw);
  if (isNaN(val)) { input.value = ''; return; }
  val = Math.max(state.scoreMin, Math.min(state.scoreMax, val));
  input.value = val;
  if (!state.scores[teamId]) state.scores[teamId] = {};
  state.scores[teamId][critId] = val;
  saveState();
  updateRowTotal(teamId);
}

function updateRowTotal(teamId) {
  const wrapper = document.getElementById('scoreTableWrapper');
  // Find the row — team cells in tbody
  const cells = wrapper.querySelectorAll(`.score-cell[data-team="${CSS.escape(teamId)}"]`);
  if (!cells.length) return;
  const row = cells[0].closest('tr');
  const totalCell = row.querySelector('.score-total');
  if (!totalCell) return;

  let total = 0;
  state.criteria.forEach(crit => {
    const val = state.scores[teamId] && state.scores[teamId][crit.id];
    if (val !== null && val !== undefined && val !== '') {
      total += parseFloat(val) * crit.weight;
    }
  });
  totalCell.textContent = formatScore(total);
}

// ── Rankings Tab ──────────────────────────────────────────────────────────────

function renderRankings() {
  renderOverallRanking();
  renderCriteriaRankings();
}

function teamWeightedTotal(team) {
  let total = 0;
  let hasAny = false;
  state.criteria.forEach(crit => {
    const val = state.scores[team.id] && state.scores[team.id][crit.id];
    if (val !== null && val !== undefined && val !== '') {
      total += parseFloat(val) * crit.weight;
      hasAny = true;
    }
  });
  return hasAny ? total : null;
}

function renderOverallRanking() {
  const el = document.getElementById('overallRanking');
  if (!state.teams.length || !state.criteria.length) {
    el.innerHTML = '<p class="empty-state">No data yet. Add teams, criteria, and scores first.</p>';
    return;
  }

  const ranked = state.teams
    .map(t => ({ team: t, total: teamWeightedTotal(t) }))
    .filter(x => x.total !== null)
    .sort((a, b) => b.total - a.total || a.team.name.localeCompare(b.team.name));

  if (!ranked.length) {
    el.innerHTML = '<p class="empty-state">No scores entered yet.</p>';
    return;
  }

  const maxWeight = state.criteria.reduce((s, c) => s + c.weight * state.scoreMax, 0);

  el.innerHTML = '<ul class="ranking-list">' +
    ranked.map((item, idx) => {
      const pos  = idx + 1;
      const cls  = pos <= 3 ? `rank-${pos}` : 'rank-other';
      const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos;
      const pct   = maxWeight > 0 ? ((item.total / maxWeight) * 100).toFixed(1) : '—';
      return `<li class="ranking-item">
        <span class="rank-pos ${cls}">${medal}</span>
        <span class="rank-name">${escHtml(item.team.name)}</span>
        <span class="rank-score">${formatScore(item.total)} <span>/ ${maxWeight} (${pct}%)</span></span>
      </li>`;
    }).join('') + '</ul>';
}

function renderCriteriaRankings() {
  const container = document.getElementById('criteriaRankingsContainer');
  container.innerHTML = '';
  if (!state.criteria.length || !state.teams.length) return;

  const grid = document.createElement('div');
  grid.className = 'criteria-rankings-grid';

  state.criteria.forEach(crit => {
    const ranked = state.teams
      .map(t => {
        const val = state.scores[t.id] && state.scores[t.id][crit.id];
        const score = (val !== null && val !== undefined && val !== '') ? parseFloat(val) : null;
        return { team: t, score };
      })
      .filter(x => x.score !== null)
      .sort((a, b) => b.score - a.score || a.team.name.localeCompare(b.team.name));

    const card = document.createElement('div');
    card.className = 'card';

    let inner = `<h2>${escHtml(crit.name)} <small style="font-size:.75rem;color:var(--text-muted)">×${crit.weight}</small></h2>`;
    if (!ranked.length) {
      inner += '<p class="empty-state">No scores yet.</p>';
    } else {
      inner += '<ul class="ranking-list">' +
        ranked.map((item, idx) => {
          const pos  = idx + 1;
          const cls  = pos <= 3 ? `rank-${pos}` : 'rank-other';
          const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos;
          return `<li class="ranking-item">
            <span class="rank-pos ${cls}">${medal}</span>
            <span class="rank-name">${escHtml(item.team.name)}</span>
            <span class="rank-score">${formatScore(item.score)} <span>/ ${state.scoreMax}</span></span>
          </li>`;
        }).join('') + '</ul>';
    }
    card.innerHTML = inner;
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

function formatScore(n) {
  if (n === null || n === undefined || n === '') return '—';
  const num = parseFloat(n);
  return isNaN(num) ? '—' : (Number.isInteger(num) ? String(num) : num.toFixed(1));
}

function flash(el, type) {
  el.style.borderColor = type === 'duplicate' ? '#f59e0b' : '#f87171';
  el.focus();
  setTimeout(() => { el.style.borderColor = ''; }, 900);
}

// ── Init ─────────────────────────────────────────────────────────────────────

function renderAll() {
  renderTeams();
  renderCriteria();
  populateRangeInputs();
}

renderAll();
