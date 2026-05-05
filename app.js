// ============================================================
// app.js — Quiz App Main Logic
// Fixes applied:
//   1. Rating is positioned before "Confirm Answer" in HTML
//   2. No scroll-of-letters on quiz page
//   3. Random shop order supported (completedShops is a Set, order irrelevant)
//   4. Close scanner handled in index.html
//   5. Auto-redirect to index.html after 5s (correct or wrong)
//   6. Correct answer NOT revealed on wrong guess
// ============================================================

// ---- Question & Answer Data ---------------------------------
// EDIT: 'q', 'choices', 'answer' (index 0–3 of correct choice), 'letter'

const QUESTIONS = [
  {
    shopId: 1,
    q: "<2Cの企画名>の入り口でイメージしているものはなに？",
    choices: ["神社", "うみ", "いぬ", "キツツキ"],
    answer: 0,
    letter: "あ"
  },
  {
    shopId: 2,
    q: "高校一年生の遠足の行き先はどこ？",
    choices: ["横浜", "上野", "沖縄", "北海道"],
    answer: 1,
    letter: "か"
  },
  {
    shopId: 3,
    q: "〈3Cの企画名〉でやってはいけない事はなに？",
    choices: ["物を盗む", "音を立てる", "ゲームを楽しむ", "友達と来る"],
    answer: 1,
    letter: "つ"
  },
  {
    shopId: 4,
    q: "〈2Aの企画名〉で遊べないゲームはどれ？",
    choices: ["ブラックジャック", "丁半", "ルーレット", "ポーカー"],
    answer: 3,
    letter: "き"
  },
  {
    shopId: 5,
    q: "1DのクラスTシャツはどこのサッカーチームをモデルにした？",
    choices: ["ドイツ", "イタリア", "ブラジル", "アルゼンチン"],
    answer: 2,
    letter: "に"
  },
  {
    shopId: 6,
    q: "メイドカフェはもともと、どこで始まった？",
    choices: ["渋谷", "沼津", "秋葉原", "銀座"],
    answer: 2,
    letter: "さ"
  },
  {
    shopId: 7,
    q: "2Dの出し物、〈2Dの企画名〉の名前の由来は？",
    choices: ["ハロウィン", "海賊", "節分", "山賊"],
    answer: 1,
    letter: "け"
  },
  {
    shopId: 8,
    q: "お化け屋敷はどこのだれが作った？",
    choices: ["江戸時代の町医者", "琉球の武道家", "イギリスの発明家", "信濃の子供"],
    answer: 0,
    letter: "わ"
  },
  {
    shopId: 9,
    q: "1αの企画、〈1αの企画名〉に出てくる動物はなに？",
    choices: ["羊", "うさぎ", "ライオン", "馬"],
    answer: 3,
    letter: "れ"
  },
  {
    shopId: 10,
    q: "ジェンガの発祥の国はどこ？",
    choices: ["アメリカ", "スウェーデン", "イギリス", "ドイツ"],
    answer: 2,
    letter: "ら"
  },
  {
    shopId: 11,
    q: "「占う」と同じく、「うらなう」という読みがある漢字はどれ？",
    choices: ["相う", "点う", "術う", "卜う"],
    answer: 3,
    letter: "の"
  },
  {
    shopId: 12,
    q: "「嵐」はどんなグループ？",
    choices: ["スポーツチーム", "お笑いチーム", "アイドルチーム", "料理チーム"],
    answer: 2,
    letter: "は"
  },
  {
    shopId: 13,
    q: "人の体で一番大きい臓器はどれ？",
    choices: ["肝臓", "心臓", "肺", "皮膚"],
    answer: 0,
    letter: "ま"
  },
  {
    shopId: 14,
    q: "3Bの<3Bの企画名>で食べれないものはなに？",
    choices: ["シフォンケーキ", "フロランタン", "マカロン", "クッキー"],
    answer: 2,
    letter: "ゆ"
  },
  {
    shopId: 15,
    q: "「賢の教室」がある教室の番号は？",
    choices: ["305", "204", "304", "205"],
    answer: 2,
    letter: "う"
  },
  {
    shopId: 16,
    q: "ハワイ州の州の花はなに？",
    choices: ["チューリップ", "ひまわり", "ハイビスカス", "つばき"],
    answer: 2,
    letter: "5"
  },
  {
    shopId: 17,
    q: "〈3αの企画名〉で起きる事件はなに？",
    choices: ["失踪事件", "殺人事件", "3億円事件", "夜勤事件"],
    answer: 0,
    letter: "1"
  },
  {
    shopId: 18,
    q: "射的は何時代から始まった？",
    choices: ["平安時代", "戦国時代", "江戸時代", "明治時代"],
    answer: 3,
    letter: "7"
  }
];

