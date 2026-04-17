// app.js

const quizData = {
    1:  { shop: "Shop 1 (Cafe)",         question: "What is 2 + 2?",          options: ["3","4","5","6"],                        answer: "4",      letter: "あ" },
    2:  { shop: "Shop 2 (Haunted House)", question: "What color is the sky?",  options: ["Blue","Green","Red","Yellow"],           answer: "Blue",   letter: "か" },
    3:  { shop: "Shop 3 (Game Center)",  question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "つ" },
    4:  { shop: "Shop 4 (Arcade)",       question: "What is the capital of France?", options: ["London","Berlin","Paris","Madrid"],answer: "Paris",  letter: "き" },
    5:  { shop: "Shop 5 (Game Center)",  question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "に" },
    6:  { shop: "Shop 6 (Game Center)",  question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "さ" },
    7:  { shop: "Shop 7 (Game Center)",  question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "け" },
    8:  { shop: "Shop 8 (Game Center)",  question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "わ" },
    9:  { shop: "Shop 9 (Game Center)",  question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "れ" },
    10: { shop: "Shop 10 (Game Center)", question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "ら" },
    11: { shop: "Shop 11 (Game Center)", question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "の" },
    12: { shop: "Shop 12 (Game Center)", question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "は" },
    13: { shop: "Shop 13 (Game Center)", question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "ま" },
    14: { shop: "Shop 14 (Game Center)", question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "ゆ" },
    15: { shop: "Shop 15 (Game Center)", question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "う" },
    16: { shop: "Shop 16 (Game Center)", question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "5" },
    17: { shop: "Shop 17 (Game Center)", question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "1" },
    18: { shop: "Shop 18 (Game Center)", question: "Capital of Japan?",        options: ["Osaka","Kyoto","Tokyo","Nagoya"],        answer: "Tokyo",  letter: "7" },
};

// ── Persistent progress (stored as array of number strings) ──────────────────
let unlockedShops = JSON.parse(localStorage.getItem("festivalProgress")) || [];

// ── DOM refs ─────────────────────────────────────────────────────────────────
const startScanBtn   = document.getElementById('start-scan-btn');
const readerDiv      = document.getElementById('reader');
const quizSection    = document.getElementById('quiz-section');
let html5QrcodeScanner = null;
let scannerRunning     = false;

// ── Scanner ───────────────────────────────────────────────────────────────────
startScanBtn.addEventListener('click', () => {
    if (scannerRunning) return;
    startScanBtn.style.display = 'none';
    readerDiv.style.display    = 'block';
    quizSection.style.display  = 'none';

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    scannerRunning = true;
});

function stopScanner() {
    if (!html5QrcodeScanner || !scannerRunning) return Promise.resolve();
    scannerRunning = false;
    return html5QrcodeScanner.clear().catch(err => console.warn("Scanner clear error:", err));
}

/**
 * Extract the numeric shop ID from whatever the QR code contains.
 * Handles all three common formats:
 *   "3"
 *   "https://kohoquizrally2026.onrender.com/?shop=3"
 *   "/?shop=3"
 */
function extractShopId(raw) {
    const trimmed = raw.trim();

    // Try to parse as a URL first (handles absolute URLs)
    try {
        const url = new URL(trimmed);
        const param = url.searchParams.get('shop');
        if (param) return param.trim();
    } catch (_) {}

    // Try relative URL pattern  /?shop=3  or  ?shop=3
    const match = trimmed.match(/[?&]shop=(\w+)/);
    if (match) return match[1];

    // Fall back: assume the raw text itself is the shop ID
    return trimmed;
}

function onScanSuccess(decodedText) {
    stopScanner().then(() => {
        readerDiv.style.display   = 'none';
        startScanBtn.style.display = 'block';
        startScanBtn.innerText    = 'SCAN NEXT SHOP';

        const shopId = extractShopId(decodedText);

        if (quizData[shopId]) {
            if (unlockedShops.includes(shopId)) {
                // Already answered — tell the user and let them scan again
                quizSection.style.display = 'block';
                quizSection.innerHTML =
                    `<h2 style="color:#0ff; margin-bottom:12px;">${quizData[shopId].shop}</h2>
                     <p style="color:#0f0; font-size:18px;">✔ DATA ALREADY DECRYPTED.</p>
                     <p style="color:#aaa; margin-top:8px;">Scan the next shop!</p>`;
            } else {
                showQuiz(shopId);
            }
        } else {
            // Unknown ID — show it so you can debug
            quizSection.style.display = 'block';
            quizSection.innerHTML =
                `<p style="color:#f00;">SYSTEM ERROR: Unrecognized shop ID "<strong>${shopId}</strong>".<br>
                 Raw QR data: <code style="word-break:break-all;">${decodedText}</code></p>`;
        }
    });
}

