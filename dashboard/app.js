/**
 * AgentCup Hackathon Scoreboard
 * Manages team data, rendering, filtering, and periodic refresh simulation.
 */

'use strict';

// ---------------------------------------------------------------------------
// Sample team data
// ---------------------------------------------------------------------------
const TEAMS = [
  {
    id: 1,
    name: 'NeuralNomads',
    category: 'AI / ML',
    members: ['Alice K.', 'Ben T.', 'Cleo R.'],
    score: 9420,
    submissions: 6,
    previousRank: 2,
  },
  {
    id: 2,
    name: 'ByteBrigade',
    category: 'Automation',
    members: ['Dan M.', 'Eva S.'],
    score: 8875,
    submissions: 5,
    previousRank: 1,
  },
  {
    id: 3,
    name: 'QuantumLeap',
    category: 'AI / ML',
    members: ['Frank O.', 'Grace P.', 'Hiro N.', 'Isla V.'],
    score: 8540,
    submissions: 7,
    previousRank: 3,
  },
  {
    id: 4,
    name: 'CodeCraft',
    category: 'Productivity',
    members: ['Jack W.', 'Kira L.'],
    score: 8210,
    submissions: 4,
    previousRank: 5,
  },
  {
    id: 5,
    name: 'PixelPioneers',
    category: 'Productivity',
    members: ['Lena B.', 'Milo C.', 'Nora D.'],
    score: 7990,
    submissions: 5,
    previousRank: 4,
  },
  {
    id: 6,
    name: 'SentinelAI',
    category: 'Security',
    members: ['Omar F.', 'Petra G.'],
    score: 7650,
    submissions: 3,
    previousRank: 7,
  },
  {
    id: 7,
    name: 'DataDrifters',
    category: 'AI / ML',
    members: ['Quinn H.', 'Rosa J.', 'Sam K.'],
    score: 7320,
    submissions: 6,
    previousRank: 6,
  },
  {
    id: 8,
    name: 'AutoPilots',
    category: 'Automation',
    members: ['Tara L.', 'Uma M.', 'Vance N.'],
    score: 7100,
    submissions: 5,
    previousRank: 8,
  },
  {
    id: 9,
    name: 'FlowMasters',
    category: 'Automation',
    members: ['Willa O.', 'Xander P.'],
    score: 6850,
    submissions: 4,
    previousRank: 9,
  },
  {
    id: 10,
    name: 'CipherSquad',
    category: 'Security',
    members: ['Yara Q.', 'Zane R.', 'Aria S.'],
    score: 6600,
    submissions: 3,
    previousRank: 11,
  },
  {
    id: 11,
    name: 'InnovatorsHub',
    category: 'Productivity',
    members: ['Blaine T.', 'Callie U.'],
    score: 6340,
    submissions: 4,
    previousRank: 10,
  },
  {
    id: 12,
    name: 'DeepDive',
    category: 'AI / ML',
    members: ['Dex V.', 'Erin W.', 'Finn X.'],
    score: 5980,
    submissions: 5,
    previousRank: 12,
  },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let currentFilter = 'all';
let searchQuery = '';
let sortedTeams = rankTeams(TEAMS);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assign ranks and return a sorted copy */
function rankTeams(teams) {
  return [...teams]
    .sort((a, b) => b.score - a.score)
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

/** Category → CSS class */
function categoryClass(category) {
  const map = {
    'AI / ML':      'ai-ml',
    'Automation':   'automation',
    'Productivity': 'productivity',
    'Security':     'security',
  };
  return map[category] || 'ai-ml';
}

/** Rank change indicator */
function rankChange(team) {
  const diff = team.previousRank - team.rank;
  if (diff > 0) return `<span class="change-up" aria-label="Moved up ${diff} position${diff !== 1 ? 's' : ''}">▲ ${diff}</span>`;
  if (diff < 0) return `<span class="change-down" aria-label="Moved down ${Math.abs(diff)} position${Math.abs(diff) !== 1 ? 's' : ''}">▼ ${Math.abs(diff)}</span>`;
  return `<span class="change-same" aria-label="No change">—</span>`;
}

/** Rank badge class */
function rankBadgeClass(rank) {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return 'normal';
}

/** Podium medal emoji */
function medal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  return '🥉';
}

/** Format large numbers with commas */
function fmtScore(n) {
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Render functions
// ---------------------------------------------------------------------------

function updateStats() {
  const totalTeams       = TEAMS.length;
  const totalSubmissions = TEAMS.reduce((s, t) => s + t.submissions, 0);
  const topScore         = sortedTeams[0]?.score ?? 0;
  const avgScore         = Math.round(TEAMS.reduce((s, t) => s + t.score, 0) / TEAMS.length);

  document.getElementById('stat-teams').textContent       = totalTeams;
  document.getElementById('stat-submissions').textContent = totalSubmissions;
  document.getElementById('stat-top-score').textContent   = fmtScore(topScore);
  document.getElementById('stat-avg-score').textContent   = fmtScore(avgScore);
}

function renderPodium() {
  const top3   = sortedTeams.slice(0, 3);
  const podium = document.getElementById('podium');

  // Classic podium order: 2nd | 1st | 3rd
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);

  podium.innerHTML = order.map(team => `
    <div class="podium-card rank-${team.rank}" aria-label="${team.name}, rank ${team.rank}">
      <div class="podium-medal">${medal(team.rank)}</div>
      <div class="podium-rank">${team.rank === 1 ? '1st Place' : team.rank === 2 ? '2nd Place' : '3rd Place'}</div>
      <div class="podium-team-name">${escapeHtml(team.name)}</div>
      <div class="podium-category">${escapeHtml(team.category)}</div>
      <div class="podium-score">${fmtScore(team.score)}</div>
      <div class="podium-score-label">points</div>
    </div>
  `).join('');
}

function getFilteredTeams() {
  return sortedTeams.filter(team => {
    const matchesCategory = currentFilter === 'all' || team.category === currentFilter;
    const matchesSearch   = team.name.toLowerCase().includes(searchQuery) ||
                            team.category.toLowerCase().includes(searchQuery) ||
                            team.members.some(m => m.toLowerCase().includes(searchQuery));
    return matchesCategory && matchesSearch;
  });
}

function renderLeaderboard() {
  const filtered = getFilteredTeams();
  const tbody    = document.getElementById('leaderboard-body');
  const noResults = document.getElementById('no-results');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');

  tbody.innerHTML = filtered.map(team => {
    const topClass = team.rank <= 3 ? ` rank-top-${team.rank}` : '';
    return `
      <tr class="${topClass}" data-team-id="${team.id}">
        <td>
          <span class="rank-badge ${rankBadgeClass(team.rank)}"
                aria-label="Rank ${team.rank}">
            ${team.rank}
          </span>
        </td>
        <td class="team-name">${escapeHtml(team.name)}</td>
        <td>
          <span class="category-pill ${categoryClass(team.category)}">
            ${escapeHtml(team.category)}
          </span>
        </td>
        <td class="col-members">${team.members.length} member${team.members.length !== 1 ? 's' : ''}</td>
        <td class="col-score score-value">${fmtScore(team.score)}</td>
        <td class="col-change">${rankChange(team)}</td>
      </tr>
    `;
  }).join('');
}

function updateTimestamp() {
  const el = document.getElementById('last-updated');
  const now = new Date();
  el.textContent = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

function fullRender() {
  sortedTeams = rankTeams(TEAMS);
  updateStats();
  renderPodium();
  renderLeaderboard();
  updateTimestamp();
}

// ---------------------------------------------------------------------------
// XSS safety
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Simulated live score updates (demo only)
// ---------------------------------------------------------------------------
function simulateScoreUpdate() {
  TEAMS.forEach(team => {
    // Random small delta ±0..150 points per tick
    const delta = Math.floor(Math.random() * 151) - 20;
    team.score  = Math.max(0, team.score + delta);
  });

  // Re-rank: store previous rank first
  const newRanked = rankTeams(TEAMS);
  newRanked.forEach(nt => {
    const old = sortedTeams.find(t => t.id === nt.id);
    nt.previousRank = old ? old.rank : nt.rank;
    // Mutate original TEAMS array score
    const orig = TEAMS.find(t => t.id === nt.id);
    if (orig) {
      orig.previousRank = nt.previousRank;
    }
  });

  fullRender();
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------
function init() {
  fullRender();

  // Search
  document.getElementById('search-input').addEventListener('input', e => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderLeaderboard();
  });

  // Category filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderLeaderboard();
    });
  });

  // Simulate live score updates every 8 seconds
  setInterval(simulateScoreUpdate, 8000);
}

document.addEventListener('DOMContentLoaded', init);