const CHOICE_KEYS = ['A', 'B', 'C', 'D'];
const REDIRECT_DELAY = 5; // seconds before auto-return to index.html

// ---- State ---------------------------------------------------
let currentShopId  = null;
let questionData   = null;
let selectedChoice = null;
let answered       = false;
let countdownTimer = null;

const el = id => document.getElementById(id);

// ---- Navigation helper ---------------------------------------
function goHome() {
  if (countdownTimer) clearInterval(countdownTimer);
  window.location.href = 'index.html';
}

// ---- Init ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  currentShopId = parseInt(params.get('shop'), 10);

  if (!currentShopId || currentShopId < 1 || currentShopId > 18) {
    showError('Invalid shop QR code. Please scan a valid QR code at one of the shops.');
    return;
  }

  questionData = QUESTIONS.find(q => q.shopId === currentShopId);

  const state = QuizDB.getPlayerState();

  // Whole game complete → jump to celebration
  if (state.completed) {
    window.location.replace('completion.html');
    return;
  }

  // FIX 3: completedShops is treated as a plain array — order doesn't matter.
  // The user can visit shops in any random order; we just check membership.
  if (state.completedShops.includes(currentShopId)) {
    showAlreadyAnswered(state);
    return;
  }

  renderQuiz(state);
  initStarRating();
  el('submit-btn').addEventListener('click', submitAnswer);
});

// ---- Render quiz ---------------------------------------------
function renderQuiz(state) {
  // Count how many have been answered regardless of order
  const completedCount = state.completedShops.length;

  el('shop-badge-text').textContent = `Shop ${String(currentShopId).padStart(2, '0')}`;
  el('question-num').textContent    = `${completedCount} / 18`;
  el('progress-fill').style.width   = (completedCount / 18 * 100) + '%';
  el('question-text').textContent   = questionData.q;

  buildChoices();
}

// ---- Build choices -------------------------------------------
function buildChoices() {
  const list = el('choices-list');
  list.innerHTML = '';
  questionData.choices.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.dataset.index = i;
    btn.innerHTML = `<span class="choice-key">${CHOICE_KEYS[i]}</span><span>${text}</span>`;
    btn.addEventListener('click', () => selectChoice(i));
    list.appendChild(btn);
  });
  selectedChoice = null;
  answered = false;
  el('submit-btn').disabled = true;
}

// ---- Select a choice -----------------------------------------
function selectChoice(index) {
  if (answered) return;
  selectedChoice = index;
  document.querySelectorAll('.choice-btn').forEach((btn, i) => {
    btn.classList.toggle('selected', i === index);
  });
  el('submit-btn').disabled = false;
}

// ---- Submit answer -------------------------------------------
function submitAnswer() {
  if (selectedChoice === null || answered) return;
  answered = true;

  const isCorrect = selectedChoice === questionData.answer;

  // Disable all buttons — FIX 6: only mark selected wrong, never reveal correct
  document.querySelectorAll('.choice-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === selectedChoice && !isCorrect) {
      btn.classList.add('wrong');        // mark what they picked as wrong
    }
    // ← intentionally NOT adding 'correct' class to any button on wrong answer
    if (i === selectedChoice && isCorrect) {
      btn.classList.add('correct');      // mark their pick correct only when right
    }
  });

  el('submit-btn').disabled = true;
  // Hide rating section after submitting
  el('rating-section').style.display = 'none';

  const stars = getStarRating();

  QuizDB.saveResult({
    shopId: currentShopId,
    questionIndex: currentShopId - 1,
    correct: isCorrect,
    stars: stars,
    attempts: 1
  });

  if (isCorrect) {
    handleCorrect();
  } else {
    handleWrong();
  }
}

// ---- Correct -------------------------------------------------
function handleCorrect() {
  const state = QuizDB.getPlayerState();

  // FIX 3: push into array regardless of order — no sorting needed
  if (!state.completedShops.includes(currentShopId)) {
    state.completedShops.push(currentShopId);
  }
  state.revealedLetters[currentShopId - 1] = questionData.letter;

  const allDone = state.completedShops.length === 18;
  if (allDone) state.completed = true;

  QuizDB.savePlayerState(state);

  // Update counter & progress bar
  el('question-num').textContent  = `${state.completedShops.length} / 18`;
  el('progress-fill').style.width = (state.completedShops.length / 18 * 100) + '%';

  // Show result panel
  const panel = el('result-panel');
  panel.className = 'result-panel correct-panel visible fade-in-up';
  panel.innerHTML = `
    <div class="result-icon">✦</div>
    <div class="result-title correct-text">Correct!</div>
    <div class="result-subtitle">A hidden letter has been unveiled.</div>
    <div class="revealed-letter-spotlight">
      Letter revealed:
      <div class="revealed-letter-char">${questionData.letter}</div>
    </div>
  `;

  if (allDone) {
    // Special redirect to completion instead of index
    startCountdown(5, () => window.location.replace('completion.html'));
  } else {
    // FIX 5: auto-return to index.html after 5 seconds
    startCountdown(REDIRECT_DELAY, goHome);
  }
}

