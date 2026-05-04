// ============================================================
// db.js — Quiz App Database (localStorage-based)
// No lock/timer system — wrong answers allow immediate retry
// ============================================================
// Schema for results stored under key "quizResults":
// [
//   {
//     id: <timestamp>,
//     shopId: 1-18,
//     questionIndex: 0-17,
//     correct: true/false,
//     stars: 1-5 or null,
//     timestamp: ISO string,
//     attempts: number
//   },
//   ...
// ]
//
// Player state under "playerState":
// {
//   completedShops: [1, 3, 5, ...],
//   revealedLetters: ["あ", null, "つ", ...],
//   completed: false,
//   completionRating: null
// }
// ============================================================

const DB_RESULTS_KEY = 'quizResults';
const DB_STATE_KEY   = 'playerState';

// ---- Results --------------------------------------------------

function getAllResults() {
  try {
    return JSON.parse(localStorage.getItem(DB_RESULTS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveResult(entry) {
  const results = getAllResults();
  results.push({
    id: Date.now(),
    ...entry,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem(DB_RESULTS_KEY, JSON.stringify(results));
}

function clearAllResults() {
  localStorage.removeItem(DB_RESULTS_KEY);
}

// ---- Player State --------------------------------------------

function getPlayerState() {
  try {
    const raw = localStorage.getItem(DB_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return {
    completedShops: [],
    revealedLetters: new Array(18).fill(null),
    completed: false,
    completionRating: null
  };
}

function savePlayerState(state) {
  localStorage.setItem(DB_STATE_KEY, JSON.stringify(state));
}

function resetPlayerState() {
  localStorage.removeItem(DB_STATE_KEY);
}

// ---- Admin Helpers -------------------------------------------

function getAdminStats() {
  const results = getAllResults();
  const total = results.length;
  const correct = results.filter(r => r.correct).length;
  const withRating = results.filter(r => r.stars !== null);
  const avgStars = withRating.length
    ? (withRating.reduce((s, r) => s + r.stars, 0) / withRating.length).toFixed(1)
    : '—';
  const byShop = {};
  for (let i = 1; i <= 18; i++) {
    byShop[i] = { correct: 0, wrong: 0, stars: [] };
  }
  results.forEach(r => {
    if (!byShop[r.shopId]) byShop[r.shopId] = { correct: 0, wrong: 0, stars: [] };
    r.correct ? byShop[r.shopId].correct++ : byShop[r.shopId].wrong++;
    if (r.stars) byShop[r.shopId].stars.push(r.stars);
  });
  return { total, correct, avgStars, byShop };
}

function exportCSV() {
  const results = getAllResults();
  const header = ['ID','ShopID','QuestionIndex','Correct','Stars','Timestamp','Attempts'];
  const rows = results.map(r => [
    r.id, r.shopId, r.questionIndex, r.correct, r.stars ?? '', r.timestamp, r.attempts ?? 1
  ]);
  return [header, ...rows].map(r => r.join(',')).join('\n');
}

// Expose globally
window.QuizDB = {
  getAllResults, saveResult, clearAllResults,
  getPlayerState, savePlayerState, resetPlayerState,
  getAdminStats, exportCSV
};
