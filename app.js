// app.js

const quizData = {
    1: { shop: "Shop 1 (Cafe)", question: "What is 2 + 2?", options: ["3", "4", "5", "6"], answer: "4", letter: "あ" },
    2: { shop: "Shop 2 (Haunted House)", question: "What color is the sky?", options: ["Blue", "Green", "Red", "Yellow"], answer: "Blue", letter: "か" },
    3: { shop: "Shop 3 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "つ" },
    4: { shop: "Shop 4 (Arcade)", question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], answer: "Paris", letter: "き" },
    5: { shop: "Shop 5 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "に" },
    6: { shop: "Shop 6 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "さ" },
    7: { shop: "Shop 7 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "け" },
    8: { shop: "Shop 8 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "わ" },
    9: { shop: "Shop 9 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "れ" },
    10: { shop: "Shop 10 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "ら" },
    11: { shop: "Shop 11 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "の" },
    12: { shop: "Shop 12 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "は" },
    13: { shop: "Shop 13 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "ま" },
    14: { shop: "Shop 14 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "ゆ" },
    15: { shop: "Shop 15 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "う" },
    16: { shop: "Shop 16 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "5" },
    17: { shop: "Shop 17 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "1" },
    18: { shop: "Shop 18 (Game Center)", question: "Capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: "Tokyo", letter: "7" },
};

let unlockedShops = JSON.parse(localStorage.getItem("festivalProgress")) || [];

// --- SCANNER LOGIC ---
const startScanBtn = document.getElementById('start-scan-btn');
const readerDiv = document.getElementById('reader');
let html5QrcodeScanner;

startScanBtn.addEventListener('click', () => {
    startScanBtn.style.display = 'none';
    readerDiv.style.display = 'block';
    document.getElementById('quiz-section').style.display = 'none';

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: {width: 250, height: 250} },
        false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});

function onScanSuccess(decodedText) {
    html5QrcodeScanner.clear().then(() => {
        readerDiv.style.display = 'none';
        startScanBtn.style.display = 'block';
        startScanBtn.innerText = "SCAN NEXT SHOP";

        let shopId = decodedText;
        if (decodedText.includes('?shop=')) {
            const url = new URL(decodedText);
            shopId = url.searchParams.get('shop');
        }

        if (quizData[shopId]) {
            if (unlockedShops.includes(shopId)) {
                document.getElementById('quiz-section').style.display = "block";
                document.getElementById('quiz-section').innerHTML = "<h2 style='color:#0f0;'>DATA ALREADY DECRYPTED.</h2>";
            } else {
                showQuiz(shopId);
            }
        } else {
            alert("SYSTEM ERROR: Invalid QR Code data.");
        }
    }).catch(error => {
        console.error("Failed to clear scanner: ", error);
    });
}

function onScanFailure(error) {}

// -------------------------

function initializeApp() {
    renderProgress();

    const urlParams = new URLSearchParams(window.location.search);
    const currentShopId = urlParams.get('shop');

    if (currentShopId && quizData[currentShopId]) {
        if (!unlockedShops.includes(currentShopId)) {
            showQuiz(currentShopId);
        }
    }
}

function showQuiz(shopId) {
    document.getElementById('quiz-section').style.display = "block";
    const data = quizData[shopId];

    document.getElementById('feedback-message').innerText = "";
    document.getElementById('shop-name').innerText = data.shop;
    document.getElementById('question-text').innerText = data.question;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.style.display = "flex";
    optionsContainer.innerHTML = '';

    data.options.forEach(option => {
        const btn = document.createElement('button');
        btn.innerText = option;
        btn.onclick = () => checkAnswer(option, data.answer, shopId);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selected, correct, shopId) {
    const feedback = document.getElementById('feedback-message');
    if (selected === correct) {
        feedback.style.color = "#0f0";
        feedback.innerText = "ACCESS GRANTED. Data unlocked.";

        unlockedShops.push(shopId);
        localStorage.setItem("festivalProgress", JSON.stringify(unlockedShops));

        document.getElementById('options-container').style.display = "none";
        renderProgress();
    } else {
        feedback.style.color = "#f00";
        feedback.innerText = "ACCESS DENIED. Try again.";
    }
}

function renderProgress() {
    const container = document.getElementById('letters-container');
    container.innerHTML = '';

    // Each row is defined as an ordered list of shop IDs.
    // Separators are inserted as plain text nodes between boxes.
    const rows = [
        // Row 1: 5／1・7  (shops 16, 17, 18)
        { shopIds: [16, 17, 18], separators: { after16: '／' } },
        // Row 2: あかつきにさけ、  (shops 1–7, trailing 、)
        { shopIds: [1, 2, 3, 4, 5, 6, 7], trailingChar: '、' },
        // Row 3: われらのはまゆう  (shops 8–15)
        { shopIds: [8, 9, 10, 11, 12, 13, 14, 15] },
    ];

    let totalUnlocked = 0;

    rows.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.style.cssText = 'display:flex; align-items:center; justify-content:center; gap:6px; width:100%; margin-bottom:8px;';

        row.shopIds.forEach((id, i) => {
            const box = document.createElement('div');
            box.classList.add('letter-box');

            if (quizData[id] && unlockedShops.includes(id.toString())) {
                box.innerText = quizData[id].letter;
                totalUnlocked++;
            } else {
                box.innerText = '?';
                box.classList.add('hidden-letter');
            }
            rowDiv.appendChild(box);

            // Insert separator after shop 16 (first item of row 1)
            if (rowIndex === 0 && id === 16) {
                const sep = document.createElement('span');
                sep.innerText = '／';
                sep.style.cssText = 'color:#0ff; font-size:20px; line-height:1;';
                rowDiv.appendChild(sep);
            }
        });

        // Trailing character at end of row (e.g. 、after row 2)
        if (row.trailingChar) {
            const trail = document.createElement('span');
            trail.innerText = row.trailingChar;
            trail.style.cssText = 'color:#0ff; font-size:20px; line-height:1;';
            rowDiv.appendChild(trail);
        }

        container.appendChild(rowDiv);
    });

    if (totalUnlocked === 18) {
        document.getElementById('completion-message').style.display = "block";
        document.getElementById('quiz-section').style.display = "none";
        startScanBtn.style.display = 'none';
    }
}

initializeApp();