function onScanFailure(_error) {
    // The library fires this constantly while scanning — intentionally silent.
}

// ── Quiz display ──────────────────────────────────────────────────────────────
function showQuiz(shopId) {
    quizSection.style.display = 'block';
    // Restore original inner HTML structure in case it was replaced by an error msg
    quizSection.innerHTML = `
        <h2 id="shop-name"></h2>
        <p id="question-text"></p>
        <div id="options-container" class="options-grid"></div>
        <p id="feedback-message"></p>
    `;

    const data = quizData[shopId];
    document.getElementById('shop-name').innerText    = data.shop;
    document.getElementById('question-text').innerText = data.question;

    const optionsContainer = document.getElementById('options-container');
    data.options.forEach(option => {
        const btn = document.createElement('button');
        btn.innerText = option;
        btn.onclick   = () => checkAnswer(option, data.answer, shopId);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selected, correct, shopId) {
    const feedback = document.getElementById('feedback-message');
    if (selected === correct) {
        feedback.style.color  = '#0f0';
        feedback.innerText    = 'ACCESS GRANTED. Data unlocked.';

        if (!unlockedShops.includes(shopId)) {
            unlockedShops.push(shopId);
            localStorage.setItem("festivalProgress", JSON.stringify(unlockedShops));
        }

        document.getElementById('options-container').style.display = 'none';
        renderProgress();
    } else {
        feedback.style.color = '#f00';
        feedback.innerText   = 'ACCESS DENIED. Try again.';
    }
}

// ── Progress grid ─────────────────────────────────────────────────────────────
function renderProgress() {
    const container = document.getElementById('letters-container');
    container.innerHTML = '';

    // Fixed display layout:
    //  Row 1: [16]=5  ／  [17]=1  [18]=7
    //  Row 2: [1]あ [2]か [3]つ [4]き [5]に [6]さ [7]け 、
    //  Row 3: [8]わ [9]れ [10]ら [11]の [12]は [13]ま [14]ゆ [15]う
    const rows = [
        { shopIds: [16, 17, 18], separatorAfter: 16, separator: '／' },
        { shopIds: [1, 2, 3, 4, 5, 6, 7],            trailingChar: '、' },
        { shopIds: [8, 9, 10, 11, 12, 13, 14, 15] },
    ];

    let totalUnlocked = 0;

    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.style.cssText =
            'display:flex; align-items:center; justify-content:center; gap:6px; width:100%; margin-bottom:8px;';

        row.shopIds.forEach(id => {
            const box = document.createElement('div');
            box.classList.add('letter-box');

            const unlocked = unlockedShops.includes(id.toString());
            if (quizData[id] && unlocked) {
                box.innerText = quizData[id].letter;
                totalUnlocked++;
            } else {
                box.innerText = '?';
                box.classList.add('hidden-letter');
            }
            rowDiv.appendChild(box);

            // Insert mid-row separator (e.g. ／ after shop 16)
            if (row.separatorAfter && id === row.separatorAfter) {
                const sep = document.createElement('span');
                sep.innerText      = row.separator;
                sep.style.cssText  = 'color:#0ff; font-size:22px; line-height:1;';
                rowDiv.appendChild(sep);
            }
        });

        // Trailing character at end of row (e.g. 、)
        if (row.trailingChar) {
            const trail = document.createElement('span');
            trail.innerText     = row.trailingChar;
            trail.style.cssText = 'color:#0ff; font-size:22px; line-height:1;';
            rowDiv.appendChild(trail);
        }

        container.appendChild(rowDiv);
    });

    if (totalUnlocked === 18) {
        document.getElementById('completion-message').style.display = 'block';
        quizSection.style.display  = 'none';
        startScanBtn.style.display = 'none';
    }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
function initializeApp() {
    renderProgress();

    // Support direct URL access (e.g. testing in browser)
    const shopId = new URLSearchParams(window.location.search).get('shop');
    if (shopId && quizData[shopId] && !unlockedShops.includes(shopId)) {
        showQuiz(shopId);
    }
}

initializeApp();