// ---- Wrong ---------------------------------------------------
function handleWrong() {
  const panel = el('result-panel');
  panel.className = 'result-panel wrong-panel visible fade-in-up';
  panel.innerHTML = `
    <div class="result-icon">✗</div>
    <div class="result-title wrong-text">Incorrect</div>
    <div class="result-subtitle">
      That was not the right answer.<br>
      Scan this shop's QR code again to retry.
    </div>
  `;

  // FIX 5: auto-return to index.html after 5 seconds
  startCountdown(REDIRECT_DELAY, goHome);
}

// ---- Countdown & auto-redirect --------------------------------
// FIX 5 implementation: counts down visually then calls callback
function startCountdown(seconds, callback) {
  el('countdown-wrap').style.display = 'block';
  el('submit-btn').style.display = 'none';

  let remaining = seconds;
  el('countdown-num').textContent = remaining;

  // Animate the bar shrinking
  // We give it one tick before shrinking so the transition fires
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el('countdown-bar').style.width = '0%';
    });
  });

  countdownTimer = setInterval(() => {
    remaining -= 1;
    el('countdown-num').textContent = remaining;
    if (remaining <= 0) {
      clearInterval(countdownTimer);
      callback();
    }
  }, 1000);
}

// ---- Star rating ---------------------------------------------
function getStarRating() {
  const checked = document.querySelector('.star-input:checked');
  return checked ? parseInt(checked.value, 10) : null;
}

function initStarRating() {
  document.querySelectorAll('.star-label').forEach(label => {
    // Touch support
    label.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const val = parseInt(label.dataset.value);
      document.getElementById(label.getAttribute('for')).checked = true;
      highlightStars(val);
    }, { passive: false });

    label.addEventListener('click', () => {
      highlightStars(parseInt(label.dataset.value));
    });
  });
}

function highlightStars(upTo) {
  document.querySelectorAll('.star-label').forEach(label => {
    label.classList.toggle('lit', parseInt(label.dataset.value) <= upTo);
  });
}

// ---- Already answered screen ---------------------------------
function showAlreadyAnswered(state) {
  const completedCount = state.completedShops.length;
  const container = document.querySelector('.container');
  if (!container) return;

  container.innerHTML = `
    <div class="app-header">
      <span class="app-logo">ミステリージャーニー</span>
      <span class="question-counter">${completedCount} / 18</span>
    </div>
    <div class="card fade-in-up">
      <div class="shop-badge"><span class="dot"></span><span>Shop ${String(currentShopId).padStart(2,'0')}</span></div>
      <div class="result-title correct-text" style="margin-bottom:10px;">Already Completed ✓</div>
      <p style="font-family:'Crimson Text',serif; font-size:1rem; color:var(--text-muted); line-height:1.8; font-style:italic;">
        You have already answered this shop's question correctly.<br>
        The letter <strong class="gold-text">${questionData.letter}</strong> has been added to your scroll.
      </p>
      <div id="countdown-wrap" style="margin-top:18px;">
        <p style="font-family:'Crimson Text',serif;font-style:italic;font-size:0.88rem;color:var(--text-muted);text-align:center;margin-bottom:6px;">
          Returning to scanner in <span id="countdown-num">5</span>s…
        </p>
        <div style="width:100%;height:4px;background:rgba(90,60,18,0.35);border-radius:2px;overflow:hidden;border:1px solid var(--border-dim);">
          <div id="countdown-bar" style="height:100%;width:100%;background:linear-gradient(90deg,var(--gold-dim),var(--gold-bright));border-radius:2px;transition:width 5s linear;"></div>
        </div>
        <button class="btn-home" onclick="window.location.href='index.html'" style="margin-top:10px;">← Back to Scanner Now</button>
      </div>
    </div>
  `;
  startCountdown(REDIRECT_DELAY, goHome);
}

// ---- Error screen --------------------------------------------
function showError(msg) {
  document.body.innerHTML = `
    <div class="error-wrapper">
      <div class="error-icon">⚠</div>
      <div class="error-title">Error</div>
      <div class="error-sub">${msg}</div>
      <div style="margin-top:20px; width:100%; max-width:280px;">
        <button class="btn-home" onclick="window.location.href='index.html'">← Back to Scanner</button>
      </div>
    </div>
  `;
}
