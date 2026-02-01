/**********************************************
 * ここからアプリ本体
 **********************************************/

// ★ ここにインポートした cards.json の中身を読み込む想定
// 例:
// let cards = [
//   { q: "JavaScriptで変数を宣言するキーワードは？", a: "let" },
//   { q: { type: "code-choice", question: "次のReactコンポーネントの出力は？", code: "...", choices: [...] }, a: "..." }
// ];

// ローカルファイル読み込み
document.getElementById("loadFileBtn").addEventListener("click", () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("cards.json を選択してください。");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      cards = JSON.parse(e.target.result);

      // 読み込んだ瞬間にランダム化
      shuffleCards();

      currentIndex = 0;
      renderCard();
      alert("cards.json を読み込みました！（ランダム化済み）");
    } catch (err) {
      alert("JSON の読み込みに失敗しました。");
    }
  };

  reader.readAsText(file);
});

// カードの出題順ランダム化
function shuffleCards() {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
}

let cards = []; // 実際は外部から読み込む前提
let currentIndex = 0;

// 保存済みカード（localStorage）
let savedCards = JSON.parse(localStorage.getItem("savedCards") || "[]");

// 初期化
window.addEventListener("load", () => {
  if (cards.length === 0) {
    document.getElementById("card-container").innerHTML = "<p>cards.json を読み込んでください。</p>";
  } else {
    renderCard();
  }
});

// カード描画
function renderCard() {
  if (cards.length === 0) {
    document.getElementById("card-container").innerHTML = "<p>カードがありません。</p>";
    document.getElementById("answerInput").style.display = "none";
    return;
  }

  const card = cards[currentIndex];
  const q = card.q;

  const container = document.getElementById("card-container");
  container.innerHTML = "";
  document.getElementById("result").textContent = "";
  document.getElementById("answerInput").value = "";

  // 通常モード
  if (typeof q === "string") {
    container.innerHTML = `<div class="question">${q}</div>`;
    showTextInput();
    return;
  }

  // 構文モード
  let html = `<div class="question">${q.question}</div>`;

  if (q.code) {
    html += `<pre class="code-block"><code>${q.code}</code></pre>`;
  }

  if (q.choices) {
    html += `<div class="choices">`;
    q.choices.forEach((c, i) => {
      html += `
        <label class="choice">
          <input type="radio" name="choice" value="${c}">
          ${i + 1}. ${c}
        </label>
      `;
    });
    html += `</div>`;
    hideTextInput();
  } else {
    showTextInput();
  }

  container.innerHTML = html;
}

// テキスト入力欄の表示/非表示
function showTextInput() {
  document.getElementById("answerInput").style.display = "block";
}
function hideTextInput() {
  document.getElementById("answerInput").style.display = "none";
}

// 答え合わせ
document.getElementById("checkBtn").addEventListener("click", () => {
  if (cards.length === 0) return;

  const card = cards[currentIndex];
  const correct = card.a;

  let userAnswer = null;

  const selected = document.querySelector("input[name='choice']:checked");
  if (selected) {
    userAnswer = selected.value;
  } else {
    userAnswer = document.getElementById("answerInput").value.trim();
  }

  const result = document.getElementById("result");
  if (userAnswer === correct) {
    result.textContent = "⭕ 正解！";
    result.style.color = "green";
  } else {
    result.textContent = `❌ 不正解… 正解は「${correct}」`;
    result.style.color = "red";
  }
});

// カード保存（保存後に現在のカードを削除）
document.getElementById("saveCardBtn").addEventListener("click", () => {
  if (cards.length === 0) return;

  const card = cards[currentIndex];
  const category = document.getElementById("categorySelect").value;

  savedCards.push({
    ...card,
    category: category
  });

  localStorage.setItem("savedCards", JSON.stringify(savedCards));

  cards.splice(currentIndex, 1);

  if (cards.length === 0) {
    document.getElementById("card-container").innerHTML = "<p>すべて保存しました！</p>";
    hideTextInput();
    return;
  }

  if (currentIndex >= cards.length) {
    currentIndex = cards.length - 1;
  }

  renderCard();
});

// 保存済みカード画面の開閉
document.getElementById("openSavedBtn").addEventListener("click", () => {
  document.getElementById("savedScreen").style.display = "block";
  document.getElementById("mainScreen").style.display = "none";
  renderSavedList();
});

document.getElementById("closeSavedBtn").addEventListener("click", () => {
  document.getElementById("savedScreen").style.display = "none";
  document.getElementById("mainScreen").style.display = "block";
});

// カテゴリフィルタ・検索
document.getElementById("categoryFilter").addEventListener("change", () => {
  renderSavedList();
});

document.getElementById("searchSaved").addEventListener("input", () => {
  renderSavedList();
});

// 保存済みカード一覧描画
function renderSavedList() {
  const list = document.getElementById("savedList");
  const filter = document.getElementById("categoryFilter").value;
  const keyword = document.getElementById("searchSaved").value.toLowerCase();

  list.innerHTML = "";

  updateCategoryFilter();

  savedCards
    .filter(card => filter === "all" || card.category === filter)
    .filter(card => {
      const text = typeof card.q === "string" ? card.q : card.q.question;
      return text.toLowerCase().includes(keyword);
    })
    .forEach((card, index) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <b>${index + 1}</b> [${card.category}]<br>
        ${typeof card.q === "string" ? card.q : card.q.question}
        <br>
        <button onclick="reimportCard(${index})">再インポート</button>
      `;
      list.appendChild(div);
    });
}

// カテゴリ一覧更新
function updateCategoryFilter() {
  const filter = document.getElementById("categoryFilter");
  const categories = [...new Set(savedCards.map(c => c.category))];

  const current = filter.value;

  filter.innerHTML = `<option value="all">すべてのカテゴリ</option>`;
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    filter.appendChild(opt);
  });

  if ([...filter.options].some(o => o.value === current)) {
    filter.value = current;
  }
}

// 再インポート
function reimportCard(index) {
  const card = savedCards[index];

  cards.push({
    q: card.q,
    a: card.a
  });

  savedCards.splice(index, 1);
  localStorage.setItem("savedCards", JSON.stringify(savedCards));

  renderSavedList();
}

// 保存済みカードをJSONでエクスポート
document.getElementById("exportSavedBtn").addEventListener("click", () => {
  const json = JSON.stringify(savedCards, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "saved_cards.json";
  a.click();

  URL.revokeObjectURL(url);
});

// スワイプ操作（左右でカード切り替え）
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", e => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener("touchend", e => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  if (document.getElementById("mainScreen").style.display === "none") return;

  const diff = touchEndX - touchStartX;
  if (Math.abs(diff) < 50) return;

  if (diff > 50) {
    if (currentIndex > 0) {
      currentIndex--;
      renderCard();
    }
  } else {
    if (currentIndex < cards.length - 1) {
      currentIndex++;
      renderCard();
    }
  }
}

// サービスワーカー登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('ServiceWorker registered:', reg.scope))
      .catch(err => console.warn('ServiceWorker registration failed:', err));
  });
}